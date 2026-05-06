"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { Meeting } from "@/store/meeting/meeting.types";
import { useGroupStore } from "@/store/group/groupUser.store";


interface MeetingItemProps {
     meeting: Meeting;
}

const MeetingItem: FC<MeetingItemProps> = ({ meeting }) => {
     const { groups } = useGroupStore()
     const statusClasses =
          meeting.status === "ongoing"
               ? "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400"
               : meeting.status === "ended"
                    ? "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-400"
                    : meeting.status === "cancelled"
                         ? "bg-muted text-muted-foreground"
                         : "bg-chart-2/20 text-chart-5";

     const startDate = new Date(meeting.scheduled_start)
     const joinLabel = meeting.status === "ongoing" ? "Join Session" : "Details"
     const meetingHref = meeting.status === "ongoing" ? `/meeting/${meeting.id}/session` : `/meeting/${meeting.id}`
     const groupName = groups.find((group) => group.id === meeting.group)?.name || "Unknown Group"

     return (
          <div className="w-full p-2 rounded-2xl flex justify-between items-center border border-chart-3 hover:shadow-md hover:scale-[1.01] transition cursor-pointer">
               <div className="flex items-center gap-4">
                    <div className="text-center">
                         <p className="text-sm font-medium">{startDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                         <p className="text-xs text-muted-foreground">{startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                    </div>

                    <Separator orientation="vertical" className="h-10" />

                    <div>
                         <h1 className="font-semibold text-lg">{meeting.title}</h1>
                         <p className="text-sm text-muted-foreground"> <span className="font-semibold" >Group Name: </span> {groupName}</p>
                    </div>
               </div>

               <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusClasses}`}>{meeting.status}</span>
                    <Button asChild className="bg-chart-3 hover:opacity-90">
                         <Link href={meetingHref}>{joinLabel}</Link>
                    </Button>
               </div>
          </div>
     );
};

export default MeetingItem;
