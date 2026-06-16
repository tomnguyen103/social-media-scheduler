"use client"

import { Moon, Sun } from "lucide-react"
import { useSyncExternalStore } from "react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

function useIsHydrated() {
  return useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  )
}

function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const isHydrated = useIsHydrated()

  const activeTheme =
    isHydrated && (theme === "light" || theme === "dark") ? theme : "dark"
  const nextTheme = activeTheme === "dark" ? "light" : "dark"
  const Icon = activeTheme === "dark" ? Moon : Sun

  return (
    <Button
      aria-label="Toggle theme"
      className={cn(
        "size-9 rounded-full border-border/40 text-muted-foreground hover:text-foreground",
        "dark:border-white/10 dark:bg-transparent dark:hover:bg-white/5"
      )}
      onClick={() => setTheme(nextTheme)}
      size="icon-lg"
      title="Toggle theme"
      type="button"
      variant="ghost"
    >
      <Icon className="size-4" />
    </Button>
  )
}

export { ThemeToggle }
