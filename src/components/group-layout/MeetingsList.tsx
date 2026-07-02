import Link from "next/link"
import { CalendarDays, Clock3, Radio } from "lucide-react"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { useMemo } from "react"
import { getMeetingDetailHref, getMeetingSessionHref } from "@/lib/meeting-routes"

const MeetingsList = () => {
     const { selectedGroup } = useGroupStore()
     const { meetings } = useMeetingStore()
     const groupMeetings = useMemo(() => {
          return meetings
               .filter((meeting) => meeting.group === selectedGroup?.id)
               .filter((meeting) => ["scheduled", "ongoing"].includes(meeting.status))
               .sort((left, right) => new Date(right.scheduled_start).getTime() - new Date(left.scheduled_start).getTime())
     }, [meetings, selectedGroup?.id])

     return (
          <div className="rounded-[1.5rem] border border-border/50 bg-card/70 p-4 shadow-sm">
               <div className="divide-y divide-border/40">
                    {groupMeetings.length === 0 && (
                         <p className="py-6 text-sm text-muted-foreground">No scheduled or active meetings for this group yet.</p>
                    )}
                    {groupMeetings.map((m) => (
                         <div key={m.id} className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:gap-6">
                              {(() => {
                                   const meetingHref = m.status === "ongoing"
                                        ? getMeetingSessionHref(m.id, m.group)
                                        : getMeetingDetailHref(m.id, m.group)
                                   const meetingLabel = m.status === "ongoing" ? "Join Session" : "Open Details"
                                   const statusClassName =
                                        m.status === "ongoing"
                                             ? "bg-green-500/15 text-green-700"
                                             : m.status === "ended"
                                                  ? "bg-red-500/15 text-red-700"
                                                  : m.status === "cancelled"
                                                       ? "bg-muted text-muted-foreground"
                                                       : "bg-chart-2/15 text-chart-2"

                                   return (
                                        <>
                                             <div className="flex items-center gap-4 lg:min-w-[12rem]">
                                                  <div className="flex min-w-[4.8rem] flex-col rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-center">
                                                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                            {new Date(m.scheduled_start).toLocaleDateString("en-US", { month: "short" })}
                                                       </span>
                                                       <span className="text-xl font-extrabold text-foreground">
                                                            {new Date(m.scheduled_start).toLocaleDateString("en-US", { day: "numeric" })}
                                                       </span>
                                                  </div>
                                                  <div className="w-10 h-10 bg-chart-2 text-white rounded-full flex items-center justify-center font-semibold">
                                                  <CalendarDays size={18} />
                                                  </div>
                                             </div>

                                             <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                                  <div className="min-w-0">
                                                       <p className="font-semibold text-foreground">{m.title}</p>
                                                       <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                            <span className="inline-flex items-center gap-1">
                                                                 <Clock3 className="size-3.5" />
                                                                 {new Date(m.scheduled_start).toLocaleString(undefined, {
                                                                      weekday: "short",
                                                                      month: "short",
                                                                      day: "numeric",
                                                                      hour: "2-digit",
                                                                      minute: "2-digit",
                                                                 })}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1">
                                                                 <Radio className="size-3.5" />
                                                                 Host: {m.host_email}
                                                            </span>
                                                       </div>
                                                  </div>

                                                  <div className="flex flex-wrap items-center gap-3">
                                                       <p className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusClassName}`}>
                                                            {m.status}
                                                       </p>

                                                       <Link href={meetingHref} className="rounded-xl bg-chart-2 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                                                            {meetingLabel}
                                                       </Link>
                                                  </div>
                                             </div>
                                        </>
                                   )
                              })()}
                         </div>
                    ))}
               </div>
          </div>
     )
}


export default MeetingsList
