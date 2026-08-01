"use client"

import * as React from "react";
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
import { Separator } from "@/components/ui/separator";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { useGroupStore } from "@/store/group/groupUser.store";
import {
  BarChart3,
  BellRing,
  Calendar,
  BookOpen,
  Cog,
  House,
  Home,
  Settings,
  PiggyBank,
  User,
  WalletCards,
  FileText,
  Users
} from "lucide-react";
import Link from "next/link";
import { getGroupMeetingsHref } from "@/lib/meeting-routes";
import { useLanguage } from "@/components/language/language-provider";
import { getTranslation } from "@/lib/i18n";

export function GroupSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthUserStore((state) => state.user);
  const selectedGroup = useGroupStore((state) => state.selectedGroup);
  const groups = useGroupStore((state) => state.groups);
  const fetchGroups = useGroupStore((state) => state.fetchGroups);
  const { language } = useLanguage();

  React.useEffect(() => {
    void fetchGroups();
  }, [fetchGroups]);

  const displayName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User";
  const roleLabel = user?.isAdmin ? "Admin" : user?.isStaff ? "Staff" : "Member";

  const groupNavItems = selectedGroup ? [
    {
      title: getTranslation(language, "actions.dashboard"),
      url: `/group/${selectedGroup.id}`,
      icon: <Home />,
    },
    {
      title: getTranslation(language, "actions.members"),
      url: `/group/${selectedGroup.id}/members`,
      icon: <Users />,
    },
    {
      title: getTranslation(language, "actions.savings"),
      url: `/group/${selectedGroup.id}/savings`,
      icon: <PiggyBank />,
    },

    {
      title: getTranslation(language, "actions.wallet"),
      url: `/group/${selectedGroup.id}/wallet`,
      icon: <WalletCards />,
    },
    {
      title: getTranslation(language, "actions.loans"),
      url: `/group/${selectedGroup.id}/loans`,
      icon: <WalletCards />,
    },
    {
      title: getTranslation(language, "actions.meetings"),
      url: getGroupMeetingsHref(selectedGroup.id),
      icon: <Calendar />,
    },
    {
      title: getTranslation(language, "actions.fines"),
      url: `/group/${selectedGroup.id}/fines`,
      icon: <FileText />,
    },
    {
      title: getTranslation(language, "actions.analytics"),
      url: `/group/${selectedGroup.id}/analytics`,
      icon: <BarChart3 />,
    },
    {
      title: getTranslation(language, "actions.settings"),
      url: `/group/${selectedGroup.id}/settings`,
      icon: <Settings />,
    },
  ] : [];

  const platformNavItems = [
    {
      title: "Home",
      url: "/home",
      icon: <House />,
    },
    {
      title: "My Groups",
      url: "/groups",
      icon: <Users />,
      items: groups.map(g => ({
        title: g.name,
        url: `/group/${g.id}`,
        icon: <BarChart3 className="w-4 h-4" />
      }))
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
      title: getTranslation(language, "actions.guide"),
      url: "/guide",
      icon: <BookOpen />,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <Cog />,
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60" {...props}>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/home">
          <TeamSwitcher
            teams={{
              name: selectedGroup?.name || "Group Dashboard",
              logo: <BarChart3 />,
              role: roleLabel,
            }}
          />
        </Link>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <NavMain items={platformNavItems} label="Platform" />
        {groupNavItems.length > 0 ? (
          <>
            <Separator className="my-1 opacity-50" />
            <NavMain items={groupNavItems} label="Current Group" />
          </>
        ) : null}
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
