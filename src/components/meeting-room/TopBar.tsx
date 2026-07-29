"use client"

import type { ReactNode } from "react"
import { DoorOpen, Radio, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language/language-provider"

type TopBarProps = {
  title: string
  connectionLabel: string
  currentUtcIso: string
  onLeave: () => void
  actions?: ReactNode
}

function formatUtcLabel(currentUtcIso: string, language: "en" | "sw") {
  if (!currentUtcIso) {
    return language === "sw" ? "Inasawazisha muda wa UTC..." : "Syncing UTC time..."
  }

  const date = new Date(currentUtcIso)

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date)
}

export function TopBar({ title, connectionLabel, currentUtcIso, onLeave, actions }: TopBarProps) {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  return (
    <header className="z-20 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-accent px-3 py-2 backdrop-blur sm:px-5 sm:py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 sm:size-4" />
          {tt("Secure meeting session", "Kikao salama")}
        </div>
        <h1 className="max-w-[55vw] truncate text-sm font-semibold text-foreground sm:max-w-none sm:text-lg md:text-2xl">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-foreground min-[420px]:flex sm:px-3 sm:py-1.5 sm:text-sm shadow-sm">
          <Radio className="size-3.5 text-emerald-600 dark:text-emerald-400 sm:size-4" />
          {connectionLabel}
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-foreground sm:px-3 sm:py-1.5 sm:text-sm shadow-sm">
          {formatUtcLabel(currentUtcIso, language)}
        </div>

        <div className="hidden md:block">{actions}</div>

        <Button
          type="button"
          size="sm"
          onClick={onLeave}
          aria-label={tt("Leave meeting", "Ondoka kwenye kikao")}
          className="size-11 rounded-xl px-0 sm:w-auto sm:px-3"
        >
          <DoorOpen className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">{tt("Leave meeting", "Ondoka kwenye kikao")}</span>
        </Button>
      </div>
    </header>
  )
}
