"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import MembersList from "@/components/group-layout/MembersList"
import { useGroupStore } from "@/store/group/groupUser.store"

export default function GroupMembersPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId

  const { selectedGroup, fetchSelectedGroupMembers } = useGroupStore()

  useEffect(() => {
    if (groupId) {
      void fetchSelectedGroupMembers(groupId)
    }
  }, [groupId, fetchSelectedGroupMembers])

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
            <Users className="h-8 w-8" />
            Members
          </CardTitle>
          <CardDescription>
            {selectedGroup.name} members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersList />
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
