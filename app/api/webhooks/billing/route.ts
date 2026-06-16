import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireEnv } from "@/lib/env";

export const runtime = "nodejs";

interface BillingWebhookEvent {
  type: string;
  data: {
    payer?: {
      user_id?: string;
    };
    status?: string;
    items?: Array<{
      plan?: {
        slug?: string;
      };
    }>;
  };
}

export async function POST(request: NextRequest) {
  let event: BillingWebhookEvent;

  try {
    event = (await verifyWebhook(request, {
      signingSecret: requireEnv("CLERK_WEBHOOK_SECRET"),
    })) as unknown as BillingWebhookEvent;
  } catch (error) {
    console.error("Clerk billing webhook verification failed:", error);
    return Response.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  const eventType = event.type;
  console.log(`Received billing webhook event: ${eventType}`);

  try {
    if (eventType === "subscription.created" || eventType === "subscription.updated") {
      const subscription = event.data;
      const userId = subscription.payer?.user_id;
      const status = subscription.status;
      const items = subscription.items || [];

      if (!userId) {
        console.error("Billing webhook: Missing payer user_id in payload");
        return Response.json({ error: "Missing user_id" }, { status: 400 });
      }

      // Default plan is free
      let plan: "free" | "pro" | "agency" = "free";

      if (status === "active") {
        // Find plan slug from the items list
        const planSlug = items[0]?.plan?.slug || "";
        if (planSlug.includes("agency")) {
          plan = "agency";
        } else if (planSlug.includes("pro")) {
          plan = "pro";
        }
      }

      const db = getDb();
      // Ensure user exists first
      const existingUser = await db.query.users.findFirst({
        where: eq(users.clerkUserId, userId),
      });

      if (existingUser) {
        await db
          .update(users)
          .set({
            plan,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkUserId, userId));
        console.log(`Successfully synced plan "${plan}" for user ${userId}`);
      } else {
        console.warn(`User ${userId} not found in database; cannot update plan.`);
      }
    }
  } catch (error) {
    console.error("Billing webhook execution failed:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
