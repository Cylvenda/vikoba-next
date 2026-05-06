"use client"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { AdminService } from "@/api/services/admin.service"
import { AdminAccessState } from "@/components/admin/admin-access-state"
import { AdminGroupsManager } from "@/components/admin/admin-groups-manager"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import type { Group } from "@/store/group/group.types"

export default function AdminGroupsPage() {
  const { user } = useAuthUserStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.isAdmin) {
        setLoading(false)
        return
      }

      try {
        const response = await AdminService.getAllGroups()
        setGroups(response.data)
      } catch {
        toast.error("Failed to load groups.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user?.isAdmin])

  if (!user?.isAdmin && !loading) {
    return <AdminAccessState description="Only administrator accounts can manage groups." />
  }

  return (
    <AdminPageShell
      title="Manage groups"
      description="Update group details, moderate privacy, and keep inactive spaces out of the main workspace."
      currentPath="/admin/groups"
    >
      {loading ? (
        <Card className="border-none bg-card shadow-sm">
          <CardContent className="p-8 text-sm text-muted-foreground">Loading groups...</CardContent>
        </Card>
      ) : (
        <AdminGroupsManager initialGroups={groups} />
      )}
    </AdminPageShell>
  )
}
