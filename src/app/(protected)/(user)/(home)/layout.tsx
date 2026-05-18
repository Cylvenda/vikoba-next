"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { useGroupStore } from "@/store/group/groupUser.store";
import { useMeetingStore } from "@/store/meeting/meeting.store";
import { AppSidebar } from "@/components/sidebar-user";
import { CurrentPageBreadcrumb } from "@/components/current-page-breadcrumb";
import ThemeToggle from "@/components/theme/theme-toggle";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CompleteProfileModal } from "@/components/auth/complete-profile-modal";
import { Spinner } from "@/components/ui/spinner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initAuth } = useAuthUserStore();
  const { fetchGroups, fetchMyInvitations } = useGroupStore();
  const { fetchMeetings } = useMeetingStore();
  const router = useRouter();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Track whether we initiated a redirect so `finally` knows
      // NOT to call setIsBootstrapping(false) — prevents a flash of
      // the sidebar/layout while the browser is still navigating away.
      let redirecting = false;

      try {
        const isAuthenticated = await initAuth();

        if (!isAuthenticated) {
          if (!cancelled) {
            redirecting = true;
            router.replace("/login");
          }
          return;
        }

        await Promise.allSettled([
          fetchGroups(),
          fetchMyInvitations(),
          fetchMeetings(),
        ]);
      } catch (error) {
        // On unexpected errors (network, server down) redirect instead
        // of revealing a broken dashboard with no user / data loaded.
        console.error("Dashboard bootstrap error:", error);
        if (!cancelled) {
          redirecting = true;
          router.replace("/login");
        }
      } finally {
        // Only unhide the layout when we are staying on the page.
        if (!cancelled && !redirecting) {
          setIsBootstrapping(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // store fns are stable Zustand refs

  return (
    <>
      {isBootstrapping && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sidebar px-4">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-chart-4">
              Community Hub
            </p>
            <p className="mt-3 text-lg font-medium text-foreground">
              Loading your Home workspace...
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              We are checking your session and preparing your dashboard.
            </p>
            <div className="flex justify-center items-center">
              <Spinner />
            </div>
          </div>
        </div>
      )}
      <SidebarProvider>
      <CompleteProfileModal />
      <AppSidebar />
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
  );
}
