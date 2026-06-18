"use client"

import { useGroupStore } from '@/store/group/groupUser.store'
import { useMeetingStore } from '@/store/meeting/meeting.store'
import { CalendarCheck, Users, WalletCards, ShieldCheck } from 'lucide-react'
import { formatTzs } from '@/lib/vikoba-finance'
import { useFinanceStore } from '@/store/finance/finance.store'

export default function OverviewCards() {
     const { selectedGroup, selectedGroupMembers } = useGroupStore()
     const { meetings } = useMeetingStore()
     const { snapshot } = useFinanceStore()
     const groupMeetings = meetings.filter((meeting) => meeting.group === selectedGroup?.id)
     const monthStart = new Date()
     monthStart.setDate(1)
     monthStart.setHours(0, 0, 0, 0)
     const thisMonthMeetings = groupMeetings.filter(
          (meeting) => new Date(meeting.scheduled_start) >= monthStart
     )
     const verifiedMembers = selectedGroupMembers.filter((member) => member.is_verified).length
     const activeMembers = selectedGroupMembers.filter((member) => member.is_active).length
     const ongoingMeetings = groupMeetings.filter((meeting) => meeting.status === "ongoing").length
     const scheduledMeetings = groupMeetings.filter((meeting) => meeting.status === "scheduled").length
     const leadersReady = selectedGroupMembers.filter(
          (member) =>
               ["CHAIRPERSON", "SECRETARY", "TREASURER"].includes(member.role) &&
               member.is_active &&
               member.is_verified
     ).length


     return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-chart-4">Member Base</span>
                         <Users className="w-4 h-4 text-chart-4" />
                    </div>
                    <div>
                         <p className="text-3xl font-extrabold text-foreground tracking-tight">
                              {selectedGroupMembers.length || selectedGroup?.members_count || 0}
                         </p>
                         <p className="text-xs font-medium text-muted-foreground mt-1">
                              {verifiedMembers} verified and {activeMembers} active for VICOBA operations
                         </p>
                    </div>
               </div>

               <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-chart-3">Meeting Cycle</span>
                         <CalendarCheck className="w-4 h-4 text-chart-3" />
                    </div>
                    <div>
                         <div className="flex items-end gap-2">
                              <p className="text-3xl font-extrabold text-foreground tracking-tight">{groupMeetings.length}</p>
                         </div>
                         <p className="text-xs font-medium text-muted-foreground mt-1">
                              {scheduledMeetings} scheduled, {ongoingMeetings} live, {thisMonthMeetings.length} this month
                         </p>
                    </div>
               </div>

               <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Governance Ready</span>
                         <ShieldCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                         <p className="text-3xl font-extrabold text-foreground tracking-tight">{leadersReady}/3</p>
                         <p className="text-xs font-medium text-muted-foreground mt-1">leadership seats active and verified</p>
                         <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-bold text-green-600">
                              Chairperson, Secretary, Treasurer
                         </div>
                    </div>
               </div>

               <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-chart-2">Finance Desk</span>
                         <WalletCards className="w-4 h-4 text-chart-2" />
                    </div>
                    <div>
                         <p className="text-3xl font-extrabold text-foreground tracking-tight">{snapshot ? formatTzs(snapshot.totalSavings) : "..."}</p>
                         <p className="text-xs font-medium text-muted-foreground mt-1">Real-time verified savings tracked in the ledger</p>
                         <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-chart-2/10 px-2 py-0.5 text-[9px] font-bold text-chart-2">
                              {snapshot ? formatTzs(snapshot.activeLoanBook) : "..."} active loan principal outstanding
                         </div>
                    </div>
               </div>
          </div>
     )
}
