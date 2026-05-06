"use client"

import Link from "next/link"
import { Building2, ShieldCheck, UserRound } from "lucide-react"
import type { AdminUser } from "@/api/services/admin.service"
import type { Group } from "@/store/group/group.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type AdminOverviewProps = {
  users: AdminUser[]
  groups: Group[]
}

export function AdminOverview({ users, groups }: AdminOverviewProps) {
  const activeUsers = users.filter((user) => user.is_active)
  const staffUsers = users.filter((user) => user.is_staff || user.is_admin)
  const privateGroups = groups.filter((group) => group.is_private)
  const activeGroups = groups.filter((group) => group.is_active)
  const totalMembers = groups.reduce((sum, group) => sum + (group.members_count || 0), 0)

  const overviewCards = [
    {
      title: "Active users",
      description: "Accounts that can access the workspace right now.",
      value: activeUsers.length,
      icon: <UserRound className="size-5" />,
    },
    {
      title: "Privileged users",
      description: "Admin or staff accounts with elevated access.",
      value: staffUsers.length,
      icon: <ShieldCheck className="size-5" />,
    },
    {
      title: "Active groups",
      description: "Groups currently visible and available for meetings.",
      value: activeGroups.length,
      icon: <Building2 className="size-5" />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        {overviewCards.map((card) => (
          <Card key={card.title} className="border-none bg-card shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-3">
                  {card.icon}
                </div>
                <span className="rounded-full bg-chart-2/10 px-3 py-1 text-xs font-semibold text-chart-3">
                  Live
                </span>
              </div>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
              <CardDescription>{card.title}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{card.description}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Workspace snapshot</CardTitle>
            <CardDescription>Quick totals to guide moderation and access reviews.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">Total users</p>
              <p className="mt-2 text-3xl font-semibold">{users.length}</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">Private groups</p>
              <p className="mt-2 text-3xl font-semibold">{privateGroups.length}</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">Tracked memberships</p>
              <p className="mt-2 text-3xl font-semibold">{totalMembers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Management shortcuts</CardTitle>
            <CardDescription>Jump straight into the area you need to update.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-between">
              <Link href="/admin/users">
                Review users
                <span>{users.length}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/admin/groups">
                Review groups
                <span>{groups.length}</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
