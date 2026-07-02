"use client";

import * as React from "react";
import Image from "next/image";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Separator } from "./ui/separator";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { BellRing, BookOpen, Cog, House, User } from "lucide-react";

const navMain = [
  {
    title: "Home",
    url: "/home",
    icon: <House />,
  },
  {
    title: "Guide",
    url: "/guide",
    icon: <BookOpen />,
  },
  {
    title: "My Groups",
    url: "/groups",
    icon: <User />,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: <BellRing />,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: <User />,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: <Cog />,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthUserStore((state) => state.user);
  const displayName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User";
  const roleLabel = user?.isAdmin ? "Admin" : "Member";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={{
            name: "Community Hub",
            logo: <Image src="/logo.png" alt="VICOBA Logo" width={32} height={32} className="object-cover rounded-md" />,
            role: roleLabel,
          }}
        />
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <Separator />
      <SidebarFooter>
        <NavUser
          user={{
            name: displayName,
            email: user?.email || "No email",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
