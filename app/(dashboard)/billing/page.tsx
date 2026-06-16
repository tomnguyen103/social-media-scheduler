import { auth } from "@clerk/nextjs/server";
import { and, eq, gte } from "drizzle-orm";
import { redirect } from "next/navigation";

import { BillingClient } from "@/components/dashboard/billing-client";
import { getDb } from "@/lib/db";
import { connectedAccounts, posts } from "@/lib/db/schema";
import { getUserPlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/billing/plans";

export const metadata = {
  title: "Billing & Subscription | Social Copilot",
  description: "Manage your subscription plan, billing details, and view payment invoices.",
};

export default async function BillingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const db = getDb();
  
  // 1. Fetch connected accounts count
  const accountsList = await db.query.connectedAccounts.findMany({
    where: eq(connectedAccounts.clerkUserId, userId),
  });
  const accountsCount = accountsList.length;

  // 2. Fetch posts this month count
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const postsList = await db.query.posts.findMany({
    where: and(
      eq(posts.clerkUserId, userId),
      gte(posts.createdAt, startOfMonth)
    ),
  });
  const postsCount = postsList.length;

  // 3. Fetch user plan and limits
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Subscriptions</h2>
        <p className="text-sm text-muted-foreground">
          Manage your plan, check resource usage, and view transaction records.
        </p>
      </div>

      <BillingClient
        plan={plan}
        accountsCount={accountsCount}
        accountsLimit={limits.maxConnectedAccounts}
        accountsUnlimited={limits.maxConnectedAccounts === Infinity}
        postsCount={postsCount}
        postsLimit={limits.maxPostsPerMonth}
        postsUnlimited={limits.maxPostsPerMonth === Infinity}
      />
    </div>
  );
}
