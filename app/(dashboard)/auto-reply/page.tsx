import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { autoReplyRules, connectedAccounts } from "@/lib/db/schema";
import { getUserPlan } from "@/lib/plan";
import { AutoReplyClient } from "@/components/auto-reply/auto-reply-client";

export const metadata = {
  title: "Auto-Reply Rules | Social Copilot",
  description: "Manage automatic AI and template comment replies for your social media channels.",
};

export default async function AutoReplyPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const db = getDb();

  // Fetch active connected accounts for this user
  const accounts = await db.query.connectedAccounts.findMany({
    where: eq(connectedAccounts.clerkUserId, userId),
    orderBy: (ca, { asc }) => [asc(ca.createdAt)],
  });

  // Fetch existing auto-reply rules for this user
  const rules = await db.query.autoReplyRules.findMany({
    where: eq(autoReplyRules.clerkUserId, userId),
    orderBy: (arr, { desc }) => [desc(arr.createdAt)],
  });

  const plan = await getUserPlan(userId);

  const sanitizedAccounts = accounts.map((account) => ({
    id: account.id,
    platform: account.platform,
    platformUsername: account.platformUsername,
  }));

  const sanitizedRules = rules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    triggerType: rule.triggerType,
    keywords: rule.keywords,
    responseTemplate: rule.responseTemplate,
    useAI: rule.useAI,
    isActive: rule.isActive,
    platformAccountIds: rule.platformAccountIds,
    createdAt: rule.createdAt,
  }));

  return (
    <AutoReplyClient
      initialRules={sanitizedRules}
      initialAccounts={sanitizedAccounts}
      plan={plan}
    />
  );
}
