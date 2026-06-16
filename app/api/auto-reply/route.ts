import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { autoReplyRules } from "@/lib/db/schema";
import { requireAI, PlanLimitError } from "@/lib/billing/guards";

// GET /api/auto-reply - list user's rules
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const rules = await db.query.autoReplyRules.findMany({
      where: eq(autoReplyRules.clerkUserId, userId),
      orderBy: [desc(autoReplyRules.createdAt)],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Failed to fetch auto-reply rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

// POST /api/auto-reply - create rule
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, triggerType, keywords, responseTemplate, useAI, platformAccountIds } =
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

    // 3. Create rule
    const [newRule] = await db
      .insert(autoReplyRules)
      .values({
        clerkUserId: userId,
        name,
        triggerType,
        keywords: keywords || [],
        responseTemplate: responseTemplate || "",
        useAI: !!useAI,
        isActive: true,
        platformAccountIds: platformAccountIds || [],
      })
      .returning();

    return NextResponse.json({ rule: newRule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create auto-reply rule:", error);
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 }
    );
  }
}
