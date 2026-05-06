"use client"

import type { ReactNode } from "react"
import type { MeetingSidebarTab } from "@/components/meeting-room/types"

type SidebarProps = {
  activeTab: MeetingSidebarTab
  onTabChange: (tab: MeetingSidebarTab) => void
  chatCount: number
  attendanceCount: number
  agendaCount: number
  minutesCount?: number
  children: ReactNode
}

const tabs: Array<{
  id: MeetingSidebarTab
  label: string
}> = [
    { id: "chat", label: "Chat" },
    { id: "attendance", label: "Attendance" },
    { id: "agenda", label: "Agenda" },
    { id: "minutes", label: "Minutes" },
  ]

export function Sidebar({
  activeTab,
  onTabChange,
  chatCount,
  attendanceCount,
  agendaCount,
  minutesCount = 0,
  children,
}: SidebarProps) {
  const counts: Record<MeetingSidebarTab, number> = {
    chat: chatCount,
    attendance: attendanceCount,
    agenda: agendaCount,
    minutes: minutesCount,
  }

  return (
    <aside className="flex min-h-0 flex-col rounded-[32px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="grid grid-cols-4 gap-2 rounded-[24px] bg-gray-100 dark:bg-gray-800 p-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={[
                  "rounded-[20px] px-3 py-3 text-sm font-medium transition-colors",
                  isActive ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
                ].join(" ")}
              >
                <span>{tab.label}</span>
                <span className={["ml-2 text-xs", isActive ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"].join(" ")}>
                  {counts[tab.id]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  )
}
