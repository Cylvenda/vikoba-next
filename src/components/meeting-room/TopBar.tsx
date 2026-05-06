"use client"

import type { ReactNode } from "react"
import { DoorOpen, Radio, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

type TopBarProps = {
  title: string
  connectionLabel: string
  currentUtcIso: string
  onLeave: () => void
  actions?: ReactNode
}

function formatUtcLabel(currentUtcIso: string) {
  if (!currentUtcIso) {
    return "Syncing UTC time..."
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
  return (
    <header className="flex flex-col gap-4 border-b border-gray-200 bg-accent px-5 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          Secure meeting session
        </div>
        <h1 className="mt-2 truncate text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm">
          <Radio className="size-4 text-emerald-600 dark:text-emerald-400" />
          {connectionLabel}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm">
          {formatUtcLabel(currentUtcIso)}
        </div>

        {actions}

        <Button
          type="button"
          size="lg"
          onClick={onLeave}
          className="rounded-2xl px-4"
        >
          <DoorOpen className="size-4" />
          Leave meeting
        </Button>
      </div>
    </header>
  )
}