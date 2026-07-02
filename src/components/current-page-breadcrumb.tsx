"use client"

import { usePathname } from "next/navigation"
import { useLanguage } from "@/components/language/language-provider"
import { getTranslation } from "@/lib/i18n"
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
     const { language } = useLanguage()
     const segments = pathname.split("/").filter(Boolean)
     const currentSegment = segments.at(-1) ?? "dashboard"
     const isDashboardHome = pathname === "/home"
     const isGroupDashboard = segments[0] === "group" && segments.length === 2
     const localizeSegment = (segment: string) => {
          const key = `breadcrumb.${segment.toLowerCase()}`
          const translated = getTranslation(language, key)
          return translated === key ? formatSegment(segment) : translated
     }
     const currentPage = isDashboardHome
          ? getTranslation(language, "breadcrumb.home")
          : isGroupDashboard
            ? getTranslation(language, "breadcrumb.dashboard")
            : localizeSegment(currentSegment)
     const isDashboard = isDashboardHome
     const dashboardLink = "/home"


     return (
          <Breadcrumb>
               <BreadcrumbList>
                    {!isDashboard && (
                         <>
                              <BreadcrumbItem className="hidden md:block">
                                   <BreadcrumbLink href={dashboardLink}>
                                        {getTranslation(language, "breadcrumb.home")}
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
