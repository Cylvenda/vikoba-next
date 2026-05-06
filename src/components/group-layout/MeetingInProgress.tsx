import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "../ui/button";
import { useMeetingStore } from "@/store/meeting/meeting.store";
import { useGroupStore } from "@/store/group/groupUser.store";

export default function MeetingInProgress() {
     const { meetings } = useMeetingStore()
     const { selectedGroup } = useGroupStore()
     const activeMeeting = meetings.find(
          (meeting) => meeting.group === selectedGroup?.id && meeting.status === "ongoing"
     )

     if (!activeMeeting) {
          return (
               <div className="bg-chart-2 border border-chart-4 rounded-2xl shadow p-6 flex flex-col md:flex-row justify-between items-center text-white">
                    <div>
                         <p className="font-light">Live Now</p>
                         <h2 className="text-2xl font-bold">No meeting is currently live</h2>
                         <p className="font-light">Start a meeting from this group when everyone is ready.</p>
                    </div>
               </div>
          )
     }

     return (
          <div className="bg-chart-2 border border-chart-4 rounded-2xl shadow p-6 flex flex-col md:flex-row justify-between items-center text-white">
               <div>
                    <p className="font-light">Live Now</p>
                    <h2 className="text-2xl font-bold">{activeMeeting.title}</h2>
                    <p className="font-light" >Host: {activeMeeting.host_email}</p>
               </div>
               <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <Button asChild variant={"outline"} className="text-black" > 
                         <Link href={`/meeting/${activeMeeting.id}/session`}><Play /> Join Now</Link>
                    </Button>
               </div>
          </div>
     )
}
