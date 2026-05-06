"use client"

import { useGroupStore } from '@/store/group/groupUser.store'
import { useMeetingStore } from '@/store/meeting/meeting.store'
import { CalendarCheck, Users, Clock } from 'lucide-react'

export default function OverviewCards() {
       const { selectedGroup, selectedGroupMembers } = useGroupStore()
       const { meetings } = useMeetingStore()
       const groupMeetings = meetings.filter((meeting) => meeting.group === selectedGroup?.id)
       const monthStart = new Date()
       monthStart.setDate(1)
       monthStart.setHours(0, 0, 0, 0)
       const thisMonthMeetings = groupMeetings.filter(
            (meeting) => new Date(meeting.scheduled_start) >= monthStart
       )

     const cards = [
          { title: 'Total Meetings', value: groupMeetings.length, icon: <CalendarCheck size={20} /> },
          { title: 'Members', value: selectedGroupMembers.length || selectedGroup?.members_count || 0, icon: <Users size={20} /> },
          { title: 'This Month', value: thisMonthMeetings.length, icon: <Clock size={20} /> },
     ]

     return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {cards.map((card) => (
                    <div key={card.title} className="flex items-center rounded-2xl bg-card p-4 shadow">
                         <div className="rounded-full bg-chart-2/15 p-3 text-chart-3">{card.icon}</div>
                         <div className="ml-4">
                              <p className="text-muted-foreground">{card.title}</p>
                              <p className="text-xl font-bold">{card.value}</p>
                         </div>
                    </div>
               ))}
          </div>
     )
}
