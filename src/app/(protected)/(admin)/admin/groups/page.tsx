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
import { useLanguage } from "@/components/language/language-provider"

export default function AdminGroupsPage() {
  const { user } = useAuthUserStore()
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
        const response = await AdminService.getAllGroups()
        setGroups(response.data)
      } catch {
        toast.error(language === "sw" ? "Imeshindikana kupakia vikundi." : "Failed to load groups.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [language, user?.isAdmin])

  if (!user?.isAdmin && !loading) {
    return <AdminAccessState description={tt("Only administrator accounts can manage groups.", "Akaunti za wasimamizi pekee zinaweza kusimamia vikundi.")} />
  }

  return (
    <AdminPageShell
      title={tt("Manage groups", "Simamia vikundi")}
      description={tt("Update group details, moderate privacy, and keep inactive spaces out of the main workspace.", "Sasisha taarifa za vikundi, dhibiti faragha, na ondoa vikundi visivyotumika kwenye eneo kuu.")}
      currentPath="/admin/groups"
    >
      {loading ? (
        <Card className="border-none bg-card shadow-sm">
          <CardContent className="p-8 text-sm text-muted-foreground">{tt("Loading groups...", "Inapakia vikundi...")}</CardContent>
        </Card>
      ) : (
        <AdminGroupsManager initialGroups={groups} />
      )}
    </AdminPageShell>
  )
}
