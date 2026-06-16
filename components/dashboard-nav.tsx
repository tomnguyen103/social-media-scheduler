"use client"

import {
  Bot,
  CalendarDays,
  Hash,
  ImageIcon,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { cn } from "@/lib/utils"

type DashboardNavIcon =
  | "accounts"
  | "autoReply"
  | "calendar"
  | "dashboard"
  | "mediaLibrary"
  | "settings"

type DashboardNavItem = {
  href: string
  label: string
  icon: DashboardNavIcon
}

const navIcons: Record<DashboardNavIcon, LucideIcon> = {
  accounts: Hash,
  autoReply: Bot,
  calendar: CalendarDays,
  dashboard: LayoutDashboard,
  mediaLibrary: ImageIcon,
  settings: Settings,
}

const navItems: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  {
    href: "/dashboard/media-library",
    label: "Media Library",
    icon: "mediaLibrary",
  },
  { href: "/auto-reply", label: "Auto-Reply", icon: "autoReply" },
  { href: "/accounts", label: "Accounts", icon: "accounts" },
  { href: "/settings", label: "Settings", icon: "settings" },
]

function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const Icon = navIcons[item.icon]
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href)

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/64 transition",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive &&
                "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.04)]"
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { DashboardNav }
