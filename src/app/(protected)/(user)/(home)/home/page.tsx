"use client";

import { useMemo, memo } from "react";
import GroupList from "@/components/dashboard/GroupList";
import MeetingList from "@/components/dashboard/MeetingList";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { useGroupStore } from "@/store/group/groupUser.store";
import { useMeetingStore } from "@/store/meeting/meeting.store";
import { CalendarDays, Users, BarChart3, HandCoins, Building2, TrendingUp, CircleDollarSign } from "lucide-react";

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
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-8">
      <div className="mx-auto w-full max-w-screen-3xl space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="w-8 h-8 text-chart-3" />
              My Workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              Welcome back to Community Hub, <span className="font-semibold text-foreground">{displayName}</span>
            </p>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Groups */}
          <div className="rounded-3xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-chart-4">Groups</span>
              <Users className="w-5 h-5 text-chart-4" />
            </div>
            <div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-extrabold text-foreground leading-none">{groups.length}</span>
                <span className="text-sm font-medium text-muted-foreground mb-1">active</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex justify-between border-b border-border/50 pb-1"><span>Pending</span><span className="font-medium text-foreground">{invitations.length}</span></div>
                <div className="flex justify-between border-b border-border/50 pb-1"><span>Closed</span><span className="font-medium text-foreground">0</span></div>
              </div>
            </div>
          </div>

          {/* Shares Placeholder */}
          <div className="rounded-3xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-green-500">Shares (Hisa)</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">125,000</div>
              <p className="text-xs font-medium text-muted-foreground mt-2">Total shares acquired (TZS)</p>
              <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                Placeholder Data
              </div>
            </div>
          </div>

          {/* Loans Placeholder */}
          <div className="rounded-3xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-chart-2">Active Loans</span>
              <HandCoins className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground tracking-tight">165,000</div>
              <p className="text-xs font-medium text-muted-foreground mt-2">Current outstanding balance (TZS)</p>
              <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-chart-2/10 px-2 py-1 text-[10px] font-bold text-chart-2">
                Placeholder Data
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div className="rounded-3xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-md flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-chart-3">Meetings</span>
              <CalendarDays className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-foreground leading-none">{meetings.length}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-2">Total meetings scheduled</p>
            </div>
          </div>

        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-[2rem] border border-border/60 bg-card/40 shadow-sm backdrop-blur-sm p-6 md:p-8">
              <GroupList groups={groups} limit={5} hideSearch={false} />
            </div>
          </div>
          
          <div className="xl:col-span-1 space-y-6">
            <div className="rounded-[2rem] border border-border/60 bg-card/40 shadow-sm backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-chart-3 animate-pulse" />
                <h3 className="font-bold tracking-tight text-foreground">Today&apos;s Sessions</h3>
              </div>
              {todaysMeetings.length > 0 ? (
                <MeetingList meetings={todaysMeetings.slice(0, 5)} />
              ) : (
                <div className="py-12 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No meetings scheduled today</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default memo(Page);
