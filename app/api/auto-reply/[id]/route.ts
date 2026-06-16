import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { autoReplyRules } from "@/lib/db/schema";
import { requireAI, PlanLimitError } from "@/lib/billing/guards";

// PUT /api/auto-reply/[id] - update rule
export async function PUT(
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
    const { name, triggerType, keywords, responseTemplate, useAI, platformAccountIds, isActive } =
      await request.json();

    // 1. Validation
    if (!name || !triggerType || !platformAccountIds || platformAccountIds.length === 0) {
      return NextResponse.json(
        { error: "Name, trigger type, and at least one connected account are required." },
        { status: 400 }
      );
    }

    if (triggerType === "keyword_match" && (!keywords || keywords.length === 0)) {
      return NextResponse.json(
        { error: "At least one keyword is required for keyword match trigger." },
        { status: 400 }
      );
    }

    if (!responseTemplate && !useAI) {
      return NextResponse.json(
        { error: "Response template is required when not using AI-generated response." },
        { status: 400 }
      );
    }

    // 2. Limit-gating check
    if (useAI) {
      try {
        await requireAI(userId);
      } catch (err) {
        if (err instanceof PlanLimitError) {
          return NextResponse.json(
            { error: err.message },
            { status: 403 }
          );
        }
        throw err;
      }
    }

    const db = getDb();

    // 3. Update rule
    const result = await db
      .update(autoReplyRules)
      .set({
        name,
        triggerType,
        keywords: keywords || [],
        responseTemplate: responseTemplate || "",
        useAI: !!useAI,
        platformAccountIds: platformAccountIds || [],
        isActive: isActive !== undefined ? !!isActive : true,
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

    return NextResponse.json({ rule: result[0] });
  } catch (error) {
    console.error(`Failed to update auto-reply rule ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to update rule" },
      { status: 500 }
    );
  }
}

// DELETE /api/auto-reply/[id] - delete rule
export async function DELETE(
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
    const db = getDb();
    const result = await db
      .delete(autoReplyRules)
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
      message: "Auto-reply rule deleted successfully",
      deletedId: result[0].id,
    });
  } catch (error) {
    console.error(`Failed to delete auto-reply rule ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 }
    );
  }
}
