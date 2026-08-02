"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { GroupSidebar } from "@/components/sidebar-group"
import { CurrentPageBreadcrumb } from "@/components/current-page-breadcrumb"
import ThemeToggle from "@/components/theme/theme-toggle"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { CompleteProfileModal } from "@/components/auth/complete-profile-modal"
import LanguageToggle from "@/components/language/language-toggle"

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ groupId: string }>()
  const router = useRouter()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { fetchGroupById, fetchSelectedGroupMembers, clearSelectedGroup } = useGroupStore()
  const { initAuth } = useAuthUserStore()
  useEffect(() => {
    if (!groupId) return
    let cancelled = false;

    const load = async () => {
      try {
        const isAuthenticated = await initAuth()
        if (!isAuthenticated) {
          if (!cancelled) {
            router.replace("/");
          }
          return;
        }

        const { selectedGroup } = useGroupStore.getState()
        if (!selectedGroup || selectedGroup.id !== groupId) {
          await Promise.all([
            fetchGroupById(groupId),
            fetchSelectedGroupMembers(groupId),
          ])
        }
      } catch (error) {
        console.error("Group layout bootstrap error:", error)
        if (!cancelled) {
          router.replace("/");
        }
      }
    }

    void load()

    return () => {
      cancelled = true;
      clearSelectedGroup()
    }
  }, [groupId, fetchGroupById, fetchSelectedGroupMembers, clearSelectedGroup, initAuth, router])

  return (
      <SidebarProvider>
        <CompleteProfileModal />
        <GroupSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-b-sidebar-border bg-sidebar px-3 transition-[width,height] ease-linear sm:h-16 sm:px-4 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-6"
              />
              <CurrentPageBreadcrumb />
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <LanguageToggle compact />
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
