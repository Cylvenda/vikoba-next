"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { useGroupStore } from "@/store/group/groupUser.store";
import { useMeetingStore } from "@/store/meeting/meeting.store";
import { financeServices } from "@/api/services/finance.service";
import axiosInstance from "@/api/axios";
import { formatTzs } from "@/lib/vikoba-finance";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CalendarDays,
  Users,
  Building2,
  PiggyBank,
  HandCoins,
  FileText,
  Activity,
  Plus,
  ArrowRight,
  Sparkles,
  Lock,
  Globe
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

const Page = () => {
  const router = useRouter();
  const { user } = useAuthUserStore();
  const { groups, invitations, fetchGroups, fetchMyInvitations, createGroup, joinGroupByCode, setSelectedGroup } = useGroupStore();
  const { meetings, fetchMeetings } = useMeetingStore();

  const [isMounted, setIsMounted] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consolidated Financial States
  const [financialData, setFinancialData] = useState({
    totalSavings: 0,
    activeLoans: 0,
    unpaidFines: 0,
    consolidatedCash: 0,
    isLoading: true,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    void fetchGroups();
    void fetchMyInvitations();
    void fetchMeetings();
  }, [fetchGroups, fetchMyInvitations, fetchMeetings]);

  useEffect(() => {
    if (groups.length === 0) {
      setFinancialData({
        totalSavings: 0,
        activeLoans: 0,
        unpaidFines: 0,
        consolidatedCash: 0,
        isLoading: false,
      });
      return;
    }

    let isCancelled = false;
    const fetchAllData = async () => {
      setFinancialData((prev) => ({ ...prev, isLoading: true }));
      try {
        let aggregatedSavings = 0;
        let aggregatedLoans = 0;
        let aggregatedFines = 0;
        let aggregatedCash = 0;
        let combinedActivities: any[] = [];

        const displayName = `${user?.firstName || "Member"} ${user?.lastName || ""}`.trim();

        await Promise.all(
          groups.map(async (group) => {
            try {
              // 1. Fetch group snapshot
              const snapshotRes = await axiosInstance.get(`/finance/groups/${group.id}/snapshot/`);
              const snapshot = snapshotRes.data;
              aggregatedCash += Number(snapshot.availableCash);

              if (snapshot.recentActivity) {
                combinedActivities.push(
                  ...snapshot.recentActivity.map((act: any) => ({
                    ...act,
                    groupName: group.name,
                  }))
                );
              }

              // 2. Fetch user's own contributions in this group
              const contributionsRes = await financeServices.getContributions(group.id);
              const myVerifiedContributions = contributionsRes.data.filter(
                (c) =>
                  c.status === "VERIFIED" &&
                  (c.member_name === displayName || !user?.isAdmin)
              );
              aggregatedSavings += myVerifiedContributions.reduce((sum, c) => sum + Number(c.amount), 0);

              // 3. Fetch user's own loans in this group
              const loansRes = await financeServices.getLoans(group.id);
              const myActiveLoans = loansRes.data.filter(
                (loan) =>
                  ["ACTIVE", "OVERDUE"].includes(loan.status) &&
                  (loan.borrower_name === displayName || loan.borrower === user?.uuid)
              );
              aggregatedLoans += myActiveLoans.reduce((sum, loan) => sum + Number(loan.remaining_balance || loan.balance), 0);

              // 4. Fetch user's own fines in this group
              const finesRes = await financeServices.getFines(group.id);
              const myUnpaidFines = finesRes.data.filter(
                (fine) =>
                  fine.status === "UNPAID" &&
                  (fine.member_name === displayName || fine.member === user?.uuid)
              );
              aggregatedFines += myUnpaidFines.reduce((sum, fine) => sum + Number(fine.balance || fine.amount), 0);
            } catch (err) {
              console.error(`Failed to fetch finance data for group ${group.id}:`, err);
            }
          })
        );

        if (!isCancelled) {
          const sortedActivities = combinedActivities
            .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime())
            .slice(0, 5);

          setFinancialData({
            totalSavings: aggregatedSavings,
            activeLoans: aggregatedLoans,
            unpaidFines: aggregatedFines,
            consolidatedCash: aggregatedCash,
            isLoading: false,
          });
          setRecentActivities(sortedActivities);
        }
      } catch (err) {
        console.error("Failed to aggregate user financial overview:", err);
        if (!isCancelled) {
          setFinancialData((prev) => ({ ...prev, isLoading: false }));
        }
      }
    };

    void fetchAllData();

    return () => {
      isCancelled = true;
    };
  }, [groups, user]);

  const todaysMeetings = useMemo(() => {
    const today = new Date();
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.scheduled_start);
      return meetingDate.toDateString() === today.toDateString();
    });
  }, [meetings]);

  const displayName = `${user?.firstName || "Member"} ${user?.lastName || ""}`.trim();

  // Create Group Handler
  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await createGroup({
      name: name.trim(),
      description: description.trim(),
      is_private: isPrivate,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      setName("");
      setDescription("");
      setIsPrivate(true);
      setCreateOpen(false);
      return;
    }
    toast.error(result.message);
  };

  // Join Group Handler
  const handleJoinGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (joinCode.length !== 6) {
      toast.error("Join code must be 6 characters long.");
      return;
    }
    setIsSubmitting(true);
    const result = await joinGroupByCode(joinCode.toUpperCase());
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      setJoinCode("");
      setJoinOpen(false);
      void fetchGroups();
      return;
    }
    toast.error(result.message);
  };

  // Recharts Donut data for user personal financials
  const donutData = [
    { name: "My Savings", value: financialData.totalSavings, color: "var(--chart-1)" },
    { name: "My Active Loans", value: financialData.activeLoans, color: "var(--chart-3)" },
    { name: "My Unpaid Fines", value: financialData.unpaidFines, color: "var(--destructive)" }
  ].filter(d => d.value > 0);

  const totalUserLiabilities = financialData.activeLoans + financialData.unpaidFines;

  const trendData = recentActivities.map((act) => ({
    name: new Date(act.happenedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    amount: Number(act.amount),
    title: act.title || act.type,
    groupName: act.groupName
  })).reverse();

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 min-h-screen bg-background text-foreground space-y-8">
      <div className="mx-auto w-full max-w-screen-3xl space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="w-8 h-8 text-primary" />
              Community Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              Welcome back to your workspace, <span className="font-semibold text-foreground">{displayName}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setJoinOpen(true)} className="rounded-xl">
              Join Group
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="rounded-xl">
              <Plus className="mr-1.5 h-4 w-4" />
              New Group
            </Button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border border-border bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">My Savings (Hisa)</p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-chart-1">
                    {financialData.isLoading ? "Loading..." : formatTzs(financialData.totalSavings)}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1">
                  <PiggyBank className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Total verified savings across all groups</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">My Active Loans</p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-chart-3">
                    {financialData.isLoading ? "Loading..." : formatTzs(financialData.activeLoans)}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
                  <HandCoins className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Outstanding balance requiring repayments</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">My Unpaid Fines</p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-destructive">
                    {financialData.isLoading ? "Loading..." : formatTzs(financialData.unpaidFines)}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Penalties to clear to stay in good standing</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Active Workspaces</p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
                    {groups.length}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {invitations.length > 0 ? `${invitations.length} pending invitation(s)` : "Up to date"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Visual Analytics Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Consolidated Activity Chart */}
          <Card className="lg:col-span-2 border border-border/80 bg-card/50 shadow-sm backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">Workspace Ledger Activity</h3>
                  <p className="text-xs text-muted-foreground">Consolidated flow across all joined groups</p>
                </div>
                <div className="flex items-center gap-1 border border-border bg-background px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  Multi-Group Feed
                </div>
              </div>

              <div className="h-[260px] w-full">
                {isMounted && !financialData.isLoading && trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConsolidated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-xl border border-border/80 bg-popover/95 p-3.5 shadow-md backdrop-blur-md text-xs space-y-1">
                                <p className="font-bold text-foreground">{data.title}</p>
                                <p className="text-[10px] text-primary font-semibold">{data.groupName}</p>
                                <p className="text-muted-foreground">{data.name}</p>
                                <p className="font-extrabold text-foreground">{formatTzs(data.amount)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="amount" stroke="var(--chart-3)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConsolidated)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    {financialData.isLoading ? "Aggregating consolidated movements..." : "No recent activity logged across your workspaces."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Financial Health Donut Chart */}
          <Card className="border border-border/80 bg-card/50 shadow-sm backdrop-blur-md">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">My Position</h3>
                <p className="text-xs text-muted-foreground">Consolidated share savings vs liabilities</p>
              </div>

              <div className="relative flex-1 min-h-[200px] flex items-center justify-center">
                {isMounted && !financialData.isLoading && (financialData.totalSavings > 0 || totalUserLiabilities > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatTzs(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center justify-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Net Value</p>
                      <p className="text-base font-extrabold text-foreground mt-0.5">
                        {formatTzs(financialData.totalSavings - totalUserLiabilities)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {financialData.isLoading ? "Calculating net values..." : "Join a group to populate position charts."}
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-border">
                {donutData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{formatTzs(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Workspaces Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Premium Group Cards Grid */}
          <div className="xl:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">My Workspaces</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Access and manage your savings pools</p>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 py-16 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/45 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-foreground">Welcome to VICOBA Ecosystem</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  You are not yet a member of any savings group. Start by creating a group or join using a workspace short code.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setJoinOpen(true)} className="rounded-xl">
                    Enter Join Code
                  </Button>
                  <Button size="sm" onClick={() => setCreateOpen(true)} className="rounded-xl">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create Group
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {groups.map((group) => (
                  <Card key={group.id} className="border border-border/60 bg-card hover:border-primary/50 transition-all hover:shadow-md relative overflow-hidden group">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-bold text-base text-foreground leading-tight">{group.name}</h3>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                            {group.is_private ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                          {group.description || "No description provided."}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-foreground">{group.members_count || 0}</span> Members
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group);
                            router.push(`/group/${group.id}`);
                          }}
                          className="h-8 rounded-lg text-primary hover:text-primary hover:bg-primary/10 text-xs font-semibold gap-1"
                        >
                          Enter Workspace
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sessions & Invitation Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Invitations Alert Widget */}
            {invitations.length > 0 && (
              <Card className="border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-300">
                <CardContent className="p-4 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs">Pending Invitations ({invitations.length})</p>
                    <p className="text-[11px] mt-1 opacity-90 leading-normal">
                      You have pending invitations to join new workspaces.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/notifications")}
                      className="mt-2.5 h-7 text-[10px] rounded-lg border-amber-500/30 bg-background text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                    >
                      View Invitations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Meetings */}
            <Card className="border border-border/80 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                <h3 className="font-bold tracking-tight text-foreground text-sm">Today&apos;s Sessions</h3>
              </div>
              
              {todaysMeetings.length > 0 ? (
                <div className="space-y-3">
                  {todaysMeetings.slice(0, 3).map((meeting) => (
                    <div key={meeting.id} className="rounded-xl border border-border bg-background p-3.5 text-xs">
                      <p className="font-bold text-foreground">{meeting.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(meeting.scheduled_start).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/35 mb-2.5" />
                  <p className="text-xs font-semibold text-muted-foreground">No meetings scheduled today</p>
                </div>
              )}
            </Card>

            {/* Combined Recent Activity Timeline */}
            <Card className="border border-border/80 bg-card p-5 shadow-sm">
              <h3 className="font-bold text-foreground text-sm">General Activity Feed</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Verified financial events across joined groups</p>
              
              <div className="mt-4 space-y-3.5">
                {financialData.isLoading ? (
                  <div className="text-[11px] text-muted-foreground animate-pulse">Loading feed...</div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground text-center py-6">No workspace activity found.</div>
                ) : (
                  recentActivities.map((item) => (
                    <div key={item.id} className="relative pl-4 border-l border-l-border/70 space-y-1 text-xs">
                      <span className="absolute -left-[5.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="flex justify-between items-start gap-3">
                        <p className="font-bold text-foreground truncate">{item.title || item.type}</p>
                        <span className="font-bold text-foreground shrink-0">{formatTzs(item.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span className="font-semibold text-primary">{item.groupName}</span>
                        <span>
                          {new Date(item.happenedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

      </div>

      {/* CREATE GROUP DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl p-6 sm:p-8 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Create a New Group
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Define the parameters for your VICOBA workspace.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleCreateGroup}>
            <div className="space-y-1.5">
              <label htmlFor="group-name" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Group Name
              </label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Kilimanjaro Savings Circle"
                className="bg-muted/30 border-border/80"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="group-description" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary resize-none"
                placeholder="Describe the target capital or goals for this circle..."
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
              />
              Make Group Private
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmitting ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* JOIN GROUP DIALOG */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-md p-6 sm:p-8 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Join VICOBA Group
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Enter the 6-character short code to request member membership.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleJoinGroup}>
            <div className="space-y-1.5">
              <label htmlFor="join-code" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Join Code
              </label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g., A1B2C3"
                className="bg-muted/30 border-border/80 text-center tracking-widest uppercase text-lg font-bold"
                maxLength={6}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="ghost" onClick={() => setJoinOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmitting ? "Requesting..." : "Join Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default memo(Page);
