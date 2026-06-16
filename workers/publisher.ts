import { Worker, Queue } from "bullmq";
import { eq } from "drizzle-orm";

import { getRedisConnectionOptions, queueNames, type PublishPostJobData } from "@/lib/bullmq/queues";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { publishToPlatform, type SupportedPlatform } from "@/lib/platforms";
import { sendFailureEmail } from "@/lib/email/client";

// Create Dead Letter Queue (DLQ)
const dlqQueue = new Queue("post-publisher-dlq", {
  connection: getRedisConnectionOptions(),
});

export const publisherWorker = new Worker<PublishPostJobData>(
  queueNames.postPublisher,
  async (job) => {
    const { postId } = job.data;
    console.log(`[Publisher Worker] Processing post ${postId}, attempt ${job.attemptsMade + 1}`);

    const db = getDb();

    // 1. Fetch post + postTargets + connectedAccounts
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, postId),
      with: {
        targets: {
          with: {
            connectedAccount: true,
          },
        },
      },
    });

    if (!post) {
      console.warn(`[Publisher Worker] Post ${postId} not found. Skipping.`);
      return;
    }

    // Filter targets that are not already published (for retry idempotency)
    const pendingTargets = post.targets.filter(
      (target) => target.status === "pending" || target.status === "failed"
    );

    if (pendingTargets.length === 0) {
      console.log(`[Publisher Worker] Post ${postId} has no pending/failed targets. Already completed.`);
      return;
    }

    // Update scheduledJob status to active
    await db
      .update(schema.scheduledJobs)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(schema.scheduledJobs.postId, postId))
      .catch(() => {}); // ignore if no scheduledJob record exists (e.g. published immediately)

    let succeededCount = post.targets.filter((t) => t.status === "published").length;
    let failedCount = 0;
    const targetErrors: Array<{ targetId: string; platform: string; error: string }> = [];

    for (const target of pendingTargets) {
      const platform = target.connectedAccount.platform;
      console.log(`[Publisher Worker] Publishing to platform ${platform} for target ${target.id}`);

      try {
        const platformPostId = await publishToPlatform(
          platform as SupportedPlatform,
          target.connectedAccount.accessToken,
          post.content,
          post.mediaUrls,
          target.connectedAccount.platformUserId
        );

        // Update target status in DB to published
        await db
          .update(schema.postTargets)
          .set({
            status: "published",
            platformPostId,
            errorMessage: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.postTargets.id, target.id));

        succeededCount++;
      } catch (error) {
        const err = error as Error;
        console.error(`[Publisher Worker] Failed to publish to ${platform} for target ${target.id}:`, err);
        failedCount++;
        const errorMsg = err.message || String(err);
        targetErrors.push({ targetId: target.id, platform, error: errorMsg });

        // Update target status in DB to failed
        await db
          .update(schema.postTargets)
          .set({
            status: "failed",
            errorMessage: errorMsg,
            updatedAt: new Date(),
          })
          .where(eq(schema.postTargets.id, target.id));
      }
    }

    const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 3);

    if (failedCount > 0) {
      if (!isFinalAttempt) {
        // Throwing error triggers BullMQ's automatic retry mechanism
        throw new Error(
          `Publishing failed for ${failedCount} targets. Errors: ${targetErrors
            .map((e) => `${e.platform}: ${e.error}`)
            .join("; ")}`
        );
      } else {
        // Final attempt failed. Mark the overall post status
        const finalPostStatus = succeededCount > 0 ? "partial_failure" : "failed";
        
        await db
          .update(schema.posts)
          .set({
            status: finalPostStatus,
            updatedAt: new Date(),
          })
          .where(eq(schema.posts.id, postId));

        // Update scheduledJob status to failed
        await db
          .update(schema.scheduledJobs)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(schema.scheduledJobs.postId, postId))
          .catch(() => {});

        // Push failed job details into the Dead Letter Queue
        await dlqQueue.add("failedPublish", {
          postId,
          attempts: job.attemptsMade + 1,
          failedTargets: targetErrors,
          failedAt: new Date().toISOString(),
        });

        console.log(`[Publisher Worker] Post ${postId} permanently failed with status '${finalPostStatus}'. DLQ updated.`);

        // Phase 2: Dispatch failure notification email if user settings allow it
        try {
          const user = await db.query.users.findFirst({
            where: eq(schema.users.clerkUserId, post.clerkUserId),
          });
          
          if (user && user.emailOnFailure && user.email) {
            await sendFailureEmail(user.email, post.content, targetErrors);
          }
        } catch (emailErr) {
          console.error(`[Publisher Worker] Failed to send publication failure email alert:`, emailErr);
        }
      }
    } else {
      // All targets published successfully
      await db
        .update(schema.posts)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.posts.id, postId));

      // Update scheduledJob status to completed
      await db
        .update(schema.scheduledJobs)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(schema.scheduledJobs.postId, postId))
        .catch(() => {});

      console.log(`[Publisher Worker] Post ${postId} successfully published to all platforms.`);
    }
  },
  {
    connection: getRedisConnectionOptions(),
    concurrency: 5,
  }
);

publisherWorker.on("failed", (job, err) => {
  console.error(`[Publisher Worker] Job failed: ${job?.id}. Error: ${err.message}`);
});

publisherWorker.on("completed", (job) => {
  console.log(`[Publisher Worker] Job completed successfully: ${job.id}`);
});
