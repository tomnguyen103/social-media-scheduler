import { auth } from "@clerk/nextjs/server";
import { and, eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { posts, postTargets, scheduledJobs } from "@/lib/db/schema";
import { getPostPublisherQueue } from "@/lib/bullmq/queues";
import { checkPostLimit, PlanLimitError } from "@/lib/billing/guards";

// GET /api/posts - list user's posts with filters
export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  try {
    const db = getDb();
    const whereConditions = [eq(posts.clerkUserId, userId)];

    if (statusFilter) {
      whereConditions.push(
        eq(
          posts.status,
          statusFilter as "draft" | "scheduled" | "published" | "failed"
        )
      );
    }

    const userPosts = await db.query.posts.findMany({
      where: and(...whereConditions),
      orderBy: [desc(posts.createdAt)],
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

    return NextResponse.json({ posts: userPosts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts - creates post + postTargets, enqueues BullMQ job if scheduled or publish now
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, mediaUrls, status, scheduledAt, platformAccountIds } =
      await request.json();

    // Check plan limits
    try {
      await checkPostLimit(userId);
    } catch (err) {
      if (err instanceof PlanLimitError) {
        return NextResponse.json(
          { error: err.message },
          { status: 403 }
        );
      }
      throw err;
    }

    // Validation
    const isPublishingOrScheduling =
      status === "scheduled" || status === "published";
    if (
      isPublishingOrScheduling &&
      (!platformAccountIds || platformAccountIds.length === 0)
    ) {
      return NextResponse.json(
        { error: "At least one platform must be selected to publish or schedule." },
        { status: 400 }
      );
    }

    if (status === "scheduled" && !scheduledAt) {
      return NextResponse.json(
        { error: "Scheduled time is required for scheduled posts." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Determine initial post status
    // If "published" (publish now), we set status in DB to "scheduled" and schedule it for immediate execution
    const initialStatus = status === "published" ? "scheduled" : status;
    const postScheduledAt =
      status === "published"
        ? new Date()
        : scheduledAt
          ? new Date(scheduledAt)
          : null;

    // Create post
    const [newPost] = await db
      .insert(posts)
      .values({
        clerkUserId: userId,
        content: content || "",
        mediaUrls: mediaUrls || [],
        status: initialStatus || "draft",
        scheduledAt: postScheduledAt,
      })
      .returning();

    // Create post targets
    if (platformAccountIds && platformAccountIds.length > 0) {
      const targets = platformAccountIds.map((accountId: string) => ({
        postId: newPost.id,
        connectedAccountId: accountId,
        status: "pending" as const,
      }));
      await db.insert(postTargets).values(targets);
    }

    // Schedule job if applicable
    if (isPublishingOrScheduling) {
      const targetTime = postScheduledAt ? postScheduledAt.getTime() : Date.now();
      const delay = Math.max(0, targetTime - Date.now());

      const queue = getPostPublisherQueue();
      const job = await queue.add(
        "publishPost",
        { postId: newPost.id },
        { delay }
      );

      // Insert scheduled job record
      await db.insert(scheduledJobs).values({
        postId: newPost.id,
        bullmqJobId: job.id!,
        scheduledAt: postScheduledAt || new Date(),
        status: "waiting",
      });
    }

    // Re-fetch post with relations to return complete response
    const createdPost = await db.query.posts.findFirst({
      where: eq(posts.id, newPost.id),
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

    return NextResponse.json({ post: createdPost }, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
