"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react"

type Theme = "light" | "dark"
type ThemeContextValue = {
  setTheme: (theme: Theme) => void
  theme: Theme
}

const DEFAULT_THEME: Theme = "dark"
const STORAGE_KEY = "theme"
const ThemeContext = createContext<ThemeContextValue | null>(null)
const listeners = new Set<() => void>()

function readTheme(): Theme {
  if (typeof document === "undefined") {
    return DEFAULT_THEME
  }

  return document.documentElement.classList.contains("light")
    ? "light"
    : "dark"
}

function emitThemeChange() {
  listeners.forEach((listener) => listener())
}

function applyTheme(theme: Theme, persist = true) {
  const root = document.documentElement

  root.classList.toggle("dark", theme === "dark")
  root.classList.toggle("light", theme === "light")
  root.style.colorScheme = theme

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
  }

  emitThemeChange()
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return
    }

    applyTheme(event.newValue === "light" ? "light" : "dark", false)
  }

  window.addEventListener("storage", handleStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", handleStorage)
  }
}

function getClientSnapshot() {
  return readTheme()
}

function getServerSnapshot() {
  return DEFAULT_THEME
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  )
  const setTheme = useCallback((nextTheme: Theme) => {
    applyTheme(nextTheme)
  }, [])
  const value = useMemo(() => ({ setTheme, theme }), [setTheme, theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }

  return context
}

export { ThemeProvider, useTheme }
