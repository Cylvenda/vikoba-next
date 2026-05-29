"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { Users, ShieldCheck } from "lucide-react"
import MembersList from "@/components/group-layout/MembersList"
import { useGroupStore } from "@/store/group/groupUser.store"
import { Badge } from "@/components/ui/badge"

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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Users className="w-10 h-10 animate-pulse text-chart-3/50" />
          <p className="font-medium tracking-tight">Loading community members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-8">
      <div className="mx-auto w-full max-w-screen-3xl space-y-6">
        
        <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-md">
          <div className="absolute inset-0 bg-primary opacity-10" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-chart-4/15 text-chart-4 shadow-sm">
                  <Users className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 uppercase tracking-[0.18em]">
                  {selectedGroup.name}
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Community Roster
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Manage roles, activations, and member verifications
              </p>
            </div>
          </div>
        </section>

        {/* Dynamic Grid List */}
        <div>
          <MembersList />
        </div>

      </div>
    </div>
  )
}
