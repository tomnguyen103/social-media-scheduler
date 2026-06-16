import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { posts, postTargets, scheduledJobs } from "@/lib/db/schema";
import { getPostPublisherQueue } from "@/lib/bullmq/queues";

// PUT /api/posts/[id] - update post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  if (!postId) {
    return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
  }

  try {
    const db = getDb();

    // Verify user owns the post
    const existingPost = await db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.clerkUserId, userId)),
      with: {
        scheduledJob: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found or unauthorized" },
        { status: 404 }
      );
    }

    const { content, mediaUrls, status, scheduledAt, platformAccountIds } =
      await request.json();

    const isPublishingOrScheduling =
      status === "scheduled" || status === "published";
    const initialStatus = status === "published" ? "scheduled" : status;
    const postScheduledAt =
      status === "published"
        ? new Date()
        : scheduledAt
          ? new Date(scheduledAt)
          : null;

    // 1. Update post details
    await db
      .update(posts)
      .set({
        content: content !== undefined ? content : existingPost.content,
        mediaUrls: mediaUrls !== undefined ? mediaUrls : existingPost.mediaUrls,
        status: initialStatus !== undefined ? initialStatus : existingPost.status,
        scheduledAt:
          postScheduledAt !== undefined
            ? postScheduledAt
            : existingPost.scheduledAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    // 2. Sync targets if platformAccountIds provided
    if (Array.isArray(platformAccountIds)) {
      // Delete old targets
      await db.delete(postTargets).where(eq(postTargets.postId, postId));

      // Insert new targets
      if (platformAccountIds.length > 0) {
        const targets = platformAccountIds.map((accountId: string) => ({
          postId,
          connectedAccountId: accountId,
          status: "pending" as const,
        }));
        await db.insert(postTargets).values(targets);
      }
    }

    // 3. Reschedule BullMQ Job if applicable
    // If status changed to draft, or scheduled details are modified, remove existing job
    const statusChanged = status && status !== existingPost.status;
    const timeChanged =
      scheduledAt &&
      existingPost.scheduledAt?.getTime() !==
        new Date(scheduledAt).getTime();

    if (existingPost.scheduledJob && (statusChanged || timeChanged || status === "draft")) {
      try {
        const queue = getPostPublisherQueue();
        const job = await queue.getJob(existingPost.scheduledJob.bullmqJobId);
        if (job) {
          await job.remove();
        }
      } catch (err) {
        console.warn("Failed to remove old BullMQ job:", err);
      }

      await db.delete(scheduledJobs).where(eq(scheduledJobs.postId, postId));
    }

    // Enqueue new job if scheduled or published now
    const needsNewJob =
      isPublishingOrScheduling &&
      (!existingPost.scheduledJob || statusChanged || timeChanged);

    if (needsNewJob) {
      const targetTime = postScheduledAt ? postScheduledAt.getTime() : Date.now();
      const delay = Math.max(0, targetTime - Date.now());

      const queue = getPostPublisherQueue();
      const job = await queue.add(
        "publishPost",
        { postId },
        { delay }
      );

      await db.insert(scheduledJobs).values({
        postId,
        bullmqJobId: job.id!,
        scheduledAt: postScheduledAt || new Date(),
        status: "waiting",
      });
    }

    // Return updated post
    const updatedPost = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      with: {
        targets: {
          with: {
            connectedAccount: {
              columns: {
                id: true,
                platform: true,
                platformUsername: true,
              },
            },
          },
        },
        scheduledJob: true,
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error(`Failed to update post ${postId}:`, error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  if (!postId) {
    return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
  }

  try {
    const db = getDb();

    // Verify user owns the post
    const existingPost = await db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.clerkUserId, userId)),
      with: {
        scheduledJob: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found or unauthorized" },
        { status: 404 }
      );
    }

    // Cancel BullMQ Job
    if (existingPost.scheduledJob) {
      try {
        const queue = getPostPublisherQueue();
        const job = await queue.getJob(existingPost.scheduledJob.bullmqJobId);
        if (job) {
          await job.remove();
        }
      } catch (err) {
        console.warn("Failed to remove BullMQ job on deletion:", err);
      }
    }

    // Delete post (will cascade delete postTargets and scheduledJobs in DB)
    await db.delete(posts).where(eq(posts.id, postId));

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
      deletedId: postId,
    });
  } catch (error) {
    console.error(`Failed to delete post ${postId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
