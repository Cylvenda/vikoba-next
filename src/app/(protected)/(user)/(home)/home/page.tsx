"use client";

import { useMemo, memo } from "react";
import GroupList from "@/components/dashboard/GroupList";
import MeetingList from "@/components/dashboard/MeetingList";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { useGroupStore } from "@/store/group/groupUser.store";
import { useMeetingStore } from "@/store/meeting/meeting.store";
import { CalendarDays, Users, BarChart3, HandCoins } from "lucide-react";

const Page = () => {
  const { user } = useAuthUserStore();
  const { groups, invitations } = useGroupStore();
  const { meetings } = useMeetingStore();

  const todaysMeetings = useMemo(() => {
    const today = new Date();
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.scheduled_start);
      return meetingDate.toDateString() === today.toDateString();
    });
  }, [meetings]);

  const displayName = `${user?.firstName || 'Member'} ${user?.lastName || ''}`.trim();

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-3xl space-y-8">
        
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            👋 Welcome again <span className="font-medium text-foreground">{displayName}</span>
          </p>
        </div>

        {/* Overview Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 border border-border rounded-lg bg-card shadow-sm divide-y md:divide-y-0 md:divide-x divide-border">
          
          {/* Section 1: Groups */}
          <div className="p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Groups</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            
            <div className="flex justify-between items-end mb-4">
              <span className="text-4xl font-bold text-foreground">{groups.length}</span>
              <div className="text-xs text-muted-foreground text-right space-y-1">
                <div className="flex justify-between gap-6"><span>Formal</span><span className="font-medium text-foreground">0</span></div>
                <div className="flex justify-between gap-6"><span>Informal</span><span className="font-medium text-foreground">{groups.length}</span></div>
              </div>
            </div>
            
            <hr className="border-border my-3" />
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
               <div className="flex justify-between"><span>Active</span><span className="font-medium text-foreground">{groups.length}</span></div>
               <div className="flex justify-between"><span>Pending</span><span className="font-medium text-foreground">{invitations.length}</span></div>
               <div className="flex justify-between"><span>Closed</span><span className="font-medium text-foreground">0</span></div>
               <div className="flex justify-between"><span>Banned</span><span className="font-medium text-foreground">0</span></div>
            </div>
          </div>

          {/* Section 2: Shares */}
          <div className="p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Shares</span>
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-auto">
              <div className="text-3xl font-bold text-foreground">125,000</div>
              <div className="text-xs text-muted-foreground mt-2">Total shares acquired</div>
            </div>
          </div>

          {/* Section 3: Loans */}
          <div className="p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Loans</span>
              <HandCoins className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-auto">
              <div className="text-3xl font-bold text-foreground">165,000</div>
              <div className="text-xs text-muted-foreground mt-2">Total loan borrowed</div>
            </div>
          </div>

          {/* Section 4: Attendance */}
          <div className="p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Attendance</span>
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-auto">
              <div className="text-3xl font-bold text-foreground">{meetings.length}</div>
              <div className="text-xs text-muted-foreground mt-2">Total meeting created</div>
            </div>
          </div>

        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Group List gets more space (2 columns on large screens) */}
          <div className="lg:col-span-2">
            <GroupList groups={groups} limit={5} hideSearch={false} />
          </div>
          
          {/* Meeting List gets 1 column */}
          <div className="lg:col-span-1">
            <MeetingList meetings={todaysMeetings.slice(0, 5)} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default memo(Page);
