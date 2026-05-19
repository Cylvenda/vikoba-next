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

const navMain = (groupId: string) => [
  {
    title: "Dashboard",
    url: `/group/${groupId}`,
    icon: <Home />,
  },
  {
    title: "Savings",
    url: `/group/${groupId}/savings`,
    icon: <PiggyBank />,
  },
  {
    title: "Loans",
    url: `/group/${groupId}/loans`,
    icon: <WalletCards />,
  },
  {
    title: "Fines",
    url: `/group/${groupId}/fines`,
    icon: <FileText />,
  },
  {
    title: "Meetings",
    url: getGroupMeetingsHref(groupId),
    icon: <Calendar />,
  },
  {
    title: "Members",
    url: `/group/${groupId}/members`,
    icon: <Users />,
  },
  {
    title: "Settings",
    url: `/group/${groupId}/settings`,
    icon: <Settings />,
  },
];

export function GroupSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthUserStore((state) => state.user);
  const selectedGroup = useGroupStore((state) => state.selectedGroup);
  const groups = useGroupStore((state) => state.groups);
  const fetchGroups = useGroupStore((state) => state.fetchGroups);

  React.useEffect(() => {
    void fetchGroups();
  }, [fetchGroups]);

  const displayName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User";
  const roleLabel = user?.isAdmin ? "Admin" : user?.isStaff ? "Staff" : "Member";

  const groupNavItems = selectedGroup ? navMain(selectedGroup.id) : [];

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
              logo: <BarChart3 className="text-chart-3" />,
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
