import { verifyWebhook, type WebhookEvent } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireEnv } from "@/lib/env";

export const runtime = "nodejs";

type ClerkUserUpsertEvent = Extract<
  WebhookEvent,
  { type: "user.created" | "user.updated" }
>;

function getPrimaryEmail(data: ClerkUserUpsertEvent["data"]) {
  const primaryEmail = data.email_addresses.find(
    (email) => email.id === data.primary_email_address_id,
  );

  return primaryEmail?.email_address ?? data.email_addresses[0]?.email_address;
}

async function syncUser(event: ClerkUserUpsertEvent) {
  const email = getPrimaryEmail(event.data);

  if (!email) {
    throw new Error(`Clerk user ${event.data.id} does not include an email.`);
  }

  await getDb()
    .insert(users)
    .values({
      clerkUserId: event.data.id,
      email,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        email,
        updatedAt: new Date(),
      },
    });
}

async function syncDeletedUser(
  event: Extract<WebhookEvent, { type: "user.deleted" }>,
) {
  const clerkUserId = event.data.id;

  if (!clerkUserId) {
    return;
  }

  await getDb().delete(users).where(eq(users.clerkUserId, clerkUserId));
}

export async function POST(request: NextRequest) {
  let event: WebhookEvent;

  try {
    event = await verifyWebhook(request, {
      signingSecret: requireEnv("CLERK_WEBHOOK_SECRET"),
    });
  } catch (error) {
    console.error("Clerk webhook verification failed", error);

    return Response.json(
      { error: "Webhook verification failed" },
      { status: 400 },
    );
  }

  try {
    if (event.type === "user.created") {
      await syncUser(event);
    }

    if (event.type === "user.deleted") {
      await syncDeletedUser(event);
    }
  } catch (error) {
    console.error("Clerk webhook sync failed", error);

    return Response.json({ error: "Webhook sync failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
