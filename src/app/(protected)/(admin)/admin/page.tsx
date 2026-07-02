"use client"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { AdminService, type AdminUser } from "@/api/services/admin.service"
import { AdminAccessState } from "@/components/admin/admin-access-state"
import { AdminOverview } from "@/components/admin/admin-overview"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import type { Group } from "@/store/group/group.types"
import { useLanguage } from "@/components/language/language-provider"

export default function AdminOverviewPage() {
  const { user } = useAuthUserStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en

  useEffect(() => {
    const load = async () => {
      if (!user?.isAdmin) {
        setLoading(false)
        return
      }

      try {
        const [usersResponse, groupsResponse] = await Promise.all([
          AdminService.getAllUsers(),
          AdminService.getAllGroups(),
        ])
        setUsers(usersResponse.data)
        setGroups(groupsResponse.data)
      } catch {
        toast.error(language === "sw" ? "Imeshindikana kupakia muhtasari wa usimamizi." : "Failed to load admin overview.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [language, user?.isAdmin])

  if (!user?.isAdmin && !loading) {
    return <AdminAccessState />
  }

  return (
    <AdminPageShell
      title={tt("Workspace administration", "Usimamizi wa mfumo")}
      description={tt("Track the current health of users and groups, then jump into the exact section that needs attention.", "Fuatilia hali ya watumiaji na vikundi, kisha fungua sehemu inayohitaji uangalizi.")}
      currentPath="/admin"
    >
      {loading ? (
        <Card className="border-none bg-card shadow-sm">
          <CardContent className="p-8 text-sm text-muted-foreground">{tt("Loading admin data...", "Inapakia taarifa za usimamizi...")}</CardContent>
        </Card>
      ) : (
        <AdminOverview users={users} groups={groups} />
      )}
    </AdminPageShell>
  )
}
