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
import { useLanguage } from "@/components/language/language-provider";
import { getTranslation } from "@/lib/i18n";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthUserStore((state) => state.user);
  const { language } = useLanguage();
  const displayName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User";
  const roleLabel = user?.isAdmin ? "Admin" : "Member";

  const navMain = [
    {
      title: getTranslation(language, "actions.home"),
      url: "/home",
      icon: <House />,
    },
    {
      title: getTranslation(language, "actions.guide"),
      url: "/guide",
      icon: <BookOpen />,
    },
    {
      title: getTranslation(language, "actions.myGroups"),
      url: "/groups",
      icon: <User />,
    },
    {
      title: getTranslation(language, "actions.notifications"),
      url: "/notifications",
      icon: <BellRing />,
    },
    {
      title: getTranslation(language, "actions.profile"),
      url: "/profile",
      icon: <User />,
    },
    {
      title: getTranslation(language, "actions.settings"),
      url: "/settings",
      icon: <Cog />,
    },
  ];

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
