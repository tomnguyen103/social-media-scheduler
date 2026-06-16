import { Worker } from "bullmq";
import { eq, and, sql } from "drizzle-orm";

import {
  getRedisConnectionOptions,
  queueNames,
  getAutoReplyQueue,
  type CommentPollerJobData,
} from "@/lib/bullmq/queues";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { fetchRecentComments, type SupportedPlatform } from "@/lib/platforms";
import { getUserPlan } from "@/lib/plan";

export const commentPollerWorker = new Worker<CommentPollerJobData | Record<string, never>>(
  queueNames.commentPoller,
  async (job) => {
    console.log("[Comment Poller Worker] Starting comment polling...");
    const db = getDb();
    const autoReplyQueue = getAutoReplyQueue();

    // 1. Fetch all active rules
    const activeRules = await db.query.autoReplyRules.findMany({
      where: eq(schema.autoReplyRules.isActive, true),
    });

    if (activeRules.length === 0) {
      console.log("[Comment Poller Worker] No active auto-reply rules found. Skipping.");
      return;
    }

    // Check if the job targets a specific account or polls all
    const targetAccountId = (job.data as CommentPollerJobData)?.connectedAccountId;
    let accountsToPoll: schema.ConnectedAccount[] = [];

    if (targetAccountId) {
      const account = await db.query.connectedAccounts.findFirst({
        where: eq(schema.connectedAccounts.id, targetAccountId),
      });
      if (account) {
        accountsToPoll = [account];
      }
    } else {
      // Find all unique account IDs referenced by active rules
      const referencedAccountIds = new Set<string>();
      for (const rule of activeRules) {
        if (rule.platformAccountIds) {
          rule.platformAccountIds.forEach((id) => referencedAccountIds.add(id));
        }
      }

      if (referencedAccountIds.size === 0) {
        console.log("[Comment Poller Worker] No accounts linked in active rules. Skipping.");
        return;
      }

      // Fetch all referenced accounts
      accountsToPoll = await db.query.connectedAccounts.findMany({
        where: sql`${schema.connectedAccounts.id} IN (${sql.join(
          Array.from(referencedAccountIds).map((id) => sql`${id}`),
          sql`, `
        )})`,
      });
    }

    console.log(`[Comment Poller Worker] Found ${accountsToPoll.length} accounts to process.`);

    for (const account of accountsToPoll) {
      try {
        const plan = await getUserPlan(account.clerkUserId);

        // Enforce cron poll interval: Free plan is 30 mins, Pro+ is 5 mins
        if (plan === "free" && account.lastPolledAt) {
          const now = Date.now();
          const elapsedMinutes = (now - account.lastPolledAt.getTime()) / (1000 * 60);
          if (elapsedMinutes < 25) {
            console.log(
              `[Comment Poller Worker] Skipping free account ${account.id} (${account.platform}) - polled ${elapsedMinutes.toFixed(1)} mins ago.`
            );
            continue;
          }
        }

        console.log(
          `[Comment Poller Worker] Polling comments for ${account.platform} account: ${account.platformUsername} (${account.id})`
        );

        // Fetch user's published posts
        const userPosts = await db.query.posts.findMany({
          where: eq(schema.posts.clerkUserId, account.clerkUserId),
        });

        const postIds = userPosts.map((p) => p.id);
        if (postIds.length === 0) {
          console.log(`[Comment Poller Worker] No posts found for user ${account.clerkUserId}.`);
          // Update lastPolledAt even if there are no posts
          await db
            .update(schema.connectedAccounts)
            .set({ lastPolledAt: new Date() })
            .where(eq(schema.connectedAccounts.id, account.id));
          continue;
        }

        // Find targets that are successfully published on this account
        const publishedTargets = await db.query.postTargets.findMany({
          where: sql`${schema.postTargets.postId} IN (${sql.join(
            postIds.map((id) => sql`${id}`),
            sql`, `
          )}) AND ${schema.postTargets.connectedAccountId} = ${account.id} AND ${schema.postTargets.status} = 'published' AND ${schema.postTargets.platformPostId} IS NOT NULL`,
        });

        console.log(
          `[Comment Poller Worker] Found ${publishedTargets.length} published targets on this account.`
        );

        for (const target of publishedTargets) {
          const platformPostId = target.platformPostId!;
          
          // Fetch recent comments for this post
          const comments = await fetchRecentComments(
            account.platform as SupportedPlatform,
            account.accessToken,
            platformPostId,
            account.platformUserId
          );

          if (comments.length === 0) {
            continue;
          }

          // Evaluate each comment against the active rules that apply to this account
          const rulesForAccount = activeRules.filter(
            (r) => r.platformAccountIds?.includes(account.id)
          );

          for (const rule of rulesForAccount) {
            for (const comment of comments) {
              // 1. Check if we already replied to this comment for this rule
              const existingLog = await db.query.autoReplyLogs.findFirst({
                where: and(
                  eq(schema.autoReplyLogs.commentId, comment.id),
                  eq(schema.autoReplyLogs.ruleId, rule.id)
                ),
              });

              if (existingLog) {
                // Comment already processed for this rule
                continue;
              }

              // 2. Evaluate trigger condition
              let isMatched = false;

              if (rule.triggerType === "keyword_match") {
                const commentTextLower = comment.text.toLowerCase();
                isMatched = rule.keywords.some((kw) =>
                  commentTextLower.includes(kw.toLowerCase())
                );
              } else if (rule.triggerType === "any_comment") {
                isMatched = true;
              } else if (rule.triggerType === "first_comment") {
                // Check if we have already replied to any comment on this post target under this rule
                const postReplyLog = await db.query.autoReplyLogs.findFirst({
                  where: and(
                    eq(schema.autoReplyLogs.ruleId, rule.id),
                    eq(schema.autoReplyLogs.postId, platformPostId)
                  ),
                });

                if (!postReplyLog) {
                  // Sort comments to find the earliest
                  const sortedComments = [...comments].sort(
                    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                  );
                  const earliestComment = sortedComments[0];
                  if (earliestComment && earliestComment.id === comment.id) {
                    isMatched = true;
                  }
                }
              }

              // 3. Enqueue auto-reply job if matched
              if (isMatched) {
                console.log(
                  `[Comment Poller Worker] Comment ${comment.id} matched rule "${rule.name}" (${rule.triggerType}). Enqueuing auto-reply job...`
                );
                
                await autoReplyQueue.add("sendAutoReply", {
                  ruleId: rule.id,
                  commentId: comment.id,
                  connectedAccountId: account.id,
                  commentText: comment.text,
                  commentUsername: comment.username,
                  platformPostId: platformPostId,
                });
              }
            }
          }
        }

        // Update the account's lastPolledAt timestamp
        await db
          .update(schema.connectedAccounts)
          .set({ lastPolledAt: new Date() })
          .where(eq(schema.connectedAccounts.id, account.id));

        console.log(`[Comment Poller Worker] Completed polling for account: ${account.id}`);
      } catch (error) {
        console.error(
          `[Comment Poller Worker] Error polling account ${account.id} (${account.platform}):`,
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

commentPollerWorker.on("failed", (job, err) => {
  console.error(`[Comment Poller Worker] Job failed: ${job?.id}. Error: ${err.message}`);
});

commentPollerWorker.on("completed", (job) => {
  console.log(`[Comment Poller Worker] Job completed successfully: ${job?.id}`);
});
