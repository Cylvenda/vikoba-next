import Link from "next/link";
import { Separator } from "../ui/separator";
import { CalendarDays } from "lucide-react";
import { useGroupStore } from "@/store/group/groupUser.store";
import { useMeetingStore } from "@/store/meeting/meeting.store";



const MeetingsList = () => {
     const { selectedGroup } = useGroupStore()
     const { meetings } = useMeetingStore()
     const groupMeetings = meetings.filter((meeting) => meeting.group === selectedGroup?.id)

     return (
          <div className="rounded-2xl bg-card p-4 shadow">
               <h3 className="text-lg font-bold mb-4">Meetings</h3>
               <div className="divide-y">
                    {groupMeetings.length === 0 && (
                         <p className="py-3 text-sm text-muted-foreground">No meetings have been scheduled for this group yet.</p>
                    )}
                    {groupMeetings.map((m) => (
                         <div key={m.id} className="flex items-center gap-6 py-3">
                              {(() => {
                                   const meetingHref = m.status === "ongoing" ? `/meeting/${m.id}/session` : `/meeting/${m.id}`
                                   const meetingLabel = m.status === "ongoing" ? "Join Session" : "Open Details"

                                   return (
                                        <>
                                             {/* DATE */}
                                             <div className="text-center text-sm">
                                                  {new Date(m.scheduled_start).toLocaleDateString("en-US", {
                                                       day: "numeric",
                                                       month: "short",
                                                       year: "numeric",
                                                  })}
                                             </div>



                                             {/* AVATAR */}
                                             <div className="w-10 h-10 bg-chart-2 text-white rounded-full flex items-center justify-center font-semibold">
                                                  <CalendarDays size={18} />
                                             </div>

                                             <Separator orientation="vertical" className="h-10" />
                                             {/* CONTENT */}
                                             <div className="flex justify-between items-center w-full">
                                                  <div>
                                                       <p className="font-medium">{m.title}</p>
                                                       <p className="font-medium">
                                                            {new Date(m.scheduled_start).toLocaleDateString("en-US", {
                                                                 day: "numeric",
                                                                 month: "short",
                                                                 year: "numeric",
                                                            })}
                                                       </p>

                                                  </div>

                                                  <div className="flex flex-row items-center justify-center gap-5">
                                                       <p
                                                            className={`px-2 py-1 rounded-full text-xs text-center ${m.status === "ongoing"
                                                                 ? "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400"
                                                                 : m.status === "ended"
                                                                      ? "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400"
                                                                      : m.status === "cancelled"
                                                                           ? "bg-muted text-muted-foreground"
                                                                           : "bg-chart-2/20 text-chart-5"
                                                                 }`}
                                                       >
                                                            {m.status}
                                                       </p>

                                                       <Link href={meetingHref} className="rounded-xl bg-chart-2 px-3 py-1 text-white transition hover:opacity-90">
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
