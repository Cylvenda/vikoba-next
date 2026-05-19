"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRight } from "lucide-react"

export function NavMain({
  items,
  label = "Platform",
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title?: string
      icon?: React.ReactNode
      url?: string
    }[]
  }[]
  label?: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-3">
        {label}
      </SidebarGroupLabel>

      <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const isDashboardLink = item.title === "Dashboard" || item.title === "Home" || item.title === "My Groups"
          const isActive = pathname === item.url || (!isDashboardLink && pathname.startsWith(item.url + "/"))
          
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>

                {/* Main Item */}
                <CollapsibleTrigger asChild>

                  {
                    !item.items ? (

                      <SidebarMenuButton 
                        tooltip={item.title} 
                        isActive={isActive}
                        className={`rounded-xl transition-all duration-200 ${isActive ? 'bg-chart-3/10 text-chart-3 font-bold shadow-sm' : 'hover:bg-muted font-medium text-muted-foreground hover:text-foreground'}`}
                      >
                        {isActive ? (
                          <span className="flex flex-row items-center gap-3 py-1">
                            <span className="text-chart-3">{item.icon}</span>
                            <span>{item.title}</span>
                          </span>
                        ) : (
                          <Link className="flex flex-row gap-3 items-center w-full py-1" href={item.url} prefetch={false}>
                            <span className="text-chart-3/70 group-hover:text-chart-3 transition-colors">{item.icon}</span>
                            <span>{item.title}</span>
                          </Link>
                        )}

                        {/* Show arrow only if submenu exists */}
                        {item.items && (
                          <ChevronRight
                            className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 opacity-50"
                          />
                        )}
                      </SidebarMenuButton>
                    ) :

                      <SidebarMenuButton 
                        tooltip={item.title}
                        isActive={isActive}
                        className={`rounded-xl transition-all duration-200 ${isActive ? 'bg-chart-3/10 text-chart-3 font-bold shadow-sm' : 'hover:bg-muted font-medium text-muted-foreground hover:text-foreground'}`}
                      >
                        <span className={`flex items-center gap-3 py-1 ${isActive ? 'text-chart-3' : 'text-chart-3/70 group-hover:text-chart-3'}`}>
                          {item.icon}
                        </span>
                        <span>{item.title}</span>

                        {/* Show arrow only if submenu exists */}
                        {item.items && (
                          <ChevronRight
                            className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 opacity-50"
                          />
                        )}
                      </SidebarMenuButton>
                  }

                </CollapsibleTrigger>

                {/* Sub Menu */}
                {item.items && (
                  <CollapsibleContent>
                    <SidebarMenuSub className="mt-1 border-l border-border/50 ml-4 pl-4 space-y-1">
                      {item.items.map((subItem) => {
                        const isSubActive = pathname === subItem.url
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton 
                              asChild
                              isActive={isSubActive}
                              className={`rounded-lg transition-all ${isSubActive ? 'bg-chart-3/10 text-chart-3 font-bold' : 'hover:bg-muted font-medium text-muted-foreground hover:text-foreground'}`}
                            >
                              <div>
                                {isSubActive ? (
                                  <span className="flex flex-row items-center gap-2 py-0.5">
                                    <span className="text-chart-3/80">{subItem.icon}</span>
                                    <span>{subItem.title}</span>
                                  </span>
                                ) : (
                                  <Link className="flex flex-row gap-2 items-center w-full py-0.5" href={subItem.url || "#"} prefetch={false}>
                                    <span className="text-chart-3/50 group-hover:text-chart-3/80 transition-colors">{subItem.icon}</span>
                                    <span>{subItem.title}</span>
                                  </Link>
                                )}
                              </div>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
