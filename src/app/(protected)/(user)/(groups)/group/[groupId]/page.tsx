"use client"

import Link from "next/link"
import { useEffect, useMemo } from "react"
import { PiggyBank, WalletCards, FileText, Users, BadgeCheck, CircleAlert, CalendarClock, ArrowRight } from "lucide-react"
import GroupHeader from "@/components/group-layout/GroupHeader"
import MeetingInProgress from "@/components/group-layout/MeetingInProgress"
import MeetingsList from "@/components/group-layout/MeetingsList"
import OverviewCards from "@/components/group-layout/OverviewCards"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { buildVikobaFinanceSnapshot, formatTzs } from "@/lib/vikoba-finance"

export default function GroupPage() {
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const { meetings, fetchMeetings } = useMeetingStore()
  const groupId = selectedGroup?.id ?? ""

  useEffect(() => {
    void fetchMeetings()
  }, [fetchMeetings])

  const quickLinks = useMemo(
    () => [
      {
        title: "Savings Desk",
        description: "Track member savings contributions and prepare contribution workflows.",
        href: `/group/${groupId}/savings`,
        icon: PiggyBank,
        accent: "text-green-600",
        bg: "bg-green-500/10",
      },
      {
        title: "Loans Desk",
        description: "Review borrowing activity, loan requests, and repayment follow-up.",
        href: `/group/${groupId}/loans`,
        icon: WalletCards,
        accent: "text-chart-2",
        bg: "bg-chart-2/10",
      },
      {
        title: "Fines Ledger",
        description: "Monitor penalties, missed obligations, and outstanding member fines.",
        href: `/group/${groupId}/fines`,
        icon: FileText,
        accent: "text-orange-600",
        bg: "bg-orange-500/10",
      },
      {
        title: "Member Register",
        description: "Verify members, assign leadership roles, and keep the roster healthy.",
        href: `/group/${groupId}/members`,
        icon: Users,
        accent: "text-chart-4",
        bg: "bg-chart-4/10",
      },
    ],
    [groupId]
  )

  // Data is already fetched by the layout
  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="text-center text-muted-foreground animate-pulse font-medium"> Loading group operations...</div>
      </div>
    )
  }

  const groupMeetings = meetings.filter((meeting) => meeting.group === selectedGroup.id)
  const pendingVerificationCount = selectedGroupMembers.filter((member) => !member.is_verified).length
  const activeMembersCount = selectedGroupMembers.filter((member) => member.is_active).length
  const leadershipCount = selectedGroupMembers.filter((member) =>
    ["CHAIRPERSON", "SECRETARY", "TREASURER"].includes(member.role)
  ).length
  const nextScheduledMeeting = groupMeetings
    .filter((meeting) => meeting.status === "scheduled")
    .sort((left, right) => new Date(left.scheduled_start).getTime() - new Date(right.scheduled_start).getTime())[0]
  const financeSnapshot = buildVikobaFinanceSnapshot(selectedGroup, selectedGroupMembers)

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-3xl space-y-8">
        <GroupHeader />

        <section className="rounded-[2rem] border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-chart-3">VICOBA Dashboard</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
                Manage group savings discipline, leadership readiness, and meeting momentum in one place.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                This dashboard gives your group a shared operational view before deeper savings, loans, fines, and meeting actions are completed inside their dedicated workspaces.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-md">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BadgeCheck className="size-4 text-chart-3" />
                  Member Readiness
                </div>
                <p className="mt-2 text-2xl font-extrabold text-foreground">{activeMembersCount}</p>
                <p className="text-xs text-muted-foreground">active members currently cleared to participate</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CircleAlert className="size-4 text-orange-500" />
                  Pending Verification
                </div>
                <p className="mt-2 text-2xl font-extrabold text-foreground">{pendingVerificationCount}</p>
                <p className="text-xs text-muted-foreground">members still waiting for verification or onboarding follow-up</p>
              </div>
            </div>
          </div>
        </section>

        {/* <OverviewCards /> */}

        <section className="rounded-[2rem] border border-border/80 bg-card/55 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-chart-2">Finance Snapshot</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Frontend VICOBA finance preview</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                These values are local planning data for the dashboard now, and can be replaced by backend finance endpoints when you wire them in.
              </p>
            </div>
            <div className="rounded-full border border-border/60 bg-background/70 px-4 py-2 text-xs font-semibold text-muted-foreground">
              Available cash preview: <span className="text-foreground">{formatTzs(financeSnapshot.availableCash)}</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {financeSnapshot.metrics.map((metric) => {
              const toneClassName =
                metric.tone === "green"
                  ? "text-green-600 bg-green-500/10"
                  : metric.tone === "amber"
                    ? "text-amber-600 bg-amber-500/10"
                    : metric.tone === "red"
                      ? "text-red-600 bg-red-500/10"
                      : "text-chart-2 bg-chart-2/10"

              return (
                <div key={metric.label} className="rounded-3xl border border-border/70 bg-background/75 p-5 shadow-sm">
                  <div className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${toneClassName}`}>
                    {metric.label}
                  </div>
                  <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">{formatTzs(metric.amount)}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Expected Interest Return</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(financeSnapshot.expectedInterestReturn)}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Monthly Collections</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(financeSnapshot.monthlyCollections)}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Cash Available For Lending</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(financeSnapshot.availableCash)}</p>
            </div>
          </div>
        </section>

        <MeetingInProgress />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[2rem] border border-border/60 bg-card/40 p-6 shadow-sm backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Meeting Schedule</h2>
              <p className="text-sm font-medium text-muted-foreground">Upcoming and recent group sessions</p>
            </div>
            <MeetingsList />
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-border/60 bg-card/50 p-6 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-5 text-chart-4" />
                <h3 className="text-lg font-bold text-foreground">Governance Snapshot</h3>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Leadership Seats Filled</p>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">{leadershipCount}/3</p>
                  <p className="text-xs text-muted-foreground">Chairperson, Secretary, and Treasurer assignments in place</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Next Formal Meeting</p>
                  <p className="mt-2 text-base font-bold text-foreground">
                    {nextScheduledMeeting ? nextScheduledMeeting.title : "No meeting scheduled yet"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {nextScheduledMeeting
                      ? new Date(nextScheduledMeeting.scheduled_start).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Plan your next contribution or review meeting to keep the cycle active."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/60 bg-card/50 p-6 shadow-sm backdrop-blur-sm">
              <h3 className="text-lg font-bold text-foreground">Recent Finance Activity</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Preview ledger items to guide your backend transaction and finance APIs.
              </p>
              <div className="mt-5 space-y-3">
                {financeSnapshot.recentActivity.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.actor} • {new Date(item.happenedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatTzs(item.amount)}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          {item.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
