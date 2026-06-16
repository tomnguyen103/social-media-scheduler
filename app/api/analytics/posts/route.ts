import { auth } from "@clerk/nextjs/server";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { posts, connectedAccounts } from "@/lib/db/schema";
import { getOrUpdatePostAnalytics } from "@/lib/analytics";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";

  try {
    const db = getDb();

    // 1. Calculate Date Range
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (range === "7d") {
      startDate.setDate(endDate.getDate() - 7);
    } else if (range === "90d") {
      startDate.setDate(endDate.getDate() - 90);
    } else if (range === "custom") {
      const startParam = searchParams.get("start");
      const endParam = searchParams.get("end");
      if (startParam) startDate = new Date(startParam);
      if (endParam) endDate = new Date(endParam);
    } else {
      // Default 30d
      startDate.setDate(endDate.getDate() - 30);
    }

    startDate.setHours(0, 0, 0, 0);
    if (range !== "custom" || !searchParams.get("end")) {
      endDate.setHours(23, 59, 59, 999);
    }

    // 2. Fetch Connected Accounts Map
    const userAccounts = await db.query.connectedAccounts.findMany({
      where: eq(connectedAccounts.clerkUserId, userId),
    });

    const accountsMap = new Map(userAccounts.map(acc => [acc.id, acc]));

    // 3. Fetch Posts in Range (Sorted by publish date descending)
    const userPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.clerkUserId, userId),
        eq(posts.status, "published"),
        gte(posts.publishedAt, startDate),
        lte(posts.publishedAt, endDate)
      ),
      with: {
        targets: true,
      },
      orderBy: [desc(posts.publishedAt)],
    });

    // 4. Gather Post Analytics
    const postsWithAnalytics = [];

    for (const post of userPosts) {
      let postReach = 0;
      let postEngagement = 0;
      const platforms = [];

      for (const target of post.targets) {
        const account = accountsMap.get(target.connectedAccountId);
        if (!account) continue;

        platforms.push(account.platform);

        // Fetch or cache analytics
        const targetAnalytics = await getOrUpdatePostAnalytics(
          db,
          { id: target.id, platformPostId: target.platformPostId, platform: account.platform },
          account,
          post.publishedAt
        );

        postReach += targetAnalytics.reach;
        postEngagement += targetAnalytics.engagement;
      }

      const engagementRate = postReach > 0 ? (postEngagement / postReach) * 100 : 0;

      postsWithAnalytics.push({
        id: post.id,
        content: post.content,
        mediaUrls: post.mediaUrls,
        publishedAt: post.publishedAt,
        platforms,
        reach: postReach,
        engagement: postEngagement,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
      });
    }

    return NextResponse.json({ posts: postsWithAnalytics });
  } catch (error) {
    console.error("Failed to fetch post analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch post analytics" },
      { status: 500 }
    );
  }
}
