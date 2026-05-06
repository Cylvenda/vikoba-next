"use client"

import type { MeetingAttendanceItem } from "@/components/meeting-room/types"

type AttendancePanelProps = {
  items: MeetingAttendanceItem[]
}

function formatJoinTime(value: string | null, status: MeetingAttendanceItem["status"]) {
  if (!value) {
    return status === "online" ? "Live now" : "Waiting to join"
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

export function AttendancePanel({ items }: AttendancePanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-md">
      <div className="app-scrollbar flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  {item.name}
                  {item.isCurrentUser ? " (You)" : ""}
                </p>
                <p className="truncate text-sm text-muted-foreground">{item.email}</p>
                <p className="mt-2 text-xs text-muted-foreground">Joined: {formatJoinTime(item.joinedAt, item.status)}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={[
                    "rounded-full px-3 py-1 text-[11px] font-semibold",
                    item.badge === "Host" ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200" : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {item.badge}
                </span>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-[11px] font-semibold",
                    item.status === "online" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {item.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
