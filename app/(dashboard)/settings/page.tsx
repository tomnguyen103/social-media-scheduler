import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { SettingsClient } from "@/components/dashboard/settings-client";
import { checkOrCreateUser } from "@/lib/plan";

export const metadata = {
  title: "Settings | Social Copilot",
  description: "Manage your profile, notification preferences, connected platforms, and account security.",
};

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user profile exists in database
  const user = await checkOrCreateUser(userId);

  if (!user) {
    redirect("/sign-in");
  }

  const initialSettings = {
    plan: user.plan,
    emailOnFailure: user.emailOnFailure,
    weeklyDigest: user.weeklyDigest,
  };

  return <SettingsClient initialSettings={initialSettings} />;
}
