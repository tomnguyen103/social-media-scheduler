import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { connectedAccounts } from "@/lib/db/schema";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const accounts = await db.query.connectedAccounts.findMany({
      where: eq(connectedAccounts.clerkUserId, userId),
      orderBy: (ca, { asc }) => [asc(ca.createdAt)],
    });

    const plan = await getUserPlan(userId);
    const limitInfo = PLAN_LIMITS[plan];

    // Strip out encrypted OAuth tokens for client security
    const sanitizedAccounts = accounts.map((account) => ({
      id: account.id,
      platform: account.platform,
      platformUserId: account.platformUserId,
      platformUsername: account.platformUsername,
      createdAt: account.createdAt,
      expiresAt: account.expiresAt,
    }));

    return NextResponse.json({
      accounts: sanitizedAccounts,
      plan,
      limit: limitInfo.maxAccounts,
      unlimited: limitInfo.unlimitedAccounts,
    });
  } catch (error) {
    console.error("Failed to fetch connected accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
