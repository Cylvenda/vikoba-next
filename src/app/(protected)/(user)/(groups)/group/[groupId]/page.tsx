"use client"

import GroupHeader from "@/components/group-layout/GroupHeader"
import MeetingInProgress from "@/components/group-layout/MeetingInProgress"
import MeetingsList from "@/components/group-layout/MeetingsList"
import MembersList from "@/components/group-layout/MembersList"
import OverviewCards from "@/components/group-layout/OverviewCards"
import { useGroupStore } from "@/store/group/groupUser.store"

export default function GroupPage() {
  const { selectedGroup } = useGroupStore()

  // Data is already fetched by the layout
  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="text-center text-muted-foreground"> Loading group...</div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mx-auto grid w-full max-w-screen-3xl gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.95fr)]">
      <div className="min-w-0 space-y-6">
        <GroupHeader />
        <OverviewCards />
        <MeetingInProgress />
        <div className="space-y-3">
          <MeetingsList />
        </div>
      </div>

      <div className="min-w-0">
        <MembersList />
      </div>
      </div>
    </div>
  )
}