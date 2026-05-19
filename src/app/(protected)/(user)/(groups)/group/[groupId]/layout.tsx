"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { GroupSidebar } from "@/components/sidebar-group"
import { CurrentPageBreadcrumb } from "@/components/current-page-breadcrumb"
import ThemeToggle from "@/components/theme/theme-toggle"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { CompleteProfileModal } from "@/components/auth/complete-profile-modal"
import { Spinner } from "@/components/ui/spinner"

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ groupId: string }>()
  const router = useRouter()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { fetchGroupById, fetchSelectedGroupMembers, clearSelectedGroup } = useGroupStore()
  const { initAuth } = useAuthUserStore()
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    if (!groupId) return
    let cancelled = false;
    let redirecting = false;

    const load = async () => {
      try {
        const isAuthenticated = await initAuth()
        if (!isAuthenticated) {
          if (!cancelled) {
            redirecting = true;
            router.replace("/");
          }
          return;
        }

        const { selectedGroup } = useGroupStore.getState()
        if (!selectedGroup || selectedGroup.id !== groupId) {
          await fetchGroupById(groupId)
          await fetchSelectedGroupMembers(groupId)
        }
      } catch (error) {
        console.error("Group layout bootstrap error:", error)
        if (!cancelled) {
          redirecting = true;
          router.replace("/");
        }
      } finally {
        if (!cancelled && !redirecting) {
          setIsBootstrapping(false);
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
    <>
      {isBootstrapping && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sidebar px-4">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-chart-4">
              Community Hub
            </p>
            <p className="mt-3 text-lg font-medium text-foreground">
              Authenticating your session...
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we verify your access to this workspace.
            </p>
            <div className="flex justify-center items-center mt-4">
              <Spinner />
            </div>
          </div>
        </div>
      )}
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
    </>
  )
}
