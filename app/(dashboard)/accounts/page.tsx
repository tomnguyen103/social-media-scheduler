import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { AccountsClient } from "@/components/dashboard/accounts-client";
import { getDb } from "@/lib/db";
import { connectedAccounts } from "@/lib/db/schema";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";

export const metadata = {
  title: "Connected Accounts | Social Copilot",
  description: "Link and manage your social media profile integrations.",
};

export default async function AccountsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const db = getDb();
  const accounts = await db.query.connectedAccounts.findMany({
    where: eq(connectedAccounts.clerkUserId, userId),
    orderBy: (ca, { asc }) => [asc(ca.createdAt)],
  });

  const plan = await getUserPlan(userId);
  const limitInfo = PLAN_LIMITS[plan];

  const sanitizedAccounts = accounts.map((account) => ({
    id: account.id,
    platform: account.platform,
    platformUserId: account.platformUserId,
    platformUsername: account.platformUsername,
    createdAt: account.createdAt,
    expiresAt: account.expiresAt,
  }));

  return (
    <AccountsClient
      initialAccounts={sanitizedAccounts}
      plan={plan}
      limit={limitInfo.maxAccounts}
      unlimited={limitInfo.unlimitedAccounts}
    />
  );
}
