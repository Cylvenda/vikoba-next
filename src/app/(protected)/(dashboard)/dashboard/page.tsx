"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GroupList from '@/components/dashboard/GroupList'
import MeetingList from '@/components/dashboard/MeetingList'
import OverviewCard from '@/components/dashboard/OverviewCard'
import { Card } from '@/components/ui/card'
import { useAuthUserStore } from '@/store/auth/userAuth.store'
import { useGroupStore } from '@/store/group/groupUser.store'
import { useMeetingStore } from '@/store/meeting/meeting.store'
import { Calendar, PersonStanding, TvMinimalPlayIcon } from 'lucide-react'


const Page = () => {
     const router = useRouter()
     const { user } = useAuthUserStore()
     const { groups, invitations } = useGroupStore()
     const { meetings } = useMeetingStore()

     useEffect(() => {
          if (user?.isAdmin) {
               router.replace("/admin")
          }
     }, [user?.isAdmin, router])

     const today = new Date()
     const todaysMeetings = meetings.filter((meeting) => {
          const meetingDate = new Date(meeting.scheduled_start)
          return meetingDate.toDateString() === today.toDateString()
     })
     const activeMeetings = meetings.filter((meeting) => meeting.status === "ongoing")

     const overViewData = [
          {
               title: "Active Meeting",
               description: "Happening right now",
               status: "Live",
               count: activeMeetings.length,
               icons: <TvMinimalPlayIcon />
          },
          {
               title: "My Groups",
               description: "Active Groups",
               status: "Active",
               count: groups.length,
               icons: <PersonStanding />
          },
          {
               title: "Groups Invitations",
               description: "New Group Invitations",
               status: "New",
               count: invitations.length,
               icons: <Calendar />
          },
          {
               title: "Total Meetings",
               description: "Attended Meeting",
               status: "Participations",
               count: meetings.length,
               icons: <Calendar />
          },
     ]

     return (
          <div className='w-full max-w-8xl' >
               <div className="grid grid-cols-1 md:grid-cols-4 gap-5 p-5 md:p-10">
                    {overViewData.map((item, i) => <OverviewCard key={i} {...item} />)}
               </div>

               <Card className='h-fit w-full py-5 px-4 md:px-10 border-none bg-muted rounded-md flex flex-col md:flex-row justify-between'>
                    <GroupList groups={groups} />
                    <MeetingList meetings={todaysMeetings} />
               </Card>
          </div>
     )
}

export default Page
