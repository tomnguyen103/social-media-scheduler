import { auth } from "@clerk/nextjs/server";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // Expected YYYY-MM

  try {
    let startDate: Date;
    let endDate: Date;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [yearStr, monthStr] = monthParam.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      // Start of month (UTC)
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      // End of month (UTC)
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
    }

    // Apply 7-day padding on both sides to catch overlap days in calendar view grid
    const queryStart = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const queryEnd = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const db = getDb();

    const calendarPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.clerkUserId, userId),
        or(
          and(gte(posts.scheduledAt, queryStart), lte(posts.scheduledAt, queryEnd)),
          and(gte(posts.publishedAt, queryStart), lte(posts.publishedAt, queryEnd)),
          and(gte(posts.createdAt, queryStart), lte(posts.createdAt, queryEnd))
        )
      ),
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
      },
    });

    const formattedPosts = calendarPosts.map((post) => ({
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      status: post.status,
      scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      createdAt: post.createdAt.toISOString(),
      targets: post.targets.map((t) => ({
        id: t.id,
        connectedAccountId: t.connectedAccountId,
        status: t.status,
        errorMessage: t.errorMessage,
        platform: t.connectedAccount.platform,
        platformUsername: t.connectedAccount.platformUsername,
      })),
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Failed to fetch calendar posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar posts" },
      { status: 500 }
    );
  }
}
