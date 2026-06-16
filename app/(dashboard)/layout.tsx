import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { getUserPlan } from "@/lib/plan";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const plan = await getUserPlan(userId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 h-full">
        <Sidebar plan={plan} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <Topbar plan={plan} />
        <main className="flex-1 overflow-y-auto p-5 md:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
