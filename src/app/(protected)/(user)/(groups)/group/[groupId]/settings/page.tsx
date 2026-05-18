"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import { useGroupStore } from "@/store/group/groupUser.store"

export default function GroupSettingsPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId

  const { selectedGroup, fetchGroupById } = useGroupStore()

  useEffect(() => {
    if (groupId && (!selectedGroup || selectedGroup.id !== groupId)) {
      void fetchGroupById(groupId)
    }
  }, [groupId, selectedGroup, fetchGroupById])

  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-screen-2xl">
        <Card className="border-none bg-card shadow-sm">
          <CardContent className="text-center py-8 text-muted-foreground">
            Loading group...
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-2xl">
      <Card className="border-none bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Group Settings
          </CardTitle>
          <CardDescription>
            Manage {selectedGroup.name} settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Group settings will be available here.</p>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
