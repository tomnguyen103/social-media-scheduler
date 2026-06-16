import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export const metadata = {
  title: "Dashboard Overview | Social Copilot",
  description: "Track reach, engagement rate, platform metrics, and top-performing posts.",
};

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <AnalyticsClient />;
}
