"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { Users, ShieldCheck } from "lucide-react"
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
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-[2rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 shadow-sm relative overflow-hidden">

          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-chart-4/15 text-chart-4 rounded-2xl flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  Community Roster
                </h1>
                <span className="inline-flex rounded-full border border-chart-3/30 bg-chart-3/10 px-3 py-1 text-xs font-bold tracking-wide text-chart-3 shadow-sm uppercase">
                  {selectedGroup.name}
                </span>
              </div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Manage roles, activations, and member verifications
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Grid List */}
        <div>
          <MembersList />
        </div>

      </div>
    </div>
  )
}
