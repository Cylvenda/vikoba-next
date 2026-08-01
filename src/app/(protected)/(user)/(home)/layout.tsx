"use client";

import { useEffect } from "react";
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
import LanguageToggle from "@/components/language/language-toggle";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initAuth } = useAuthUserStore();
  const { fetchGroups, fetchMyInvitations } = useGroupStore();
  const { fetchMeetings } = useMeetingStore();
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const isAuthenticated = await initAuth();

        if (!isAuthenticated) {
          if (!cancelled) {
            router.replace("/");
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
          router.replace("/");
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
    <SidebarProvider>
      <CompleteProfileModal />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 sm:h-16 shrink-0 sticky top-0 z-50 bg-sidebar items-center justify-between gap-2 border-b border-b-sidebar-border px-3 sm:px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-10 sm:group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-6"
            />
            <CurrentPageBreadcrumb />
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle compact />
            <ThemeToggle />
          </div>
        </header>
        <div className="min-h-screen w-full bg-sidebar">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
