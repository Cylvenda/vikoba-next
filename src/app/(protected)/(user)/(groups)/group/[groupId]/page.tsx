"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  TrendingUp,
  PiggyBank,
  FileText,
  ShieldCheck,
  Activity,
  Calendar,
} from "lucide-react";
import GroupHeader from "@/components/group-layout/GroupHeader";
import MeetingInProgress from "@/components/group-layout/MeetingInProgress";
import MeetingsList from "@/components/group-layout/MeetingsList";
import { useGroupStore } from "@/store/group/groupUser.store";
import { useMeetingStore } from "@/store/meeting/meeting.store";
import { useFinanceStore } from "@/store/finance/finance.store";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { financeServices } from "@/api/services/finance.service";
import type { Loan, Fine } from "@/api/services/finance.service";
import { formatTzs } from "@/lib/vikoba-finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useLanguage } from "@/components/language/language-provider";

export default function GroupPage() {
  const { selectedGroup, selectedGroupMembers } = useGroupStore();
  const { meetings, fetchMeetings } = useMeetingStore();
  const {
    snapshot,
    isLoading: isFinanceLoading,
    fetchSnapshot,
  } = useFinanceStore();
  const { user } = useAuthUserStore();
  const { language } = useLanguage();
  const tt = (en: string, sw: string) => language === "sw" ? sw : en;
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [myFines, setMyFines] = useState<Fine[]>([]);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const currentMembership = selectedGroupMembers.find(
    (member) => member.user_id === user?.uuid,
  );

  useEffect(() => {
    void fetchMeetings();
    if (selectedGroup?.id) {
      void fetchSnapshot(selectedGroup.id);
    }
  }, [fetchMeetings, fetchSnapshot, selectedGroup?.id]);

  useEffect(() => {
    if (!selectedGroup?.id || !user?.uuid) return;

    void financeServices.getLoans(selectedGroup.id).then((res) => {
      const my = res.data.filter(
        (loan) =>
          ["ACTIVE", "OVERDUE"].includes(loan.status) &&
          (loan.borrower_user_id === user?.uuid ||
            loan.borrower === currentMembership?.membership_id),
      );
      setMyLoans(my);
    });

    void financeServices.getFines(selectedGroup.id).then((res) => {
      const my = res.data.filter(
        (fine) =>
          fine.status === "UNPAID" &&
          (fine.member_user_id === user?.uuid ||
            fine.member === currentMembership?.membership_id),
      );
      setMyFines(my);
    });
  }, [selectedGroup?.id, user?.uuid, currentMembership?.membership_id]);

  const totalCapital = snapshot
    ? Number(snapshot.availableCash) +
      Number(snapshot.activeLoanBook) +
      Number(snapshot.unpaidFines)
    : 0;
  const totalSaved = snapshot ? Number(snapshot.totalSavings) : 0;
  const groupWallet = snapshot?.groupWallet;
  const myTotalLoans = myLoans.reduce(
    (sum, loan) => sum + Number(loan.remaining_balance || loan.balance || 0),
    0,
  );
  const myTotalFines = myFines.reduce(
    (sum, fine) => sum + Number(fine.balance || fine.amount || 0),
    0,
  );

  const donutData = snapshot
    ? [
        {
          name: tt("Available Cash", "Fedha Inayopatikana"),
          value: Number(snapshot.availableCash),
          color: "var(--chart-1)",
        },
        {
          name: tt("Active Loans", "Mikopo Inayoendelea"),
          value: Number(snapshot.activeLoanBook),
          color: "var(--chart-3)",
        },
        {
          name: tt("Unpaid Fines", "Faini Zisizolipwa"),
          value: Number(snapshot.unpaidFines),
          color: "var(--destructive)",
        },
      ].filter((d) => d.value > 0)
    : [];

  const trendData = useMemo(() => {
    if (!snapshot?.recentActivity) return [];
    const map = new Map<
      string,
      { name: string; amount: number; title: string; actor: string }
    >();
    snapshot.recentActivity.forEach((item) => {
      const dateKey = new Date(item.happenedAt).toISOString().slice(0, 10);
      const label = new Date(item.happenedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const existing = map.get(dateKey);
      const entry = {
        name: label,
        amount: Number(item.amount),
        title: item.title || item.type,
        actor: item.actor || (language === "sw" ? "Mfumo" : "System"),
      };
      if (existing) {
        existing.amount += entry.amount;
      } else {
        map.set(dateKey, entry);
      }
    });
    return Array.from(map.values()).reverse();
  }, [language, snapshot]);
  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="text-center text-muted-foreground animate-pulse font-medium">
          {" "}
          {tt("Loading group operations...", "Inapakia shughuli za kikundi...")}
        </div>
      </div>
    );
  }

  const groupMeetings = meetings.filter(
    (meeting) => meeting.group === selectedGroup.id,
  );
  const pendingVerificationCount = selectedGroupMembers.filter(
    (member) => !member.is_verified,
  ).length;
  const activeMembersCount = selectedGroupMembers.filter(
    (member) => member.is_active,
  ).length;
  const leadershipCount = selectedGroupMembers.filter((member) =>
    ["CHAIRPERSON", "SECRETARY", "TREASURER"].includes(member.role),
  ).length;
  const nextScheduledMeeting = groupMeetings
    .filter((meeting) => meeting.status === "scheduled")
    .sort(
      (left, right) =>
        new Date(left.scheduled_start).getTime() -
        new Date(right.scheduled_start).getTime(),
    )[0];

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-screen-3xl space-y-6">
        <GroupHeader />

        {/* Dynamic Meeting Banner if in progress */}
        <MeetingInProgress />

        {/* Premium Dashboard Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <Card className="relative overflow-hidden border border-border/80 bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {tt("Available for Lending", "Inayopatikana kwa Mikopo")}
                  </p>
                  <h3 className="text-2xl font-extrabold tracking-tight text-chart-3">
                    {snapshot
                      ? formatTzs(
                          groupWallet?.balance ?? snapshot.availableCash,
                        )
                      : tt("Loading...", "Inapakia...")}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10 text-primary shadow-inner">
                  <span className="text-[10px] font-extrabold tracking-tight" aria-label="Tanzanian shillings">
                    TZS
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {tt("Group wallet balance after disbursements", "Salio la mkoba wa kikundi baada ya kutoa mikopo")}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-border/80 bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {tt("Total Savings", "Jumla ya Akiba")}
                  </p>
                  <h3 className="text-2xl font-extrabold tracking-tight text-chart-3">
                    {snapshot ? formatTzs(totalSaved) : tt("Loading...", "Inapakia...")}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10 text-primary shadow-inner">
                  <PiggyBank className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {tt("verified member contributions", "michango ya wanachama iliyothibitishwa")}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-border/80 bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {tt("My Active Loans", "Mikopo Yangu Inayoendelea")}
                  </p>
                  <h3 className="text-2xl font-extrabold tracking-tight text-chart-3">
                    {myLoans.length > 0
                      ? formatTzs(myTotalLoans)
                      : isFinanceLoading
                        ? tt("Loading...", "Inapakia...")
                        : tt("None", "Hakuna")}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3 shadow-inner">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {tt("Your outstanding loan balance", "Salio lako la mikopo ambalo halijalipwa")}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-border/80 bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {tt("My Unpaid Fines", "Faini Zangu Zisizolipwa")}
                  </p>
                  <h3 className="text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
                    {myFines.length > 0
                      ? formatTzs(myTotalFines)
                      : isFinanceLoading
                        ? tt("Loading...", "Inapakia...")
                        : tt("None", "Hakuna")}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 shadow-inner">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {tt("Your outstanding penalties", "Adhabu zako ambazo hazijalipwa")}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Visual Analytics Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recharts Area Chart: Velocity Trend */}
          <Card className="lg:col-span-2 border border-border/80 bg-card/50 shadow-sm backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {tt("Ledger Transaction Flow", "Mtiririko wa Miamala ya Rejista")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {tt("Financial velocity over recent transactions", "Mwenendo wa fedha katika miamala ya hivi karibuni")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-chart-1/10 px-2.5 py-1 text-xs font-bold text-chart-1">
                  <Activity className="h-3.5 w-3.5" />
                  {tt("Realtime Engine", "Mfumo wa Moja kwa Moja")}
                </div>
              </div>

              <div className="h-[280px] w-full">
                {isMounted && snapshot && trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorAmount"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--chart-3)"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--chart-3)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-xl border border-border/80 bg-popover/95 p-3.5 shadow-md backdrop-blur-md text-xs space-y-1">
                                <p className="font-bold text-foreground">
                                  {data.title}
                                </p>
                                <p className="text-[10px] text-chart-1 font-semibold">
                                  {data.actor}
                                </p>
                                <p className="text-muted-foreground">
                                  {data.name}
                                </p>
                                <p className="font-extrabold text-chart-3">
                                  {formatTzs(data.amount)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="var(--chart-3)"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    {isFinanceLoading
                      ? tt("Recalculating ledger trends...", "Inakokotoa upya mwenendo wa rejista...")
                      : tt("No recent activity logged to generate charts.", "Hakuna shughuli za karibuni za kutengeneza chati.")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recharts Donut Chart: Capital Allocation */}
          <Card className="border border-border/80 bg-card/50 shadow-sm backdrop-blur-md">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="mb-4">
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  {tt("Capital Breakdown", "Mgawanyo wa Mtaji")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {tt("Proportional allocation of group assets", "Mgawanyo wa mali za kikundi kwa uwiano")}
                </p>
              </div>

              <div className="relative flex-1 min-h-[220px] flex items-center justify-center">
                {isMounted && snapshot && totalCapital > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatTzs(Number(value))}
                          contentStyle={{
                            borderRadius: "12px",
                            borderColor: "rgba(255,255,255,0.1)",
                            backgroundColor: "rgba(15,15,20,0.95)",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center justify-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {tt("Total Assets", "Jumla ya Mali")}
                      </p>
                      <p className="text-lg font-extrabold text-foreground mt-1">
                        {formatTzs(totalCapital)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {isFinanceLoading
                      ? tt("Synthesizing asset ledger...", "Inakusanya rejista ya mali...")
                      : tt("No positive assets reported.", "Hakuna mali chanya iliyoripotiwa.")}
                  </div>
                )}
              </div>

              {/* Legends Custom */}
              <div className="space-y-2 mt-4 pt-4 border-t border-border/80">
                {donutData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-bold text-foreground">
                      {totalCapital > 0
                        ? `${((item.value / totalCapital) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Intermediate Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border border-border/80 bg-background p-4">
            <CardContent className="p-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {tt("Expected Interest Return", "Mapato ya Riba Yanayotarajiwa")}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-foreground">
                {snapshot ? formatTzs(snapshot.expectedInterestReturn) : "..."}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border/80 bg-background p-4">
            <CardContent className="p-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {tt("Monthly Collections", "Makusanyo ya Mwezi")}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-foreground">
                {snapshot ? formatTzs(snapshot.monthlyCollections) : "..."}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Details & Logs Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
          {/* Meetings Section */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {tt("Meeting Schedule", "Ratiba ya Vikao")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {tt("Schedule of current, upcoming and completed VICOBA meetings", "Ratiba ya vikao vya VICOBA vinavyoendelea, vijavyo, na vilivyokamilika")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
               <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-full h-9 px-3 sm:h-8 sm:px-3"
                >
                  <Link href={`/group/${selectedGroup.id}/meetings`}>
                    {tt("Read more", "Soma zaidi")}
                  </Link>
                </Button>
              </div>
            </div>
            <MeetingsList />
          </div>

          {/* Timelines and Snapshots */}
          <div className="space-y-6">
            {/* Governance Ready Widget */}
            <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  {tt("Governance Setup", "Mpangilio wa Uongozi")}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {tt("Leadership Seats", "Nafasi za Uongozi")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tt("Chairperson, Secretary, Treasurer", "Mwenyekiti, Katibu, Mweka Hazina")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-foreground">
                      {leadershipCount}/3
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary mt-1">
                      {tt("Active", "Zimejazwa")}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {tt("Group Members", "Wanachama wa Kikundi")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tt("Total active group members", "Jumla ya wanachama hai wa kikundi")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-foreground">
                      {activeMembersCount}
                    </p>
                    {pendingVerificationCount > 0 ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600 mt-1">
                        {pendingVerificationCount} {tt("Pending", "Wanasubiri")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-chart-1/10 px-2 py-0.5 text-[9px] font-bold text-chart-1 mt-1">
                        {tt("All Verified", "Wote Wamethibitishwa")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    {tt("Next Formal Meeting", "Kikao Rasmi Kijacho")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {nextScheduledMeeting
                      ? nextScheduledMeeting.title
                      : tt("No meeting scheduled yet", "Bado hakuna kikao kilichopangwa")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {nextScheduledMeeting
                      ? new Date(
                          nextScheduledMeeting.scheduled_start,
                        ).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : tt("Create a meeting schedule to synchronize operations.", "Tengeneza ratiba ya kikao ili kuratibu shughuli.")}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
