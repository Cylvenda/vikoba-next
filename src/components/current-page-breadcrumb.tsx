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
     const currentPage = formatSegment(currentSegment)
     const isDashboard = currentSegment === "dashboard"
     const dashboardLink = "/dashboard"


     return (
          <Breadcrumb>
               <BreadcrumbList>
                    {!isDashboard && (
                         <>
                              <BreadcrumbItem className="hidden md:block">
                                   <BreadcrumbLink href={dashboardLink}>
                                        Dashboard
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
