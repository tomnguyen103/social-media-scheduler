import { auth } from "@clerk/nextjs/server";
import { Queue } from "bullmq";
import { NextResponse } from "next/server";

import {
  getQueues,
  getRedisConnectionOptions,
  getPostPublisherQueue,
} from "@/lib/bullmq/queues";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Check if user is admin or if we are in development mode
  const claims = sessionClaims as unknown as {
    metadata?: { role?: string };
    publicMetadata?: { role?: string };
  };
  const role = claims?.metadata?.role || claims?.publicMetadata?.role;
  const isDev = process.env.NODE_ENV === "development";

  if (role !== "admin" && !isDev) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let dlqQueue: Queue | null = null;
  try {
    const queues = getQueues();
    const connection = getRedisConnectionOptions();
    
    // Instantiate reference to the Dead Letter Queue
    dlqQueue = new Queue("post-publisher-dlq", { connection });

    const queueDetails = await Promise.all(
      Object.entries(queues).map(async ([name, queue]) => {
        const counts = await queue.getJobCounts();
        
        // Retrieve last 15 failed and active jobs
        const failedJobs = await queue.getJobs(["failed"], 0, 14);
        const activeJobs = await queue.getJobs(["active"], 0, 14);
        const delayedJobs = await queue.getJobs(["delayed"], 0, 14);

        return {
          name,
          counts,
          failed: failedJobs.map((j) => ({
            id: j.id,
            name: j.name,
            data: j.data,
            failedReason: j.failedReason,
            finishedOn: j.finishedOn ? new Date(j.finishedOn).toISOString() : null,
          })),
          active: activeJobs.map((j) => ({
            id: j.id,
            name: j.name,
            data: j.data,
            processedOn: j.processedOn ? new Date(j.processedOn).toISOString() : null,
          })),
          delayed: delayedJobs.map((j) => ({
            id: j.id,
            name: j.name,
            data: j.data,
            timestamp: j.timestamp ? new Date(j.timestamp).toISOString() : null,
          })),
        };
      })
    );

    // Fetch jobs present in DLQ
    const dlqCounts = await dlqQueue.getJobCounts();
    const dlqJobs = await dlqQueue.getJobs(["waiting", "active", "completed", "failed", "delayed"], 0, 24);
    const dlqFormatted = dlqJobs.map((j) => ({
      id: j.id,
      name: j.name,
      data: j.data,
      timestamp: j.timestamp ? new Date(j.timestamp).toISOString() : null,
    }));

    return NextResponse.json({
      queues: queueDetails,
      dlq: {
        counts: dlqCounts,
        jobs: dlqFormatted,
      },
    });
  } catch (error) {
    console.error("[Queue Admin API] Failed to fetch queue statuses:", error);
    return NextResponse.json({ error: "Failed to load queue metrics." }, { status: 500 });
  } finally {
    if (dlqQueue) {
      await dlqQueue.close();
    }
  }
}

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Check if user is admin or if we are in development mode
  const claims = sessionClaims as unknown as {
    metadata?: { role?: string };
    publicMetadata?: { role?: string };
  };
  const role = claims?.metadata?.role || claims?.publicMetadata?.role;
  const isDev = process.env.NODE_ENV === "development";

  if (role !== "admin" && !isDev) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let dlqQueue: Queue | null = null;
  try {
    const { action, queueName, jobId } = await request.json();

    if (action === "retry") {
      const queues = getQueues();
      const queue = queues[queueName as keyof typeof queues];
      if (!queue) {
        return NextResponse.json({ error: "Target queue not found." }, { status: 404 });
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return NextResponse.json({ error: "Target job not found." }, { status: 404 });
      }

      await job.retry();
      console.log(`[Queue Admin API] Job ${jobId} retried successfully on ${queueName}.`);
      return NextResponse.json({ success: true });
    }

    if (action === "retry-dlq") {
      const connection = getRedisConnectionOptions();
      dlqQueue = new Queue("post-publisher-dlq", { connection });
      const job = await dlqQueue.getJob(jobId);

      if (!job) {
        return NextResponse.json({ error: "DLQ Job not found." }, { status: 404 });
      }

      const { postId } = job.data;
      if (!postId) {
        return NextResponse.json({ error: "Invalid DLQ job data: missing postId." }, { status: 400 });
      }

      // Re-add post publishing payload back to post-publisher queue
      const publisherQueue = getPostPublisherQueue();
      await publisherQueue.add(
        "publishPost",
        { postId },
        { jobId: `dlq-retry:${postId}` }
      );

      // Remove from DLQ
      await job.remove();

      console.log(`[Queue Admin API] Post ${postId} re-enqueued from DLQ successfully.`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action parameter." }, { status: 400 });
  } catch (error) {
    console.error("[Queue Admin API] Execution failed:", error);
    return NextResponse.json({ error: "Action execution failed." }, { status: 500 });
  } finally {
    if (dlqQueue) {
      await dlqQueue.close();
    }
  }
}
