"use client"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { AdminService, type AdminUser } from "@/api/services/admin.service"
import { AdminAccessState } from "@/components/admin/admin-access-state"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { AdminUsersManager } from "@/components/admin/admin-users-manager"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthUserStore } from "@/store/auth/userAuth.store"

export default function AdminUsersPage() {
  const { user } = useAuthUserStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.isAdmin) {
        setLoading(false)
        return
      }

      try {
        const response = await AdminService.getAllUsers()
        setUsers(response.data)
      } catch {
        toast.error("Failed to load users.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user?.isAdmin])

  if (!user?.isAdmin && !loading) {
    return <AdminAccessState description="Only administrator accounts can manage users." />
  }

  return (
    <AdminPageShell
      title="Manage users"
      description="Search the full user directory, update profile details, and control who keeps elevated access."
      currentPath="/admin/users"
    >
      {loading ? (
        <Card className="border-none bg-card shadow-sm">
          <CardContent className="p-8 text-sm text-muted-foreground">Loading users...</CardContent>
        </Card>
      ) : (
        <AdminUsersManager initialUsers={users} />
      )}
    </AdminPageShell>
  )
}
