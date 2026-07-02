"use client"

import Link from "next/link"
import { Building2, ShieldCheck, UserRound } from "lucide-react"
import type { AdminUser } from "@/api/services/admin.service"
import type { Group } from "@/store/group/group.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language/language-provider"

type AdminOverviewProps = {
  users: AdminUser[]
  groups: Group[]
}

export function AdminOverview({ users, groups }: AdminOverviewProps) {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  const activeUsers = users.filter((user) => user.is_active)
  const staffUsers = users.filter((user) => user.is_staff || user.is_admin)
  const privateGroups = groups.filter((group) => group.is_private)
  const activeGroups = groups.filter((group) => group.is_active)
  const totalMembers = groups.reduce((sum, group) => sum + (group.members_count || 0), 0)

  const overviewCards = [
    {
      title: tt("Active users", "Watumiaji hai"),
      description: tt("Accounts that can access the workspace right now.", "Akaunti zinazoweza kufikia mfumo kwa sasa."),
      value: activeUsers.length,
      icon: <UserRound className="size-5" />,
    },
    {
      title: tt("Privileged users", "Watumiaji wenye ruhusa"),
      description: tt("Admin or staff accounts with elevated access.", "Akaunti za wasimamizi au wafanyakazi zenye ruhusa za juu."),
      value: staffUsers.length,
      icon: <ShieldCheck className="size-5" />,
    },
    {
      title: tt("Active groups", "Vikundi hai"),
      description: tt("Groups currently visible and available for meetings.", "Vikundi vinavyoonekana na vinavyopatikana kwa vikao."),
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
                  {tt("Live", "Hai")}
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
            <CardTitle>{tt("Workspace snapshot", "Muhtasari wa mfumo")}</CardTitle>
            <CardDescription>{tt("Quick totals to guide moderation and access reviews.", "Jumla za haraka kwa usimamizi na ukaguzi wa ufikiaji.")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">{tt("Total users", "Jumla ya watumiaji")}</p>
              <p className="mt-2 text-3xl font-semibold">{users.length}</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">{tt("Private groups", "Vikundi vya faragha")}</p>
              <p className="mt-2 text-3xl font-semibold">{privateGroups.length}</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">{tt("Tracked memberships", "Uanachama unaofuatiliwa")}</p>
              <p className="mt-2 text-3xl font-semibold">{totalMembers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{tt("Management shortcuts", "Njia za mkato za usimamizi")}</CardTitle>
            <CardDescription>{tt("Jump straight into the area you need to update.", "Nenda moja kwa moja kwenye eneo la kusasisha.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-between">
              <Link href="/admin/users">
                {tt("Review users", "Kagua watumiaji")}
                <span>{users.length}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/admin/groups">
                {tt("Review groups", "Kagua vikundi")}
                <span>{groups.length}</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
