"use client"

import { usePathname } from "next/navigation"
import {
     Breadcrumb,
     BreadcrumbItem,
     BreadcrumbLink,
     BreadcrumbList,
     BreadcrumbPage,
     BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function formatSegment(segment: string) {
     return segment
          .split("-")
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
}

export function CurrentPageBreadcrumb() {
     const pathname = usePathname()
     const segments = pathname.split("/").filter(Boolean)
     const currentSegment = segments.at(-1) ?? "dashboard"
     const isDashboardHome = pathname === "/home"
     const isGroupDashboard = segments[0] === "group" && segments.length === 2
     const currentPage = isDashboardHome
          ? "Home"
          : isGroupDashboard
            ? "Dashboard"
            : formatSegment(currentSegment)
     const isDashboard = isDashboardHome
     const dashboardLink = "/home"


     return (
          <Breadcrumb>
               <BreadcrumbList>
                    {!isDashboard && (
                         <>
                              <BreadcrumbItem className="hidden md:block">
                                   <BreadcrumbLink href={dashboardLink}>
                                        Home
                                   </BreadcrumbLink>
                              </BreadcrumbItem>
                              <BreadcrumbSeparator className="hidden md:block" />
                         </>
                    )}

                    <BreadcrumbItem>
                         <BreadcrumbPage>{currentPage}</BreadcrumbPage>
                    </BreadcrumbItem>
               </BreadcrumbList>
          </Breadcrumb>
     )
}
