import { getTokenRefreshQueue, getCommentPollerQueue } from "@/lib/bullmq/queues";
import { publisherWorker } from "./publisher";
import { tokenRefreshWorker } from "./token-refresh";
import { commentPollerWorker } from "./comment-poller";
import { autoReplyWorker } from "./auto-reply";

async function initializeCronJobs() {
  try {
    const tokenRefreshQueue = getTokenRefreshQueue();

    // Remove old repeatable jobs with the same name to avoid duplicates
    const repeatableJobs = await tokenRefreshQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.name === "tokenRefreshCron") {
        console.log(`[Workers Index] Removing existing cron job: ${job.key}`);
        await tokenRefreshQueue.removeRepeatableByKey(job.key);
      }
    }

    // Add repeatable job to run every 6 hours
    // Cron pattern: "0 */6 * * *"
    await tokenRefreshQueue.add(
      "tokenRefreshCron",
      {},
      {
        repeat: {
          pattern: "0 */6 * * *",
        },
      }
    );

    console.log("[Workers Index] Successfully scheduled token refresh cron job (every 6 hours).");

    const commentPollerQueue = getCommentPollerQueue();

    // Remove old repeatable jobs with the same name to avoid duplicates
    const repeatablePollerJobs = await commentPollerQueue.getRepeatableJobs();
    for (const job of repeatablePollerJobs) {
      if (job.name === "commentPollerCron") {
        console.log(`[Workers Index] Removing existing cron job: ${job.key}`);
        await commentPollerQueue.removeRepeatableByKey(job.key);
      }
    }

    // Add repeatable job to run every 5 minutes
    // Cron pattern: "*/5 * * * *"
    await commentPollerQueue.add(
      "commentPollerCron",
      {},
      {
        repeat: {
          pattern: "*/5 * * * *",
        },
      }
    );

    console.log("[Workers Index] Successfully scheduled comment poller cron job (every 5 minutes).");
  } catch (error) {
    console.error("[Workers Index] Failed to initialize cron jobs:", error);
  }
}

// Start workers and initialize cron scheduling
console.log("[Workers Index] Starting all background workers...");
initializeCronJobs();

async function gracefulShutdown(signal: string) {
  console.log(`[Workers Index] Received ${signal}. Shutting down workers gracefully...`);
  try {
    await Promise.all([
      publisherWorker.close(),
      tokenRefreshWorker.close(),
      commentPollerWorker.close(),
      autoReplyWorker.close(),
    ]);
    console.log("[Workers Index] Workers closed successfully. Exiting.");
    process.exit(0);
  } catch (err) {
    console.error("[Workers Index] Error during graceful shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
