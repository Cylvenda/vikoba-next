"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "./theme-provider"
import { useLanguage } from "@/components/language/language-provider"

interface ThemeToggleProps {
  className?: string
  compact?: boolean
  showLabel?: boolean
}

export default function ThemeToggle({ className, compact = false, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
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
          ? tt("Toggle theme", "Badili mandhari")
          : isDark
            ? tt("Switch to light mode", "Tumia mandhari angavu")
            : tt("Switch to dark mode", "Tumia mandhari meusi")
      }
      title={
        !mounted
          ? tt("Toggle theme", "Badili mandhari")
          : isDark
            ? tt("Switch to light mode", "Tumia mandhari angavu")
            : tt("Switch to dark mode", "Tumia mandhari meusi")
      }
    >
      {!mounted ? <Moon /> : isDark ? <Sun /> : <Moon />}
      {showLabel ? <span>{isDark ? tt("Light mode", "Mandhari angavu") : tt("Dark mode", "Mandhari meusi")}</span> : null}
    </Button>
  )
}
