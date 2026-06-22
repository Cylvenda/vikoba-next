"use client";

import { useEffect, useMemo, useState, memo } from "react";
import { useParams } from "next/navigation";
import {
  Settings, ShieldAlert, Coins, Percent, Landmark, Save, Info,
  Globe, Lock, Edit3, Hash, Users, Calendar, RefreshCw, Copy, Check,
  ToggleLeft, ToggleRight, FileText, AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUserStore } from "@/store/auth/userAuth.store";
import { useGroupStore } from "@/store/group/groupUser.store";

/* ─────────────────────────────────────────────────────────── helpers */
const SectionHeader = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-3 mb-6">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </div>
);

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground leading-normal">{hint}</p>}
  </div>
);

/* ─────────────────────────────────────────────────────────── main page */
const GroupSettingsPage = () => {
  const params = useParams<{ groupId: string }>();
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId;

  const { selectedGroup, selectedGroupMembers, fetchGroupById, updateGroup, loading } = useGroupStore();
  const user = useAuthUserStore((state) => state.user);

  /* form state — Identity */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");

  /* form state — Financial */
  const [loanLimit, setLoanLimit] = useState("1");
  const [lateFee, setLateFee] = useState("0");

  /* form state — Status */
  const [isActive, setIsActive] = useState(true);

  /* misc */
  const [isSaving, setIsSaving] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<"identity" | "financial" | "status" | "info">("identity");

  /* role check */
  const currentMembership = useMemo(
    () => selectedGroupMembers.find((m) => m.user_id === user?.uuid),
    [selectedGroupMembers, user]
  );
  const isChairperson = currentMembership?.role === "CHAIRPERSON";

  /* sync group data into form */
  useEffect(() => {
    if (groupId && (!selectedGroup || selectedGroup.id !== groupId)) {
      void fetchGroupById(groupId);
    }
  }, [groupId, selectedGroup, fetchGroupById]);

  useEffect(() => {
    if (!selectedGroup) return;
    setName(selectedGroup.name ?? "");
    setDescription(selectedGroup.description ?? "");
    setVisibility((selectedGroup.visibility as "PRIVATE" | "PUBLIC") ?? (selectedGroup.is_private ? "PRIVATE" : "PUBLIC"));
    setLoanLimit(String(selectedGroup.max_concurrent_loans ?? 1));
    setLateFee(String(selectedGroup.default_late_fee_amount ?? "0"));
    setIsActive(selectedGroup.is_active ?? true);
  }, [selectedGroup]);

  const copyJoinCode = async () => {
    if (!selectedGroup?.join_code) return;
    await navigator.clipboard.writeText(selectedGroup.join_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  /* ── save handlers ── */
  const handleSaveIdentity = async () => {
    if (!groupId || !name.trim()) {
      toast.error("Group name cannot be empty.");
      return;
    }
    setIsSaving(true);
    const result = await updateGroup(groupId, {
      name: name.trim(),
      description: description.trim(),
      visibility,
    });
    setIsSaving(false);
    if (result.success) toast.success("Group identity updated.");
    else toast.error(result.message);
  };

  const handleSaveFinancial = async () => {
    const parsedLimit = Number(loanLimit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      toast.error("Loan limit must be at least 1.");
      return;
    }
    setIsSaving(true);
    const result = await updateGroup(groupId!, {
      max_concurrent_loans: parsedLimit,
      default_late_fee_amount: lateFee.trim() || "0",
    });
    setIsSaving(false);
    if (result.success) toast.success("Financial rules updated.");
    else toast.error(result.message);
  };

  const handleToggleActive = async () => {
    const newValue = !isActive;
    setIsSaving(true);
    const result = await updateGroup(groupId!, { is_active: newValue });
    setIsSaving(false);
    if (result.success) {
      setIsActive(newValue);
      toast.success(newValue ? "Group activated." : "Group deactivated.");
    } else {
      toast.error(result.message);
    }
  };

  /* ── loading skeleton ── */
  if (!selectedGroup || loading) {
    return (
      <div className="w-full p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <Settings className="h-10 w-10 text-primary/40" />
          <p className="text-sm font-medium tracking-tight">Loading workspace settings…</p>
        </div>
      </div>
    );
  }

  const tabs: { key: typeof activeSection; label: string; icon: React.ElementType }[] = [
    { key: "identity", label: "Identity", icon: Edit3 },
    { key: "financial", label: "Financial", icon: Coins },
    { key: "status", label: "Status", icon: ToggleLeft },
    { key: "info", label: "Info", icon: Info },
  ];

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-6">
      <div className="mx-auto w-full max-w-8xl space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[1.5rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{selectedGroup.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Group Configuration Console</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* active badge */}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
              isActive
                ? "border-chart-1/30 bg-chart-1/10 text-chart-1"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-chart-1" : "bg-destructive"}`} />
              {isActive ? "Active" : "Inactive"}
            </span>

            {/* visibility badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
              {visibility === "PRIVATE" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              {visibility === "PRIVATE" ? "Private" : "Public"}
            </span>

            {!isChairperson && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-3 w-3" />
                Read-Only
              </span>
            )}
          </div>
        </div>

        {/* ── Non-chairperson notice ── */}
        {!isChairperson && (
          <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 flex gap-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground mb-1">View-Only Mode</p>
              Only the group <span className="font-bold text-primary">Chairperson</span> can modify these settings. You are viewing the current configuration for transparency.
            </div>
          </div>
        )}

        {/* ── Tab Nav ── */}
        <div className="flex gap-1 p-1 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-sm">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeSection === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── SECTION: Identity ── */}
        {activeSection === "identity" && (
          <div className="rounded-[1.5rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 md:p-8 shadow-sm space-y-6">
            <SectionHeader
              icon={Edit3}
              title="Group Identity"
              description="Name, description, and visibility settings for this workspace."
            />

            <div className="space-y-5">
              <Field label="Group Name" hint="Must be unique across all workspaces. Min 3 characters.">
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="group-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isChairperson || isSaving}
                    placeholder="e.g. Vijana Savings Circle"
                    className="pl-10 rounded-xl border-border/80 bg-background/50 focus-visible:ring-primary font-semibold"
                  />
                </div>
              </Field>

              <Field label="Description" hint="A brief summary of the group's purpose and goals. Optional but recommended.">
                <Textarea
                  id="group-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isChairperson || isSaving}
                  placeholder="Describe what this group is about..."
                  className="min-h-[100px] rounded-xl border-border/80 bg-background/50 focus-visible:ring-primary resize-none"
                />
              </Field>

              <Field label="Visibility" hint="Public groups are discoverable. Private groups require an invite or join code.">
                <div className="grid grid-cols-2 gap-3">
                  {(["PUBLIC", "PRIVATE"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => isChairperson && !isSaving && setVisibility(v)}
                      disabled={!isChairperson || isSaving}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                        visibility === v
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : "border-border/60 bg-background/30 text-muted-foreground hover:border-border"
                      } ${(!isChairperson || isSaving) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        visibility === v ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {v === "PUBLIC" ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{v === "PUBLIC" ? "Public" : "Private"}</p>
                        <p className="text-[11px] mt-0.5">{v === "PUBLIC" ? "Open & discoverable" : "Invite-only"}</p>
                      </div>
                      {visibility === v && (
                        <Check className="h-4 w-4 text-primary ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {isChairperson && (
              <div className="pt-4 border-t border-border/80 flex justify-end">
                <Button
                  onClick={handleSaveIdentity}
                  disabled={isSaving}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 px-6"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving…" : "Save Identity"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── SECTION: Financial ── */}
        {activeSection === "financial" && (
          <div className="rounded-[1.5rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 md:p-8 shadow-sm space-y-6">
            <SectionHeader
              icon={Coins}
              title="Financial Rules"
              description="Configure loan limits and late-payment penalties for members."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Loan Limit */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Loan Frequency Limit</p>
                    <p className="text-[11px] text-muted-foreground">Max concurrent active loans per member</p>
                  </div>
                </div>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="loan-limit"
                    type="number"
                    min="1"
                    step="1"
                    value={loanLimit}
                    onChange={(e) => setLoanLimit(e.target.value)}
                    disabled={!isChairperson || isSaving}
                    className="pl-10 rounded-xl border-border/80 bg-background focus-visible:ring-primary font-bold"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Prevents members from holding more than this many outstanding loans simultaneously. Default is <span className="font-semibold text-foreground">1</span>.
                </p>
              </div>

              {/* Late Fee */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <Percent className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Late Repayment Penalty</p>
                    <p className="text-[11px] text-muted-foreground">Default flat fine for overdue loans (TZS)</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">TZS</span>
                  <Input
                    id="late-fee"
                    type="number"
                    min="0"
                    step="1"
                    value={lateFee}
                    onChange={(e) => setLateFee(e.target.value)}
                    disabled={!isChairperson || isSaving}
                    className="pl-14 rounded-xl border-border/80 bg-background focus-visible:ring-primary font-bold"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Set to <span className="font-semibold text-foreground">0</span> if your group does not impose penalties for late repayments.
                </p>
              </div>
            </div>

            {isChairperson && (
              <div className="pt-4 border-t border-border/80 flex justify-end">
                <Button
                  onClick={handleSaveFinancial}
                  disabled={isSaving}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 px-6"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving…" : "Save Financial Rules"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── SECTION: Status ── */}
        {activeSection === "status" && (
          <div className="rounded-[1.5rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 md:p-8 shadow-sm space-y-6">
            <SectionHeader
              icon={ToggleLeft}
              title="Workspace Status"
              description="Control whether this group is actively operational."
            />

            <div className="rounded-2xl border border-border/80 bg-background/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  isActive ? "bg-chart-1/10 text-chart-1" : "bg-destructive/10 text-destructive"
                }`}>
                  {isActive ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    Group is currently <span className={isActive ? "text-chart-1" : "text-destructive"}>{isActive ? "Active" : "Inactive"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">
                    {isActive
                      ? "Members can access all financial operations, meetings, and features. Deactivating will suspend all group activity."
                      : "This group is suspended. Members cannot perform financial transactions or access group features until reactivated."}
                  </p>
                </div>
              </div>

              {isChairperson && (
                <Button
                  onClick={handleToggleActive}
                  disabled={isSaving}
                  variant="outline"
                  className={`rounded-xl shrink-0 font-bold gap-2 border-2 ${
                    isActive
                      ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                      : "border-chart-1/40 text-chart-1 hover:bg-chart-1/10"
                  }`}
                >
                  {isSaving
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Working…</>
                    : isActive
                    ? <><ToggleLeft className="h-4 w-4" /> Deactivate Group</>
                    : <><ToggleRight className="h-4 w-4" /> Reactivate Group</>}
                </Button>
              )}
            </div>

            {isActive && isChairperson && (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex gap-3 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Deactivating the group will immediately restrict access to all financial and meeting features. This action can be reversed at any time.</p>
              </div>
            )}
          </div>
        )}

        {/* ── SECTION: Info ── */}
        {activeSection === "info" && (
          <div className="rounded-[1.5rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 md:p-8 shadow-sm space-y-6">
            <SectionHeader
              icon={Info}
              title="Group Information"
              description="Read-only metadata and join credentials for this workspace."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Join Code */}
              <div className="col-span-full p-5 rounded-2xl border border-border/80 bg-background/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Join Code</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold tracking-[0.25em] text-foreground font-mono">
                    {selectedGroup.join_code ?? "------"}
                  </span>
                  <button
                    onClick={copyJoinCode}
                    className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  >
                    {codeCopied ? <Check className="h-3.5 w-3.5 text-chart-1" /> : <Copy className="h-3.5 w-3.5" />}
                    {codeCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Share this code to allow others to request membership to the group.</p>
              </div>

              {/* Members count */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Total Members</p>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{selectedGroup.members_count}</p>
                <p className="text-[11px] text-muted-foreground">Verified active memberships</p>
              </div>

              {/* Created by */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Created By</p>
                </div>
                <p className="text-sm font-bold text-foreground truncate">{selectedGroup.created_by}</p>
                <p className="text-[11px] text-muted-foreground">Group founder / original chairperson</p>
              </div>

              {/* Created at */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Date Founded</p>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {new Date(selectedGroup.created_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
                <p className="text-[11px] text-muted-foreground">Group creation timestamp</p>
              </div>

              {/* Last updated */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Last Updated</p>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {new Date(selectedGroup.updated_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
                <p className="text-[11px] text-muted-foreground">Most recent configuration change</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default memo(GroupSettingsPage);
