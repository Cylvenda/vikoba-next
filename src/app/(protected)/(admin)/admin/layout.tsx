"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { AppSidebar } from "@/components/sidebar-admin"
import { CurrentPageBreadcrumb } from "@/components/current-page-breadcrumb"
import ThemeToggle from "@/components/theme/theme-toggle"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { CompleteProfileModal } from "@/components/auth/complete-profile-modal"
import { Spinner } from "@/components/ui/spinner"


export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { initAuth } = useAuthUserStore()
  const { fetchGroups, fetchMyInvitations } = useGroupStore()
  const { fetchMeetings } = useMeetingStore()
  const router = useRouter()
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    let cancelled = false

    const run = async () => {
      let redirecting = false

      try {
        const isAuthenticated = await initAuth()

        if (!isAuthenticated) {
          if (!cancelled) {
            redirecting = true
            router.replace("/login")
          }
          return
        }

        await Promise.allSettled([
          fetchGroups(),
          fetchMyInvitations(),
          fetchMeetings(),
        ])
      } catch (error) {
        console.error("Admin bootstrap error:", error)
      } finally {
        if (!cancelled && !redirecting) {
          setIsBootstrapping(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [initAuth, router, fetchGroups, fetchMyInvitations, fetchMeetings])

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-chart-4">Community Hub</p>
          <p className="mt-3 text-lg font-medium text-foreground">Loading admin workspace...</p>
          <p className="mt-2 text-sm text-muted-foreground">We are checking your session and preparing administrator data.</p>
          <div className="flex items-center justify-center">
            <Spinner />
          </div>
        </div>
      </div>
    )
  }

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
