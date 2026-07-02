"use client"

import type { MeetingAttendanceItem } from "@/components/meeting-room/types"
import { useLanguage } from "@/components/language/language-provider"

type AttendancePanelProps = {
  items: MeetingAttendanceItem[]
}

function formatJoinTime(value: string | null, status: MeetingAttendanceItem["status"], language: "en" | "sw") {
  if (!value) {
    return status === "online"
      ? (language === "sw" ? "Yupo sasa" : "Live now")
      : (language === "sw" ? "Anasubiri kujiunga" : "Waiting to join")
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

export function AttendancePanel({ items }: AttendancePanelProps) {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  return (
    <div className="flex h-full min-h-0 flex-col rounded-md">
      <div className="app-scrollbar flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  {item.name}
                  {item.isCurrentUser ? ` (${tt("You", "Wewe")})` : ""}
                </p>
                <p className="truncate text-sm text-muted-foreground">{item.email}</p>
                <p className="mt-2 text-xs text-muted-foreground">{tt("Joined:", "Alijiunga:")} {formatJoinTime(item.joinedAt, item.status, language)}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={[
                    "rounded-full px-3 py-1 text-[11px] font-semibold",
                    (item.badge === "CHAIRPERSON" || item.badge === "SECRETARY")
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {item.badge === "CHAIRPERSON" ? tt("CHAIRPERSON", "MWENYEKITI") : item.badge === "SECRETARY" ? tt("SECRETARY", "KATIBU") : item.badge === "TREASURER" ? tt("TREASURER", "MWEKA HAZINA") : tt("MEMBER", "MWANACHAMA")}
                </span>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-[11px] font-semibold",
                    item.status === "online" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {item.status === "online" ? tt("online", "yupo") : tt("offline", "hayupo")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
