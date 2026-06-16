import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq, gte } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { users, posts } from "@/lib/db/schema";

import { type SubscriptionPlan } from "./billing/plans";
export type { SubscriptionPlan };

import { PLAN_LIMITS, type PlanLimit } from "./plan-limits";
export { PLAN_LIMITS };
export type { PlanLimit };


/**
 * Ensures a user profile exists in the local database.
 */
export async function checkOrCreateUser(clerkUserId: string) {
  const db = getDb();
  let user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!user) {
    try {
      const clerkUser = await currentUser();
      const email =
        clerkUser?.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress ||
        clerkUser?.emailAddresses[0]?.emailAddress ||
        "user@example.com";

      const [newUser] = await db
        .insert(users)
        .values({
          clerkUserId,
          email,
          plan: "free",
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      user =
        newUser ||
        (await db.query.users.findFirst({
          where: eq(users.clerkUserId, clerkUserId),
        }));
    } catch (err) {
      console.error("Error creating user during auto-fallback", err);
    }
  }

  return user;
}

/**
 * Retrieves the user's active plan by checking:
 * 1. Clerk session claims metadata (custom/public metadata)
 * 2. Fallback to local Neon DB users table
 */
export async function getUserPlan(clerkUserId: string): Promise<SubscriptionPlan> {
  // Ensure the user exists first
  await checkOrCreateUser(clerkUserId);

  try {
    const { sessionClaims } = await auth();
    // Clerk session claims metadata check
    const claims = sessionClaims as unknown as {
      metadata?: { plan?: string };
      publicMetadata?: { plan?: string };
    };
    const planFromClaims = claims?.metadata?.plan || claims?.publicMetadata?.plan;

    if (
      planFromClaims === "free" ||
      planFromClaims === "pro" ||
      planFromClaims === "agency"
    ) {
      return planFromClaims as SubscriptionPlan;
    }
  } catch (error) {
    // If not in a standard request context where auth() works, fall back to DB
    console.warn("Failed to read sessionClaims, falling back to DB check:", error);
  }

  // Database fallback
  const db = getDb();
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  return (dbUser?.plan as SubscriptionPlan) || "free";
}

/**
 * Checks if a user has reached their connected accounts limit.
 * Returns { allowed: boolean, count: number, max: number }
 */
export async function checkConnectedAccountsLimit(
  clerkUserId: string
): Promise<{ allowed: boolean; count: number; max: number; plan: SubscriptionPlan }> {
  const plan = await getUserPlan(clerkUserId);
  const limits = PLAN_LIMITS[plan];

  const db = getDb();
  const accounts = await db.query.connectedAccounts.findMany({
    where: (ca, { eq }) => eq(ca.clerkUserId, clerkUserId),
  });

  const count = accounts.length;
  const max = limits.maxAccounts;

  if (limits.unlimitedAccounts) {
    return { allowed: true, count, max, plan };
  }

  return {
    allowed: count < max,
    count,
    max,
    plan,
  };
}

/**
 * Checks if a user has reached their posts limit in the current calendar month.
 * Returns { allowed: boolean, count: number, max: number, plan: SubscriptionPlan }
 */
export async function checkPostCreationLimit(
  clerkUserId: string
): Promise<{ allowed: boolean; count: number; max: number; plan: SubscriptionPlan }> {
  const plan = await getUserPlan(clerkUserId);
  const limits = PLAN_LIMITS[plan];

  if (limits.maxPostsPerMonth === Infinity) {
    return { allowed: true, count: 0, max: Infinity, plan };
  }

  const db = getDb();
  const now = new Date();
  // Start of calendar month in UTC
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const postsInMonth = await db.query.posts.findMany({
    where: and(eq(posts.clerkUserId, clerkUserId), gte(posts.createdAt, startOfMonth)),
  });

  const count = postsInMonth.length;
  const max = limits.maxPostsPerMonth;

  return {
    allowed: count < max,
    count,
    max,
    plan,
  };
}

