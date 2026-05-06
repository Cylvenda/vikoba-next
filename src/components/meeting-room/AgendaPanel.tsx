"use client"

import type { MeetingAgendaItem } from "@/components/meeting-room/types"

type AgendaPanelProps = {
  items: MeetingAgendaItem[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}

function getStatusClass(status: MeetingAgendaItem["status"]) {
  if (status === "Done") return "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-300"
  if (status === "Ongoing") return "bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-300"
  return "bg-gray-500/20 text-gray-600 dark:bg-gray-500/30 dark:text-gray-300"
}

export function AgendaPanel({ items, selectedItemId, onSelectItem }: AgendaPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-md">
      <div className="app-scrollbar flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {items.map((item) => {
          const isActive = item.id === selectedItemId

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(item.id)}
              className={[
                "block w-full rounded-md border p-4 text-left shadow-sm transition-colors",
                isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/40",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {item.order}. {item.title}
                  </p>
                  <p
                    className={[
                      "mt-2 text-sm leading-6",
                      isActive ? "text-primary-foreground/85" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {item.description || "No description provided for this agenda item."}
                  </p>
                </div>

                <span
                  className={[
                    "shrink-0 rounded-md px-3 py-1 text-[11px] font-semibold",
                    isActive ? "bg-white/15 text-white" : getStatusClass(item.status),
                  ].join(" ")}
                >
                  {item.status}
                </span>
              </div>

              <p className={["mt-3 text-xs", isActive ? "text-primary-foreground/70" : "text-muted-foreground"].join(" ")}>
                {item.allocatedMinutes} minutes
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
