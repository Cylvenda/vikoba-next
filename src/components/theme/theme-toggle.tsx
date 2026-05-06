"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "./theme-provider"

interface ThemeToggleProps {
  className?: string
  compact?: boolean
  showLabel?: boolean
}

export default function ThemeToggle({ className, compact = false, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const isDark = theme === "dark"

  return (
    <Button
      variant="outline"
      size={compact ? "icon" : "lg"}
      className={cn(
        "shrink-0 rounded-md border-border/70 bg-background/75 text-foreground shadow-sm backdrop-blur hover:bg-accent hover:text-accent-foreground",
        compact ? "px-0" : "px-4",
        className
      )}
      onClick={toggleTheme}
      aria-label={
        !mounted
          ? "Toggle theme"
          : isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
      }
      title={
        !mounted
          ? "Toggle theme"
          : isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
      }
    >
      {!mounted ? <Moon /> : isDark ? <Sun /> : <Moon />}
      {showLabel ? <span>{isDark ? "Light mode" : "Dark mode"}</span> : null}
    </Button>
  )
}
