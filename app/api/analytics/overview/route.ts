import { auth } from "@clerk/nextjs/server";
import { and, eq, gte, lte } from "drizzle-orm";
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

    // Ensure start of day and end of day formatting
    startDate.setHours(0, 0, 0, 0);
    if (range !== "custom" || !searchParams.get("end")) {
      endDate.setHours(23, 59, 59, 999);
    }

    // 2. Fetch User's Accounts
    const userAccounts = await db.query.connectedAccounts.findMany({
      where: eq(connectedAccounts.clerkUserId, userId),
    });

    const accountsMap = new Map(userAccounts.map(acc => [acc.id, acc]));

    // 3. Fetch All-Time Stats
    const allPublishedPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.clerkUserId, userId),
        eq(posts.status, "published")
      ),
    });

    const scheduledPostsCount = await db.query.posts.findMany({
      where: and(
        eq(posts.clerkUserId, userId),
        eq(posts.status, "scheduled")
      ),
    });

    // 4. Fetch Posts in Range
    const postsInRange = await db.query.posts.findMany({
      where: and(
        eq(posts.clerkUserId, userId),
        eq(posts.status, "published"),
        gte(posts.publishedAt, startDate),
        lte(posts.publishedAt, endDate)
      ),
      with: {
        targets: true,
      },
    });

    // 5. Gather and cache analytics for posts in range
    let totalReach = 0;
    const postAnalyticsList = [];

    // Platform-specific aggregations
    const platformStats: Record<string, { posts: number; reach: number; engagement: number }> = {};

    for (const post of postsInRange) {
      let postReach = 0;
      let postEngagement = 0;
      const platforms = [];

      for (const target of post.targets) {
        const account = accountsMap.get(target.connectedAccountId);
        if (!account) continue;

        platforms.push(account.platform);

        // Fetch / cache analytics
        const targetAnalytics = await getOrUpdatePostAnalytics(
          db,
          { id: target.id, platformPostId: target.platformPostId, platform: account.platform },
          account,
          post.publishedAt
        );

        postReach += targetAnalytics.reach;
        postEngagement += targetAnalytics.engagement;

        // Aggregate by platform
        const plat = account.platform;
        if (!platformStats[plat]) {
          platformStats[plat] = { posts: 0, reach: 0, engagement: 0 };
        }
        platformStats[plat].posts += 1;
        platformStats[plat].reach += targetAnalytics.reach;
        platformStats[plat].engagement += targetAnalytics.engagement;
      }

      totalReach += postReach;

      postAnalyticsList.push({
        postId: post.id,
        publishedAt: post.publishedAt!,
        reach: postReach,
        engagement: postEngagement,
        platforms,
      });
    }

    // 6. Calculate Average Engagement Rate
    const rates = postAnalyticsList.map(p => p.reach > 0 ? (p.engagement / p.reach) * 100 : 0);
    const averageEngagementRate = rates.length > 0
      ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length
      : 0;

    // 7. Format Chart Data: posts published per day (last N days)
    const postsPerDayMap = new Map<string, { date: string; posts: number; reach: number; engagement: number }>();
    
    // Initialize map with all days in range (to prevent graph gaps)
    const currentIter = new Date(startDate);
    while (currentIter <= endDate) {
      const dateStr = currentIter.toISOString().split("T")[0];
      postsPerDayMap.set(dateStr, { date: dateStr, posts: 0, reach: 0, engagement: 0 });
      currentIter.setDate(currentIter.getDate() + 1);
    }

    // Populate actual post data
    for (const p of postAnalyticsList) {
      const dateStr = p.publishedAt.toISOString().split("T")[0];
      const dayData = postsPerDayMap.get(dateStr);
      if (dayData) {
        dayData.posts += 1;
        dayData.reach += p.reach;
        dayData.engagement += p.engagement;
      }
    }

    const postsLineChartData = Array.from(postsPerDayMap.values());

    // 8. Format Donut Chart Data: posts by platform
    const platformDonutChartData = Object.entries(platformStats).map(([platform, stats]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: stats.posts,
    }));

    // 9. Format Bar Chart Data: engagement by platform
    const platformColors: Record<string, string> = {
      instagram: "#e1306c",
      facebook: "#1877f2",
      twitter: "#1da1f2",
      linkedin: "#0a66c2",
      youtube: "#ff0000",
      tiktok: "#00f2fe",
      discord: "#5865f2",
      slack: "#4a154b",
      pinterest: "#bd081c"
    };

    const platformBarChartData = Object.entries(platformStats).map(([platform, stats]) => {
      const engagementRate = stats.reach > 0 ? (stats.engagement / stats.reach) * 100 : 0;
      return {
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        totalEngagement: stats.engagement,
        fill: platformColors[platform] || "#6366f1",
      };
    });

    return NextResponse.json({
      stats: {
        totalPosts: allPublishedPosts.length,
        scheduledPosts: scheduledPostsCount.length,
        totalReach,
        averageEngagementRate: parseFloat(averageEngagementRate.toFixed(2)),
      },
      charts: {
        postsPerDay: postsLineChartData,
        postsByPlatform: platformDonutChartData,
        engagementByPlatform: platformBarChartData,
      }
    });
  } catch (error) {
    console.error("Failed to fetch overview analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview analytics" },
      { status: 500 }
    );
  }
}
