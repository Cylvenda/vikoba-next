"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Meeting } from "@/store/meeting/meeting.types";
import { useGroupStore } from "@/store/group/groupUser.store";
import { getMeetingDetailHref, getMeetingSessionHref } from "@/lib/meeting-routes";
import { Clock, Users } from "lucide-react";


interface MeetingItemProps {
     meeting: Meeting;
}

const MeetingItem: FC<MeetingItemProps> = ({ meeting }) => {
     const { groups } = useGroupStore()
     const statusClasses =
          meeting.status === "ongoing"
               ? "bg-green-500/10 text-green-600 border-green-500/20"
               : meeting.status === "ended"
                    ? "bg-red-500/10 text-red-600 border-red-500/20"
                    : meeting.status === "cancelled"
                         ? "bg-muted text-muted-foreground border-border"
                         : "bg-primary/10 text-primary border-primary/20";

     const startDate = new Date(meeting.scheduled_start)
     const joinLabel = meeting.status === "ongoing" ? "Join Session" : "Details"
     const meetingHref = meeting.status === "ongoing"
          ? getMeetingSessionHref(meeting.id, meeting.group)
          : getMeetingDetailHref(meeting.id, meeting.group)
     const groupName = groups.find((group) => group.id === meeting.group)?.name || "Unknown Group"

     const monthStr = startDate.toLocaleDateString("en-US", { month: "short" })
     const dayStr = startDate.toLocaleDateString("en-US", { day: "numeric" })
     const timeStr = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

     return (
          <div className="w-full p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
               <div className="flex items-center gap-4">
                    {/* Calendar Date Block */}
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/5 border border-primary/10 shrink-0">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{monthStr}</span>
                         <span className="text-xl font-bold text-foreground leading-none mt-0.5">{dayStr}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2">
                              <h1 className="font-semibold text-foreground text-base leading-none">{meeting.title}</h1>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${statusClasses}`}>{meeting.status}</span>
                         </div>
                         <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <div className="flex items-center gap-1.5">
                                   <Clock className="w-3.5 h-3.5" />
                                   <span>{timeStr}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                   <Users className="w-3.5 h-3.5" />
                                   <span className="truncate max-w-[120px] sm:max-w-xs">{groupName}</span>
                              </div>
                         </div>
                    </div>
               </div>

               <Button asChild variant={meeting.status === "ongoing" ? "default" : "outline"} size="sm" className="w-full sm:w-auto shrink-0">
                    <Link href={meetingHref}>{joinLabel}</Link>
               </Button>
          </div>
     );
};

export default MeetingItem;
