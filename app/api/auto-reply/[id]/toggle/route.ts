import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { autoReplyRules } from "@/lib/db/schema";

// PATCH /api/auto-reply/[id]/toggle - enable/disable rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
  }

  try {
    const { isActive } = await request.json();

    if (isActive === undefined) {
      return NextResponse.json(
        { error: "isActive boolean is required in request body" },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = await db
      .update(autoReplyRules)
      .set({
        isActive: !!isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(autoReplyRules.id, id),
          eq(autoReplyRules.clerkUserId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Rule not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Rule ${result[0].isActive ? "enabled" : "disabled"} successfully`,
      rule: result[0],
    });
  } catch (error) {
    console.error(`Failed to toggle auto-reply rule ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to toggle rule status" },
      { status: 500 }
    );
  }
}
