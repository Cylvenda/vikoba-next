"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import Link from "next/link";
import MeetingItem from "./MeetingItem";
import type { Meeting } from "@/store/meeting/meeting.types";
import { useLanguage } from "@/components/language/language-provider";

interface MeetingListProps {
     meetings: Meeting[];
}

const MeetingList: FC<MeetingListProps> = ({ meetings }) => {
     const { language } = useLanguage()
     const tt = (en: string, sw: string) => language === "sw" ? sw : en
     if (!meetings) {
          return (
               <div className="w-full rounded-2xl bg-card border border-border shadow-sm p-4 md:p-6">
                    <div className="animate-pulse space-y-3">
                         <div className="h-8 w-1/3 bg-muted rounded"></div>
                         <div className="h-20 bg-muted rounded"></div>
                         <div className="h-20 bg-muted rounded"></div>
                    </div>
               </div>
          )
     }

     return (
          <div className="w-full rounded-2xl bg-card border border-border shadow-sm p-4 md:p-6 flex flex-col h-full">
               <div className="flex justify-between items-center mb-6">
                    <div>
                         <h1 className="text-xl font-bold text-foreground">{tt("Today's Meetings", "Mikutano ya Leo")}</h1>
                         <p className="text-xs text-muted-foreground mt-1">
                              {new Date().toLocaleDateString(language === "sw" ? "sw-TZ" : "en-US", { weekday: 'long', day: "numeric", month: "long" })}
                         </p>
                    </div>

                    <Button asChild size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                         <Link href="/home/meetings" className="flex items-center gap-1.5">
                              <List size={16} /> <span className="hidden sm:inline">{tt("View All", "Tazama Yote")}</span>
                         </Link>
                    </Button>
               </div>

               <div className="space-y-3 flex-1">
                    {meetings.length === 0 ? (
                         <div className="py-12 text-center rounded-xl bg-muted/30 border border-dashed border-border flex flex-col justify-center items-center h-full">
                              <p className="text-sm font-medium text-foreground">{tt("No meetings today", "Hakuna mikutano leo")}</p>
                              <p className="text-xs text-muted-foreground mt-1">{tt("Enjoy your free time!", "Furahia muda wako!")}</p>
                         </div>
                    ) : (
                         meetings.map((meeting) => (
                              <MeetingItem key={meeting.id} meeting={meeting} />
                         ))
                    )}
               </div>
          </div>
     )
};

export default MeetingList;
