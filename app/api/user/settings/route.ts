import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { checkOrCreateUser } from "@/lib/plan";

// GET /api/user/settings - Fetch settings
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ensure user exists first
    const user = await checkOrCreateUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      plan: user.plan,
      emailOnFailure: user.emailOnFailure,
      weeklyDigest: user.weeklyDigest,
    });
  } catch (error) {
    console.error("Failed to fetch user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/settings - Update settings toggles
export async function PATCH(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { emailOnFailure, weeklyDigest } = await request.json();

    const db = getDb();
    const result = await db
      .update(users)
      .set({
        ...(emailOnFailure !== undefined && { emailOnFailure: !!emailOnFailure }),
        ...(weeklyDigest !== undefined && { weeklyDigest: !!weeklyDigest }),
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, userId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        plan: result[0].plan,
        emailOnFailure: result[0].emailOnFailure,
        weeklyDigest: result[0].weeklyDigest,
      },
    });
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/settings - Delete user account
export async function DELETE() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: "Account deletion requested successfully",
    });
  } catch (error) {
    console.error("Failed to delete user account via Clerk:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
