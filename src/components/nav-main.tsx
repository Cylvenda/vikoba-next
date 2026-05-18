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
      <SidebarGroupLabel>{label}</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>

              {/* Main Item */}
              <CollapsibleTrigger asChild>

                {
                  !item.items ? (

                    <SidebarMenuButton tooltip={item.title}>
                      {pathname === item.url ? (
                        <span className="flex flex-row items-center gap-2">
                          {item.icon}
                          <span>{item.title}</span>
                        </span>
                      ) : (
                        <Link className="flex flex-row gap-2 items-center" href={item.url} prefetch={false}>
                          {item.icon}
                          <span>{item.title}</span>
                        </Link>
                      )}

                      {/* Show arrow only if submenu exists */}
                      {item.items && (
                        <ChevronRight
                          className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                        />
                      )}
                    </SidebarMenuButton>
                  ) :

                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon}
                      <span>{item.title}</span>

                      {/* Show arrow only if submenu exists */}
                      {item.items && (
                        <ChevronRight
                          className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                        />
                      )}
                    </SidebarMenuButton>
                }

              </CollapsibleTrigger>

              {/* Sub Menu */}
              {item.items && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <div>
                            {pathname === subItem.url ? (
                              <span className="flex flex-row items-center gap-2">
                                {subItem.icon}
                                <span>{subItem.title}</span>
                              </span>
                            ) : (
                              <Link className="flex flex-row gap-2 items-center" href={subItem.url || "#"} prefetch={false}>
                                {subItem.icon}
                                <span>{subItem.title}</span>
                              </Link>
                            )}
                          </div>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
