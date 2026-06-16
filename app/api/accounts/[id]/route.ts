import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { connectedAccounts } from "@/lib/db/schema";

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
    return NextResponse.json({ error: "Missing account ID" }, { status: 400 });
  }

  try {
    const db = getDb();

    // Ensure users can only delete their own connected accounts
    const result = await db
      .delete(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.id, id),
          eq(connectedAccounts.clerkUserId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Account not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account disconnected successfully",
      deletedId: result[0].id,
    });
  } catch (error) {
    console.error(`Failed to delete connected account ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }
}
