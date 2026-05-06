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

export default function AdminOverviewPage() {
  const { user } = useAuthUserStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

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
        toast.error("Failed to load admin overview.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user?.isAdmin])

  if (!user?.isAdmin && !loading) {
    return <AdminAccessState />
  }

  return (
    <AdminPageShell
      title="Workspace administration"
      description="Track the current health of users and groups, then jump into the exact section that needs attention."
      currentPath="/admin"
    >
      {loading ? (
        <Card className="border-none bg-card shadow-sm">
          <CardContent className="p-8 text-sm text-muted-foreground">Loading admin data...</CardContent>
        </Card>
      ) : (
        <AdminOverview users={users} groups={groups} />
      )}
    </AdminPageShell>
  )
}
