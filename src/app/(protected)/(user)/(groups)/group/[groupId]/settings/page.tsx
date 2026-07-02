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
import { useLanguage } from "@/components/language/language-provider";

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
  const { language } = useLanguage();
  const tt = (en: string, sw: string) => language === "sw" ? sw : en;

  /* form state — Identity */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");

  /* form state — Financial */
  const [loanLimit, setLoanLimit] = useState("1");
  const [minimumSavingsForLoan, setMinimumSavingsForLoan] = useState("0");
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
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!selectedGroup) return;
    setName(selectedGroup.name ?? "");
    setDescription(selectedGroup.description ?? "");
    setVisibility((selectedGroup.visibility as "PRIVATE" | "PUBLIC") ?? (selectedGroup.is_private ? "PRIVATE" : "PUBLIC"));
    setLoanLimit(String(selectedGroup.max_concurrent_loans ?? 1));
    setMinimumSavingsForLoan(String(selectedGroup.minimum_savings_for_loan ?? "0"));
    setLateFee(String(selectedGroup.default_late_fee_amount ?? "0"));
    setIsActive(selectedGroup.is_active ?? true);
    /* eslint-enable react-hooks/set-state-in-effect */
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
      toast.error(tt("Group name cannot be empty.", "Jina la kikundi haliwezi kuwa tupu."));
      return;
    }
    setIsSaving(true);
    const result = await updateGroup(groupId, {
      name: name.trim(),
      description: description.trim(),
      visibility,
    });
    setIsSaving(false);
    if (result.success) toast.success(tt("Group identity updated.", "Utambulisho wa kikundi umesasishwa."));
    else toast.error(result.message);
  };

  const handleSaveFinancial = async () => {
    const parsedLimit = Number(loanLimit);
    const parsedMinimumSavings = Number(minimumSavingsForLoan);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      toast.error(tt("Loan limit must be at least 1.", "Kikomo cha mikopo lazima kiwe angalau 1."));
      return;
    }
    if (Number.isNaN(parsedMinimumSavings) || parsedMinimumSavings < 0) {
      toast.error(tt("Minimum savings must be zero or greater.", "Akiba ya chini lazima iwe sifuri au zaidi."));
      return;
    }
    setIsSaving(true);
    const result = await updateGroup(groupId!, {
      max_concurrent_loans: parsedLimit,
      minimum_savings_for_loan: minimumSavingsForLoan.trim() || "0",
      default_late_fee_amount: lateFee.trim() || "0",
    });
    setIsSaving(false);
    if (result.success) toast.success(tt("Financial rules updated.", "Kanuni za fedha zimesasishwa."));
    else toast.error(result.message);
  };

  const handleToggleActive = async () => {
    const newValue = !isActive;
    setIsSaving(true);
    const result = await updateGroup(groupId!, { is_active: newValue });
    setIsSaving(false);
    if (result.success) {
      setIsActive(newValue);
      toast.success(newValue ? tt("Group activated.", "Kikundi kimewezeshwa.") : tt("Group deactivated.", "Kikundi kimesitishwa."));
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
          <p className="text-sm font-medium tracking-tight">{tt("Loading workspace settings...", "Inapakia mipangilio ya kikundi...")}</p>
        </div>
      </div>
    );
  }

  const tabs: { key: typeof activeSection; label: string; icon: React.ElementType }[] = [
    { key: "identity", label: tt("Identity", "Utambulisho"), icon: Edit3 },
    { key: "financial", label: tt("Financial", "Fedha"), icon: Coins },
    { key: "status", label: tt("Status", "Hali"), icon: ToggleLeft },
    { key: "info", label: tt("Info", "Taarifa"), icon: Info },
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
              <p className="text-sm text-muted-foreground mt-0.5">{tt("Group Configuration Console", "Mipangilio ya Kikundi")}</p>
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
              {isActive ? tt("Active", "Hai") : tt("Inactive", "Kimesitishwa")}
            </span>

            {/* visibility badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
              {visibility === "PRIVATE" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              {visibility === "PRIVATE" ? tt("Private", "Faragha") : tt("Public", "Umma")}
            </span>

            {!isChairperson && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-3 w-3" />
                {tt("Read-Only", "Kuangalia Pekee")}
              </span>
            )}
          </div>
        </div>

        {/* ── Non-chairperson notice ── */}
        {!isChairperson && (
          <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 flex gap-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground mb-1">{tt("View-Only Mode", "Hali ya Kuangalia Pekee")}</p>
              {tt("Only the group Chairperson can modify these settings. You are viewing the current configuration for transparency.", "Mwenyekiti wa kikundi pekee anaweza kubadilisha mipangilio hii. Unaiona kwa ajili ya uwazi.")}
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
              title={tt("Group Identity", "Utambulisho wa Kikundi")}
              description={tt("Name, description, and visibility settings for this workspace.", "Jina, maelezo, na mipangilio ya mwonekano wa kikundi.")}
            />

            <div className="space-y-5">
              <Field label={tt("Group Name", "Jina la Kikundi")} hint={tt("Must be unique across all workspaces. Min 3 characters.", "Lazima liwe la kipekee. Angalau herufi 3.")}>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="group-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isChairperson || isSaving}
                    placeholder={tt("e.g. Vijana Savings Circle", "mf. Kikundi cha Akiba Vijana")}
                    className="pl-10 rounded-xl border-border/80 bg-background/50 focus-visible:ring-primary font-semibold"
                  />
                </div>
              </Field>

              <Field label={tt("Description", "Maelezo")} hint={tt("A brief summary of the group's purpose and goals. Optional but recommended.", "Muhtasari wa madhumuni na malengo ya kikundi.")}>
                <Textarea
                  id="group-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isChairperson || isSaving}
                  placeholder={tt("Describe what this group is about...", "Eleza madhumuni ya kikundi hiki...")}
                  className="min-h-[100px] rounded-xl border-border/80 bg-background/50 focus-visible:ring-primary resize-none"
                />
              </Field>

              <Field label={tt("Visibility", "Mwonekano")} hint={tt("Public groups are discoverable. Private groups require an invite or join code.", "Vikundi vya umma vinaweza kutafutwa. Vikundi vya faragha vinahitaji mwaliko au msimbo.")}>
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
                        <p className="text-sm font-bold">{v === "PUBLIC" ? tt("Public", "Umma") : tt("Private", "Faragha")}</p>
                        <p className="text-[11px] mt-0.5">{v === "PUBLIC" ? tt("Open & discoverable", "Wazi na kinatafutika") : tt("Invite-only", "Kwa mwaliko pekee")}</p>
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
                  {isSaving ? tt("Saving...", "Inahifadhi...") : tt("Save Identity", "Hifadhi Utambulisho")}
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
              title={tt("Financial Rules", "Kanuni za Fedha")}
              description={tt("Configure loan limits and late-payment penalties for members.", "Weka vikomo vya mikopo na adhabu za kuchelewa kulipa.")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Loan Limit */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{tt("Loan Frequency Limit", "Kikomo cha Mikopo")}</p>
                    <p className="text-[11px] text-muted-foreground">{tt("Max concurrent active loans per member", "Mikopo hai ya juu kwa kila mwanachama")}</p>
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
                  {tt("Prevents members from holding more than this many outstanding loans simultaneously. Default is 1.", "Huzuia mwanachama kuwa na mikopo hai zaidi ya idadi hii. Chaguo-msingi ni 1.")}
                </p>
              </div>

              {/* Minimum Savings */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{tt("Minimum Savings to Borrow", "Akiba ya Chini ya Kukopa")}</p>
                    <p className="text-[11px] text-muted-foreground">{tt("Verified savings required before a member can request a loan", "Akiba iliyothibitishwa inayohitajika kabla ya kuomba mkopo")}</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">TZS</span>
                  <Input
                    id="minimum-savings-for-loan"
                    type="number"
                    min="0"
                    step="1"
                    value={minimumSavingsForLoan}
                    onChange={(e) => setMinimumSavingsForLoan(e.target.value)}
                    disabled={!isChairperson || isSaving}
                    className="pl-14 rounded-xl border-border/80 bg-background focus-visible:ring-primary font-bold"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  {tt("Members whose verified savings are below this amount cannot borrow. Set to 0 to disable the minimum requirement.", "Wanachama wenye akiba chini ya kiasi hiki hawawezi kukopa. Weka 0 kuondoa sharti hili.")}
                </p>
              </div>

              {/* Late Fee */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <Percent className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{tt("Late Repayment Penalty", "Adhabu ya Kuchelewa Kulipa")}</p>
                    <p className="text-[11px] text-muted-foreground">{tt("Default flat fine for overdue loans (TZS)", "Faini ya kawaida kwa mikopo iliyochelewa (TZS)")}</p>
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
                  {tt("Set to 0 if your group does not impose penalties for late repayments.", "Weka 0 ikiwa kikundi hakitozi adhabu za kuchelewa kulipa.")}
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
                  {isSaving ? tt("Saving...", "Inahifadhi...") : tt("Save Financial Rules", "Hifadhi Kanuni za Fedha")}
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
              title={tt("Workspace Status", "Hali ya Kikundi")}
              description={tt("Control whether this group is actively operational.", "Dhibiti kama kikundi kinafanya kazi.")}
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
                    {tt("Group is currently", "Kikundi kwa sasa")} <span className={isActive ? "text-chart-1" : "text-destructive"}>{isActive ? tt("Active", "Hai") : tt("Inactive", "Kimesitishwa")}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">
                    {isActive
                      ? tt("Members can access all financial operations, meetings, and features. Deactivating will suspend all group activity.", "Wanachama wanaweza kutumia shughuli zote za fedha, vikao, na vipengele. Kusitisha kutazuia shughuli zote.")
                      : tt("This group is suspended. Members cannot perform financial transactions or access group features until reactivated.", "Kikundi hiki kimesitishwa. Wanachama hawawezi kufanya miamala hadi kiwezeshwe tena.")}
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
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> {tt("Working...", "Inafanya kazi...")}</>
                    : isActive
                    ? <><ToggleLeft className="h-4 w-4" /> {tt("Deactivate Group", "Sitisha Kikundi")}</>
                    : <><ToggleRight className="h-4 w-4" /> {tt("Reactivate Group", "Wezesha Kikundi Tena")}</>}
                </Button>
              )}
            </div>

            {isActive && isChairperson && (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex gap-3 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{tt("Deactivating the group will immediately restrict access to all financial and meeting features. This action can be reversed at any time.", "Kusitisha kikundi kutazuia mara moja shughuli za fedha na vikao. Unaweza kukiwezesha tena baadaye.")}</p>
              </div>
            )}
          </div>
        )}

        {/* ── SECTION: Info ── */}
        {activeSection === "info" && (
          <div className="rounded-[1.5rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 md:p-8 shadow-sm space-y-6">
            <SectionHeader
              icon={Info}
              title={tt("Group Information", "Taarifa za Kikundi")}
              description={tt("Read-only metadata and join credentials for this workspace.", "Taarifa za kusoma pekee na msimbo wa kujiunga.")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Join Code */}
              <div className="col-span-full p-5 rounded-2xl border border-border/80 bg-background/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{tt("Join Code", "Msimbo wa Kujiunga")}</p>
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
                    {codeCopied ? tt("Copied!", "Imenakiliwa!") : tt("Copy", "Nakili")}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">{tt("Share this code to allow others to request membership to the group.", "Shiriki msimbo huu ili wengine waombe uanachama.")}</p>
              </div>

              {/* Members count */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">{tt("Total Members", "Jumla ya Wanachama")}</p>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{selectedGroup.members_count}</p>
                <p className="text-[11px] text-muted-foreground">{tt("Verified active memberships", "Wanachama hai waliothibitishwa")}</p>
              </div>

              {/* Created by */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">{tt("Created By", "Kimeundwa na")}</p>
                </div>
                <p className="text-sm font-bold text-foreground truncate">{selectedGroup.created_by}</p>
                <p className="text-[11px] text-muted-foreground">{tt("Group founder / original chairperson", "Mwanzilishi wa kikundi / mwenyekiti wa kwanza")}</p>
              </div>

              {/* Created at */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">{tt("Date Founded", "Tarehe ya Kuanzishwa")}</p>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {new Date(selectedGroup.created_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
                <p className="text-[11px] text-muted-foreground">{tt("Group creation timestamp", "Tarehe ya kuundwa kwa kikundi")}</p>
              </div>

              {/* Last updated */}
              <div className="p-5 rounded-2xl border border-border/80 bg-background/40 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">{tt("Last Updated", "Ilisasishwa Mwisho")}</p>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {new Date(selectedGroup.updated_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
                <p className="text-[11px] text-muted-foreground">{tt("Most recent configuration change", "Mabadiliko ya mwisho ya mipangilio")}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default memo(GroupSettingsPage);
