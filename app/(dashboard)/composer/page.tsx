import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { connectedAccounts, posts } from "@/lib/db/schema";
import { getUserPlan, checkPostCreationLimit } from "@/lib/plan";
import { ComposerClient } from "@/components/composer/composer-client";

export const metadata = {
  title: "Post Composer | Social Copilot",
  description: "Compose, schedule, and publish posts to your connected social profiles with AI assistance.",
};

interface SearchParams {
  id?: string;
}

export default async function ComposerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await searchParams;
  const db = getDb();

  // Fetch user accounts, plan status, and limits
  const accounts = await db.query.connectedAccounts.findMany({
    where: eq(connectedAccounts.clerkUserId, userId),
    orderBy: (ca, { asc }) => [asc(ca.createdAt)],
  });

  const plan = await getUserPlan(userId);
  const limitInfo = await checkPostCreationLimit(userId);

  let initialPostData = null;
  if (id) {
    const post = await db.query.posts.findFirst({
      where: and(eq(posts.id, id), eq(posts.clerkUserId, userId)),
      with: {
        targets: true,
        scheduledJob: true,
      },
    });

    if (post) {
      initialPostData = {
        id: post.id,
        content: post.content,
        mediaUrls: post.mediaUrls,
        status: post.status,
        scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
        platformAccountIds: post.targets.map((t) => t.connectedAccountId),
      };
    }
  }

  const sanitizedAccounts = accounts.map((account) => ({
    id: account.id,
    platform: account.platform,
    platformUserId: account.platformUserId,
    platformUsername: account.platformUsername,
  }));

  return (
    <ComposerClient
      initialAccounts={sanitizedAccounts}
      plan={plan}
      limitInfo={{
        allowed: limitInfo.allowed,
        count: limitInfo.count,
        max: limitInfo.max,
      }}
      initialPost={initialPostData}
    />
  );
}
