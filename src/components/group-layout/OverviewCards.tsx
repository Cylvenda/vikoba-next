"use client"

import { useGroupStore } from '@/store/group/groupUser.store'
import { useMeetingStore } from '@/store/meeting/meeting.store'
import { CalendarCheck, Users, WalletCards, ShieldCheck } from 'lucide-react'
import { formatTzs } from '@/lib/vikoba-finance'
import { useFinanceStore } from '@/store/finance/finance.store'
import { useLanguage } from '@/components/language/language-provider'

export default function OverviewCards() {
     const { selectedGroup, selectedGroupMembers } = useGroupStore()
     const { meetings } = useMeetingStore()
     const { snapshot } = useFinanceStore()
     const { language } = useLanguage()
     const tt = (en: string, sw: string) => language === "sw" ? sw : en
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
                         <span className="text-[10px] font-bold uppercase tracking-widest text-chart-4">{tt("Member Base", "Wanachama")}</span>
                         <Users className="w-4 h-4 text-chart-4" />
                    </div>
                    <div>
                         <p className="text-3xl font-extrabold text-foreground tracking-tight">
                              {selectedGroupMembers.length || selectedGroup?.members_count || 0}
                         </p>
                         <p className="text-xs font-medium text-muted-foreground mt-1">
                              {verifiedMembers} {tt("verified and", "wamethibitishwa na")} {activeMembers} {tt("active for VICOBA operations", "ni hai kwa shughuli za VICOBA")}
                         </p>
                    </div>
               </div>

               <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-chart-3">{tt("Meeting Cycle", "Mzunguko wa Vikao")}</span>
                         <CalendarCheck className="w-4 h-4 text-chart-3" />
                    </div>
                    <div>
                         <div className="flex items-end gap-2">
                              <p className="text-3xl font-extrabold text-foreground tracking-tight">{groupMeetings.length}</p>
                         </div>
                         <p className="text-xs font-medium text-muted-foreground mt-1">
                              {scheduledMeetings} {tt("scheduled", "vimepangwa")}, {ongoingMeetings} {tt("live", "vinaendelea")}, {thisMonthMeetings.length} {tt("this month", "mwezi huu")}
                         </p>
                    </div>
               </div>

               <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">{tt("Governance Ready", "Uongozi Tayari")}</span>
                         <ShieldCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                         <p className="text-3xl font-extrabold text-foreground tracking-tight">{leadersReady}/3</p>
                         <p className="text-xs font-medium text-muted-foreground mt-1">{tt("leadership seats active and verified", "nafasi za uongozi ni hai na zimethibitishwa")}</p>
                         <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-bold text-green-600">
                              {tt("Chairperson, Secretary, Treasurer", "Mwenyekiti, Katibu, Mweka Hazina")}
                         </div>
                    </div>
               </div>

               <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-chart-2">{tt("Finance Desk", "Kitengo cha Fedha")}</span>
                         <WalletCards className="w-4 h-4 text-chart-2" />
                    </div>
                    <div>
                         <p className="text-3xl font-extrabold text-foreground tracking-tight">{snapshot ? formatTzs(snapshot.totalSavings) : "..."}</p>
                         <p className="text-xs font-medium text-muted-foreground mt-1">{tt("Real-time verified savings tracked in the ledger", "Akiba iliyothibitishwa inafuatiliwa kwenye rejista")}</p>
                         <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-chart-2/10 px-2 py-0.5 text-[9px] font-bold text-chart-2">
                              {snapshot ? formatTzs(snapshot.activeLoanBook) : "..."} {tt("active loan principal outstanding", "mtaji wa mikopo hai ambao haujalipwa")}
                         </div>
                    </div>
               </div>
          </div>
     )
}
