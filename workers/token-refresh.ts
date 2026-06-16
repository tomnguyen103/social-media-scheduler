import { Worker } from "bullmq";
import { eq, and, lte, isNotNull } from "drizzle-orm";

import { getRedisConnectionOptions, queueNames, type TokenRefreshJobData } from "@/lib/bullmq/queues";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { refreshPlatformToken, type SupportedPlatform } from "@/lib/platforms";
import { encrypt } from "@/lib/crypto";

export const tokenRefreshWorker = new Worker<TokenRefreshJobData | Record<string, never>>(
  queueNames.tokenRefresh,
  async (job) => {
    console.log("[Token Refresh Worker] Starting token refresh check...");
    const db = getDb();
    
    // Find tokens expiring within the next 24 hours
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let accountsToRefresh: schema.ConnectedAccount[] = [];

    // Check if job data targets a specific account, or does a general refresh
    const targetAccountId = (job.data as TokenRefreshJobData)?.connectedAccountId;

    if (targetAccountId) {
      const account = await db.query.connectedAccounts.findFirst({
        where: eq(schema.connectedAccounts.id, targetAccountId),
      });
      if (account) {
        accountsToRefresh = [account];
      }
    } else {
      accountsToRefresh = await db.query.connectedAccounts.findMany({
        where: and(
          isNotNull(schema.connectedAccounts.expiresAt),
          lte(schema.connectedAccounts.expiresAt, twentyFourHoursFromNow)
        ),
      });
    }

    console.log(`[Token Refresh Worker] Found ${accountsToRefresh.length} accounts to process.`);

    for (const account of accountsToRefresh) {
      console.log(
        `[Token Refresh Worker] Refreshing token for account: ${account.id} (${account.platform} - ${account.platformUsername})`
      );

      try {
        // Decrypt parameters inside platforms client
        const refreshResult = await refreshPlatformToken(
          account.platform as SupportedPlatform,
          account.refreshToken,
          account.accessToken
        );

        // Encrypt the newly retrieved tokens before storing
        const encryptedAccessToken = encrypt(refreshResult.accessToken);
        const encryptedRefreshToken = refreshResult.refreshToken
          ? encrypt(refreshResult.refreshToken)
          : account.refreshToken; // retain old refresh token if not rotated

        // Update the account details in the database
        await db
          .update(schema.connectedAccounts)
          .set({
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            expiresAt: refreshResult.expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(schema.connectedAccounts.id, account.id));

        console.log(
          `[Token Refresh Worker] Successfully refreshed token for ${account.platform} account: ${account.id}`
        );
      } catch (error) {
        console.error(
          `[Token Refresh Worker] Failed to refresh token for ${account.platform} account ${account.id}:`,
          error
        );
      }
    }
  },
  {
    connection: getRedisConnectionOptions(),
    concurrency: 2,
  }
);

tokenRefreshWorker.on("failed", (job, err) => {
  console.error(`[Token Refresh Worker] Job failed: ${job?.id}. Error: ${err.message}`);
});

tokenRefreshWorker.on("completed", (job) => {
  console.log(`[Token Refresh Worker] Job completed successfully: ${job?.id}`);
});
