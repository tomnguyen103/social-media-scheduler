"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Add01Icon,
  Calendar01Icon,
  HashtagIcon,
  Home01Icon,
  Image01Icon,
  Message01Icon,
  Settings01Icon,
  Logout01Icon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SidebarProps = {
  plan: "free" | "pro" | "agency";
};

type NavItem = {
  href: string;
  label: string;
  icon: IconSvgElement;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home01Icon },
  { href: "/calendar", label: "Calendar", icon: Calendar01Icon },
  { href: "/dashboard/media-library", label: "Media Library", icon: Image01Icon },
  { href: "/auto-reply", label: "Auto-Reply", icon: Message01Icon },
  { href: "/accounts", label: "Accounts", icon: HashtagIcon },
  { href: "/billing", label: "Billing", icon: CreditCardIcon },
  { href: "/settings", label: "Settings", icon: Settings01Icon },
];

export function Sidebar({ plan }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case "agency":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold uppercase tracking-wider text-[10px]";
      case "pro":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-bold uppercase tracking-wider text-[10px]";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30 font-bold uppercase tracking-wider text-[10px]";
    }
  };

  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo Section */}
      <div className="flex h-[74px] items-center px-6">
        <Link href="/dashboard" className="flex items-center">
          <span className="text-xl font-bold tracking-tight text-primary font-heading">
            Social Copilot
          </span>
        </Link>
      </div>

      {/* Add New Post Button */}
      <div className="px-4 pb-2">
        <Link
          href="/dashboard/composer"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_-6px_oklch(0.6_0.27_296_/_0.3)] hover:brightness-105 transition duration-150"
        >
          <HugeiconsIcon icon={Add01Icon} size={18} />
          Add New Post
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 px-4 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-xl px-4 text-sm font-medium transition duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={18}
                className={cn(
                  "shrink-0 transition-transform group-hover:scale-105",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section & Plan Badge */}
      <div className="border-t border-sidebar-border p-4 bg-sidebar-accent/30">
        {isLoaded && user ? (
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="size-9 border border-sidebar-border shadow-sm">
                <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {user.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-semibold text-foreground">
                  {user.fullName || user.primaryEmailAddress?.emailAddress.split("@")[0]}
                </span>
                <span className="mt-0.5 flex">
                  <Badge variant="outline" className={cn("px-1.5 py-0", getPlanBadgeColor(plan))}>
                    {plan}
                  </Badge>
                </span>
              </div>
            </div>

            <SignOutButton>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                title="Sign out"
              >
                <HugeiconsIcon icon={Logout01Icon} size={16} />
              </button>
            </SignOutButton>
          </div>
        ) : (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="size-9 rounded-full bg-sidebar-accent" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-sidebar-accent" />
              <div className="h-3 w-1/2 rounded bg-sidebar-accent" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
