import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { connectedAccounts } from "@/lib/db/schema";
import { CalendarClient } from "@/components/calendar/calendar-client";

export const metadata = {
  title: "Content Calendar | Social Copilot",
  description: "View, filter, and schedule your social media posts in a monthly, weekly, or list layout.",
};

export default async function CalendarPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const db = getDb();

  // Fetch connected accounts for this user
  const accounts = await db.query.connectedAccounts.findMany({
    where: eq(connectedAccounts.clerkUserId, userId),
    orderBy: (ca, { asc }) => [asc(ca.createdAt)],
  });

  const sanitizedAccounts = accounts.map((account) => ({
    id: account.id,
    platform: account.platform,
    platformUsername: account.platformUsername,
  }));

  return <CalendarClient initialAccounts={sanitizedAccounts} />;
}
