"use client"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { AdminService, type AdminUser } from "@/api/services/admin.service"
import { AdminAccessState } from "@/components/admin/admin-access-state"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { AdminUsersManager } from "@/components/admin/admin-users-manager"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useLanguage } from "@/components/language/language-provider"

export default function AdminUsersPage() {
  const { user } = useAuthUserStore()
  const [users, setUsers] = useState<AdminUser[]>([])
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
        const response = await AdminService.getAllUsers()
        setUsers(response.data)
      } catch {
        toast.error(language === "sw" ? "Imeshindikana kupakia watumiaji." : "Failed to load users.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [language, user?.isAdmin])

  if (!user?.isAdmin && !loading) {
    return <AdminAccessState description={tt("Only administrator accounts can manage users.", "Akaunti za wasimamizi pekee zinaweza kusimamia watumiaji.")} />
  }

  return (
    <AdminPageShell
      title={tt("Manage users", "Simamia watumiaji")}
      description={tt("Search the full user directory, update profile details, and control who keeps elevated access.", "Tafuta watumiaji, sasisha wasifu, na dhibiti ruhusa za usimamizi.")}
      currentPath="/admin/users"
    >
      {loading ? (
        <Card className="border-none bg-card shadow-sm">
          <CardContent className="p-8 text-sm text-muted-foreground">{tt("Loading users...", "Inapakia watumiaji...")}</CardContent>
        </Card>
      ) : (
        <AdminUsersManager initialUsers={users} />
      )}
    </AdminPageShell>
  )
}
