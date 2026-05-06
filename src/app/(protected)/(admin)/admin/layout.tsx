"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { AppSidebar } from "@/components/app-sidebar"
import { CurrentPageBreadcrumb } from "@/components/current-page-breadcrumb"
import ThemeToggle from "@/components/theme/theme-toggle"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { CompleteProfileModal } from "@/components/auth/complete-profile-modal"


export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { initAuth, user } = useAuthUserStore()
  const { fetchGroups, fetchMyInvitations } = useGroupStore()
  const { fetchMeetings } = useMeetingStore()
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      if (!user) {
        const isAuthenticated = await initAuth()
        if (!isAuthenticated) {
          router.replace("/login")
          return
        }
      }

      await Promise.all([
        fetchGroups(),
        fetchMyInvitations(),
        fetchMeetings(),
      ])
    }

    void run()
  }, [user, initAuth, router, fetchGroups, fetchMyInvitations, fetchMeetings])

  return (
    <SidebarProvider>
      <CompleteProfileModal />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-18 shrink-0 sticky top-0 z-50 bg-sidebar items-center justify-between gap-2 border-b border-b-sidebar-border  px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
        <div className="bg-sidebar min-h-screen flex justify-center ">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
