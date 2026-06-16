import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { analyticsCache } from "@/lib/db/schema";
import { fetchPostAnalytics, type PostAnalytics } from "@/lib/platforms/analytics";
import { type SupportedPlatform } from "@/lib/platforms";

export async function getOrUpdatePostAnalytics(
  db: ReturnType<typeof getDb>,
  target: { id: string; platformPostId: string | null; platform: string },
  account: { accessToken: string; platformUserId: string },
  publishedAt: Date | null
): Promise<PostAnalytics> {
  const postTargetId = target.id;
  const platformPostId = target.platformPostId;
  const platform = target.platform as SupportedPlatform;
  const pubDate = publishedAt || new Date();

  if (!platformPostId) {
    return { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, engagement: 0 };
  }

  // 1. Check cache
  const cached = await db.query.analyticsCache.findFirst({
    where: eq(analyticsCache.postTargetId, postTargetId),
  });

  if (cached) {
    const cacheAgeMs = Date.now() - cached.updatedAt.getTime();
    const postAgeMs = Date.now() - pubDate.getTime();
    
    let isStale = false;
    if (postAgeMs < 24 * 60 * 60 * 1000) {
      isStale = cacheAgeMs > 15 * 60 * 1000; // 15 mins
    } else if (postAgeMs < 7 * 24 * 60 * 60 * 1000) {
      isStale = cacheAgeMs > 2 * 60 * 60 * 1000; // 2 hours
    } else {
      isStale = cacheAgeMs > 24 * 60 * 60 * 1000; // 24 hours
    }

    if (!isStale) {
      return {
        reach: cached.reach,
        impressions: cached.impressions,
        likes: cached.likes,
        comments: cached.comments,
        shares: cached.shares,
        engagement: cached.engagement,
      };
    }
  }

  // 2. Fetch fresh stats
  const fresh = await fetchPostAnalytics(
    platform,
    account.accessToken,
    platformPostId,
    account.platformUserId,
    pubDate
  );

  // 3. Update cache in DB
  try {
    if (cached) {
      await db
        .update(analyticsCache)
        .set({
          reach: fresh.reach,
          impressions: fresh.impressions,
          likes: fresh.likes,
          comments: fresh.comments,
          shares: fresh.shares,
          engagement: fresh.engagement,
          updatedAt: new Date(),
        })
        .where(eq(analyticsCache.id, cached.id));
    } else {
      await db.insert(analyticsCache).values({
        postTargetId,
        reach: fresh.reach,
        impressions: fresh.impressions,
        likes: fresh.likes,
        comments: fresh.comments,
        shares: fresh.shares,
        engagement: fresh.engagement,
        updatedAt: new Date(),
      });
    }
  } catch (err) {
    console.error("Failed to write to analytics cache:", err);
  }

  return fresh;
}
