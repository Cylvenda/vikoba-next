"use client";

import { FC } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import MeetingItem from "./MeetingItem";
import type { Meeting } from "@/store/meeting/meeting.types";

interface MeetingListProps {
     meetings: Meeting[];
}

const MeetingList: FC<MeetingListProps> = ({ meetings }) => {
     if (!meetings) {
          return (
               <Card className="w-full rounded-2xl bg-card p-3 shadow-sm md:w-[80%] md:p-6">
                    <div className="animate-pulse space-y-3">
                         <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                         <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                         <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
               </Card>
          )
     }

     return (
          <Card className="w-full rounded-2xl bg-card p-3 shadow-sm md:w-[80%] md:p-6">
               <div className="flex justify-between items-center mb-4">
                    <div>
                         <h1 className="text-2xl font-bold px-2">{"Today's Meetings"}</h1>
                         <p className="px-2 text-sm text-muted-foreground">
                              {new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                         </p>
                    </div>

                    <Button size="lg" variant="link" className="flex items-center gap-2">
                         <List size={18} /> View All
                    </Button>
               </div>

               <div className="space-y-3">
                    {meetings.length === 0 ? (
                         <div className="px-2 py-8 text-center">
                              <p className="text-sm text-muted-foreground">No meetings scheduled for today.</p>
                              <p className="text-xs text-muted-foreground mt-1">Check back later or schedule a new meeting.</p>
                         </div>
                    ) : (
                         meetings.map((meeting) => (
                              <MeetingItem key={meeting.id} meeting={meeting} />
                         ))
                    )}
               </div>
          </Card>
     )
};

export default MeetingList;
