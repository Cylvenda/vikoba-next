"use client"

import { useEffect } from "react"
import { BadgeCheck, CalendarClock, CircleAlert } from "lucide-react"
import GroupHeader from "@/components/group-layout/GroupHeader"
import MeetingInProgress from "@/components/group-layout/MeetingInProgress"
import MeetingsList from "@/components/group-layout/MeetingsList"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { useFinanceStore } from "@/store/finance/finance.store"
import { formatTzs, buildMetricsFromSnapshot } from "@/lib/vikoba-finance"

export default function GroupPage() {
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const { meetings, fetchMeetings } = useMeetingStore()
  const { snapshot, isLoading: isFinanceLoading, fetchSnapshot } = useFinanceStore()

  useEffect(() => {
    void fetchMeetings()
    if (selectedGroup?.id) {
      void fetchSnapshot(selectedGroup.id)
    }
  }, [fetchMeetings, fetchSnapshot, selectedGroup?.id])

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

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-3xl space-y-5">
        <GroupHeader />

        {/* Finance Section */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Finance Snapshot</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Live Double-Entry Ledger Data</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                These values are synchronized in real-time with the backend accounting engine.
              </p>
            </div>
            <div className="rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-muted-foreground">
              Available cash (Wallet Balance): <span className="text-foreground">{snapshot ? formatTzs(snapshot.availableCash) : "Loading..."}</span>
            </div>
          </div>

          {isFinanceLoading || !snapshot ? (
            <div className="mt-6 py-12 text-center text-sm font-medium text-muted-foreground animate-pulse">
              Synchronizing with ledger engine...
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {buildMetricsFromSnapshot(snapshot).map((metric) => {
                  return (
                    <div key={metric.label} className="rounded-lg border border-border bg-background p-5 shadow-sm">
                      <div className={`inline-flex rounded-md bg-secondary text-secondary-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]`}>
                        {metric.label}
                      </div>
                      <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">{formatTzs(metric.amount)}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Expected Interest Return</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(snapshot.expectedInterestReturn)}</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Monthly Collections</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(snapshot.monthlyCollections)}</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Cash Available For Lending</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(snapshot.availableCash)}</p>
                </div>
              </div>
            </>
          )}
        </section>

        <MeetingInProgress />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Meeting Schedule</h2>
              <p className="text-sm font-medium text-muted-foreground">Upcoming and recent group sessions</p>
            </div>
            <MeetingsList />
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Governance Snapshot</h3>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Leadership Seats Filled</p>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">{leadershipCount}/3</p>
                  <p className="text-xs text-muted-foreground">Chairperson, Secretary, and Treasurer assignments in place</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
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

            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground">Recent Finance Activity</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                True ledger movements and transactions from the backend system.
              </p>
              <div className="mt-5 space-y-3">
                {!snapshot ? (
                  <div className="text-xs text-muted-foreground">Loading activity...</div>
                ) : snapshot.recentActivity.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No recent activity found in ledger.</div>
                ) : (
                  snapshot.recentActivity.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border bg-background p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{item.title || item.type}</p>
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
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
