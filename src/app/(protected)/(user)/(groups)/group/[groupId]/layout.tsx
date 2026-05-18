"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useGroupStore } from "@/store/group/groupUser.store"
import { GroupSidebar } from "@/components/sidebar-group"
import { CurrentPageBreadcrumb } from "@/components/current-page-breadcrumb"
import ThemeToggle from "@/components/theme/theme-toggle"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { CompleteProfileModal } from "@/components/auth/complete-profile-modal"

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { fetchGroupById, fetchSelectedGroupMembers, clearSelectedGroup } = useGroupStore()

  useEffect(() => {
    if (!groupId) return

    const loadGroup = async () => {
      const { selectedGroup } = useGroupStore.getState()
      if (!selectedGroup || selectedGroup.id !== groupId) {
        await fetchGroupById(groupId)
        await fetchSelectedGroupMembers(groupId)
      }
    }

    void loadGroup()

    return () => {
      clearSelectedGroup()
    }
  }, [groupId, fetchGroupById, fetchSelectedGroupMembers, clearSelectedGroup])

  return (
    <SidebarProvider>
      <CompleteProfileModal />
      <GroupSidebar />
      <SidebarInset>
        <header className="flex h-18 shrink-0 sticky top-0 z-50 bg-sidebar items-center justify-between gap-2 border-b border-b-sidebar-border px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-6"
            />
            <CurrentPageBreadcrumb />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <div className="min-h-screen w-full bg-sidebar">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
