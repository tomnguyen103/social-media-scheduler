"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TopbarProps = {
  plan: "free" | "pro" | "agency";
};

const routeTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/composer": "Post Composer",
  "/dashboard/calendar": "Content Calendar",
  "/accounts": "Connected Accounts",
  "/dashboard/auto-reply": "Auto-Reply Rules",
  "/dashboard/analytics": "Analytics Insights",
  "/dashboard/billing": "Billing & Subscriptions",
  "/dashboard/settings": "Settings",
};

export function Topbar({ plan }: TopbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fallback pattern matching for subroutes (e.g. /dashboard/composer/new)
  const getPageTitle = (path: string) => {
    if (routeTitles[path]) return routeTitles[path];
    const match = Object.keys(routeTitles)
      .filter((k) => k !== "/dashboard")
      .find((k) => path.startsWith(k));
    return match ? routeTitles[match] : "Dashboard";
  };

  return (
    <header className="flex h-[74px] items-center justify-between border-b border-border bg-background px-5 md:px-6 shrink-0">
      {/* Mobile Nav & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="size-5" />
        </button>

        <MobileSidebar plan={plan} open={open} onOpenChange={setOpen} />

        <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/composer"
          className={cn(
            buttonVariants({ size: "default" }),
            "h-10 gap-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[0_8px_20px_-6px_oklch(0.6_0.27_296_/_0.3)] hover:bg-primary/95 transition duration-150"
          )}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">New Post</span>
        </Link>
        <ThemeToggle />
        <div className="size-8 rounded-full border border-border flex items-center justify-center overflow-hidden">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
