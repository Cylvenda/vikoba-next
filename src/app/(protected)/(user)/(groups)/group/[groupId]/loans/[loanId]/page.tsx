"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRightLeft,
  BadgeInfo,
  CalendarRange,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  Mail,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Wallet,
  WalletCards,
} from "lucide-react"
import { toast } from "react-toastify"

import { financeServices, type Loan, type LoanInstallment, type LoanPayment } from "@/api/services/finance.service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useGroupStore } from "@/store/group/groupUser.store"
import { formatTzs } from "@/lib/vikoba-finance"
import { useLanguage } from "@/components/language/language-provider"

function parseTzsAmount(value: string | number) {
  return Number(value || 0)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-TZ", {
    dateStyle: "medium",
  }).format(new Date(value))
}

function getStatusLabel(status: Loan["status"]) {
  return status.toLowerCase().replaceAll("_", " ")
}

function paymentMethodLabel(method: LoanPayment["payment_method"]) {
  return method.toLowerCase().replaceAll("_", " ")
}

function statusTone(status: LoanInstallment["status"]) {
  switch (status) {
    case "PAID":
      return "border-chart-3/30 bg-chart-3/10 text-chart-3"
    case "PARTIAL":
      return "border-chart-4/30 bg-chart-4/10 text-chart-4"
    case "OVERDUE":
      return "border-destructive/30 bg-destructive/10 text-destructive"
    default:
      return "border-border/60 bg-muted/30 text-muted-foreground"
  }
}

export default function LoanDetailsPage() {
  const params = useParams<{ groupId: string; loanId: string }>()
  const router = useRouter()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const loanId = Array.isArray(params?.loanId) ? params.loanId[0] : params?.loanId

  const { selectedGroup, selectedGroupMembers, fetchGroupById, fetchSelectedGroupMembers } = useGroupStore()
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en

  const [loan, setLoan] = useState<Loan | null>(null)
  const [installments, setInstallments] = useState<LoanInstallment[]>([])
  const [payments, setPayments] = useState<LoanPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [customAmount, setCustomAmount] = useState("")

  useEffect(() => {
    if (groupId && (!selectedGroup || selectedGroup.id !== groupId)) {
      void fetchGroupById(groupId)
    }

    if (groupId && selectedGroupMembers.length === 0) {
      void fetchSelectedGroupMembers(groupId)
    }
  }, [groupId, selectedGroup, selectedGroupMembers.length, fetchGroupById, fetchSelectedGroupMembers])

  useEffect(() => {
    if (!groupId || !loanId) return

    let cancelled = false

    const loadLoanDetails = async () => {
      setLoading(true)

      try {
        const [loansResponse, installmentsResponse, paymentsResponse] = await Promise.all([
          financeServices.getLoans(groupId),
          financeServices.getLoanInstallments(loanId),
          financeServices.getLoanPayments(loanId),
        ])

        if (cancelled) return

        const foundLoan = loansResponse.data.find((item) => item.uuid === loanId) || null
        setLoan(foundLoan)
        setInstallments(installmentsResponse.data)
        setPayments(paymentsResponse.data)
        if (foundLoan) {
          setCustomAmount(foundLoan.remaining_balance || foundLoan.balance)
        }
      } catch (error: unknown) {
        if (!cancelled) {
          toast.error(
            (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
              (error instanceof Error ? error.message : (language === "sw" ? "Imeshindikana kupakia maelezo ya mkopo." : "Unable to load loan details."))
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadLoanDetails()

    return () => {
      cancelled = true
    }
  }, [groupId, language, loanId])

  const borrower = useMemo(() => {
    if (!loan) return null

    return (
      selectedGroupMembers.find(
        (member) => member.user_id === loan.borrower || member.membership_id === loan.borrower
      ) || null
    )
  }, [loan, selectedGroupMembers])

  const activeInstallment = useMemo(() => {
    return (
      installments.find((item) => item.status !== "PAID") ||
      installments[0] ||
      null
    )
  }, [installments])

  const loanProgress = useMemo(() => {
    if (!loan) return 0
    const total = parseTzsAmount(loan.total_repayment_amount)
    if (total <= 0) return 0
    return Math.min(100, Math.round((parseTzsAmount(loan.total_paid) / total) * 100))
  }, [loan])

  const activeBalance = loan ? parseTzsAmount(loan.remaining_balance || loan.balance) : 0

  const latePenaltySummary = useMemo(() => {
    if (!loan) {
      return {
        overdueInstallments: 0,
        penaltyAmount: 0,
        perInstallmentPenalty: 0,
        maxDaysOverdue: 0,
      }
    }

    const today = new Date()
    const overdueInstallmentRecords = installments.filter((item) => item.status === "OVERDUE")
    const overdueInstallments = Math.max(0, loan.overdue_installments_count || overdueInstallmentRecords.length)
    const daysOverdueList = overdueInstallmentRecords.map((item) => {
      const dueDate = new Date(item.due_date)
      const diffMs = today.getTime() - dueDate.getTime()
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    })

    return {
      overdueInstallments,
      penaltyAmount: parseTzsAmount(loan.accrued_late_fee_amount),
      perInstallmentPenalty: parseTzsAmount(loan.effective_late_fee_amount),
      maxDaysOverdue: daysOverdueList.length > 0 ? Math.max(...daysOverdueList) : 0,
    }
  }, [installments, loan])

  const navigateToPayment = (mode: "full" | "installment" | "custom") => {
    if (!loan) return

    const amount =
      mode === "full"
        ? activeBalance
        : mode === "installment"
          ? parseTzsAmount(activeInstallment?.remaining_balance || activeInstallment?.amount_due || 0)
          : parseTzsAmount(customAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(tt("Please enter a valid amount before continuing.", "Tafadhali ingiza kiasi sahihi kabla ya kuendelea."))
      return
    }

    if (amount > activeBalance) {
      toast.error(tt("The repayment amount cannot exceed the remaining balance.", "Kiasi cha marejesho hakiwezi kuzidi salio lililobaki."))
      return
    }

    const query = new URLSearchParams({
      type: "loan",
      id: loan.uuid,
      amount: String(amount),
      mode,
      late_fee_amount:
        mode === "installment" && activeInstallment
          ? String(parseTzsAmount(activeInstallment.late_fee_balance))
          : String(latePenaltySummary.penaltyAmount),
      overdue_installments: String(latePenaltySummary.overdueInstallments),
    })

    if (mode === "installment" && activeInstallment) {
      query.set("installment_number", String(activeInstallment.installment_number))
      query.set("installment", activeInstallment.uuid)
    }

    router.push(`/group/${groupId}/payment?${query.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen overflow-x-hidden p-4 sm:p-5 md:p-8">
        <div className="mx-auto w-full max-w-8xl">
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardContent className="py-16 text-center text-muted-foreground">{tt("Loading loan details...", "Inapakia maelezo ya mkopo...")}</CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="min-h-screen overflow-x-hidden p-4 sm:p-5 md:p-8">
        <div className="mx-auto flex w-full max-w-8xl flex-col gap-6">
          <Button variant="ghost" asChild className="w-fit text-muted-foreground hover:text-foreground">
            <Link href={`/group/${groupId}/loans`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tt("Back to loans", "Rudi kwenye mikopo")}
            </Link>
          </Button>
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardContent className="py-16 text-center">
              <Badge variant="outline" className="mb-4 uppercase">
                {tt("Loan not found", "Mkopo haujapatikana")}
              </Badge>
              <h1 className="text-2xl font-extrabold text-foreground">{tt("We could not find this loan", "Hatukuweza kupata mkopo huu")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {tt("The loan may have been removed or you may not have access to this record.", "Huenda mkopo umeondolewa au huna ruhusa ya kuona rekodi hii.")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isRepayable = ["ACTIVE", "OVERDUE"].includes(loan.status) && activeBalance > 0

  return (
    <div className="min-h-screen overflow-x-hidden p-4 sm:p-5 md:p-8">
      <div className="mx-auto flex w-full max-w-8xl min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            asChild
            className="w-fit text-muted-foreground hover:text-foreground"
          >
            <Link href={`/group/${groupId}/loans`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tt("Back to loans", "Rudi kwenye mikopo")}
            </Link>
          </Button>
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 uppercase tracking-[0.18em]"
          >
            {selectedGroup?.name || tt("Group loan ledger", "Rejista ya mikopo ya kikundi")}
          </Badge>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur-md sm:p-6 md:p-8">
          <div className="absolute inset-0 " />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
            <div className="min-w-0 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-chart-3/15 text-chart-3 shadow-sm">
                  <WalletCards className="h-6 w-6" />
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full uppercase tracking-[0.16em]"
                >
                  {tt("Loan details", "Maelezo ya mkopo")}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full uppercase tracking-[0.16em]"
                >
                  {language === "sw"
                    ? ({
                        PENDING: "inasubiri",
                        APPROVED: "imeidhinishwa",
                        REJECTED: "imekataliwa",
                        PAYOUT_REVERSED: "malipo yamerejeshwa",
                        ACTIVE: "inaendelea",
                        PAID_OFF: "imelipwa yote",
                        OVERDUE: "imechelewa",
                        COMPLETED: "imekamilika",
                        DEFAULTED: "imeshindwa kulipwa",
                      } as Record<Loan["status"], string>)[loan.status]
                    : getStatusLabel(loan.status)}
                </Badge>
              </div>

              <div>
                <h1 className="break-words text-3xl font-black tracking-tight text-foreground md:text-4xl">
                  {loan.loan_product_name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
                  {tt("A complete repayment view with installment schedule, active installment status, and payment history.", "Mwonekano kamili wa marejesho wenye ratiba ya awamu, hali ya awamu inayoendelea, na historia ya malipo.")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border-border/60 bg-background/80 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {tt("Principal", "Mtaji")}
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-foreground">
                      {formatTzs(parseTzsAmount(loan.principal_amount))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-background/80 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {tt("Total repayment", "Jumla ya marejesho")}
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-foreground">
                      {formatTzs(parseTzsAmount(loan.total_repayment_amount))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-background/80 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {tt("Paid so far", "Iliyolipwa")}
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-chart-3">
                      {formatTzs(parseTzsAmount(loan.total_paid))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-background/80 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {tt("Remaining", "Iliyobaki")}
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-destructive">
                      {formatTzs(activeBalance)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {tt("Repayment progress", "Maendeleo ya marejesho")}
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    {loanProgress}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted/70">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-chart-3 to-primary transition-all"
                    style={{ width: `${loanProgress}%` }}
                  />
                </div>
              </div>

              {latePenaltySummary.overdueInstallments > 0 ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                      <CalendarRange className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">
                        {tt("Late payment penalties", "Adhabu za kuchelewa kulipa")}
                      </p>
                      <h3 className="mt-1 text-base font-bold text-foreground">
                        {latePenaltySummary.overdueInstallments} {tt("overdue installment(s)", "awamu zilizochelewa")}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {formatTzs(latePenaltySummary.perInstallmentPenalty)} {tt("per overdue installment, totaling", "kwa kila awamu iliyochelewa, jumla")} {formatTzs(latePenaltySummary.penaltyAmount)} {tt("in late payment penalties.", "ya adhabu za kuchelewa.")}
                        {latePenaltySummary.maxDaysOverdue > 0 ? (
                          <>
                            {" "}
                            {tt("The oldest overdue installment is about", "Awamu ya zamani zaidi imechelewa takriban")} {latePenaltySummary.maxDaysOverdue} {tt("day(s).", "siku.")}
                          </>
                        ) : null}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {tt("This page shows the amount that has fallen behind schedule.", "Ukurasa huu unaonyesha kiasi kilichochelewa kulingana na ratiba.")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <Card className="border-border/60 bg-background/80 shadow-sm">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {tt("Repayment actions", "Vitendo vya marejesho")}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">
                      {tt("Choose how to pay", "Chagua jinsi ya kulipa")}
                    </h2>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button
                    type="button"
                    className="min-h-20 w-full justify-between gap-4 rounded-2xl px-4 py-5 text-left sm:px-5"
                    onClick={() => navigateToPayment("full")}
                    disabled={!isRepayable}
                  >
                    <span className="min-w-0">
                      <span className="block text-xs uppercase tracking-[0.16em] opacity-80">
                        {tt("Full balance", "Salio lote")}
                      </span>
                      <span className="mt-1 block text-lg font-extrabold">
                        {formatTzs(activeBalance)}
                      </span>
                    </span>
                    <ArrowRightLeft className="h-5 w-5" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-20 w-full justify-between gap-4 rounded-2xl px-4 py-5 text-left sm:px-5"
                    onClick={() => navigateToPayment("installment")}
                    disabled={!isRepayable || !activeInstallment}
                  >
                    <span className="min-w-0">
                      <span className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {tt("Next installment", "Awamu inayofuata")}
                      </span>
                      <span className="mt-1 block text-lg font-extrabold">
                        {activeInstallment
                          ? formatTzs(
                              parseTzsAmount(
                                activeInstallment.remaining_balance,
                              ),
                            )
                          : "N/A"}
                      </span>
                    </span>
                    <Wallet className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {tt("Custom amount", "Kiasi maalum")}
                  </p>
                  <Input
                    type="number"
                    min="1"
                    max={activeBalance}
                    step="0.01"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    placeholder={`${tt("Up to", "Hadi")} ${formatTzs(activeBalance)}`}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-xl"
                    onClick={() => navigateToPayment("custom")}
                    disabled={!isRepayable}
                  >
                    {tt("Continue with custom amount", "Endelea na kiasi maalum")}
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-chart-3" />
                    <span className="text-sm font-semibold text-foreground">
                      {tt("Installment aware", "Inazingatia awamu")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {tt("Payments are allocated to the oldest unpaid installment first, so the ledger stays accurate even when users choose a custom amount.", "Malipo huwekwa kwanza kwenye awamu ya zamani ambayo haijalipwa, hivyo rejista hubaki sahihi hata kiasi maalum kinapotumika.")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-bold text-foreground">
                    {tt("Loan overview", "Muhtasari wa mkopo")}
                  </h2>
                </div>
                <Badge variant="outline" className="uppercase">
                  {loan.duration_count} {loan.duration_type.toLowerCase()}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {tt("Interest rate", "Kiwango cha riba")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {loan.interest_rate}%
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {tt("Due date", "Tarehe ya mwisho")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {formatDate(loan.due_date)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {tt("Approved at", "Imeidhinishwa tarehe")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {loan.approved_at ? formatDate(loan.approved_at) : "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {tt("Disbursed at", "Imetolewa tarehe")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {loan.disbursed_at ? formatDate(loan.disbursed_at) : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {tt("Purpose", "Madhumuni")}
                </p>
                <p className="mt-2 wrap-break-word text-sm leading-6 text-foreground">
                  {loan.purpose ||
                    tt("No purpose was provided for this loan request.", "Hakuna madhumuni yaliyotolewa kwa ombi hili la mkopo.")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-bold text-foreground">{tt("Requester", "Mwombaji")}</h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {tt("Name", "Jina")}
                  </p>
                  <p className="mt-1 wrap-break-word text-lg font-bold text-foreground">
                    {borrower
                      ? `${borrower.first_name} ${borrower.last_name}`.trim() ||
                        borrower.email
                      : loan.borrower_name || tt("Unnamed member", "Mwanachama asiye na jina")}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {tt("Email", "Barua pepe")}
                  </p>
                  <p className="mt-1 inline-flex min-w-0 items-center gap-2 break-words text-sm font-semibold text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {borrower?.email || tt("No email available", "Hakuna barua pepe")}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {tt("Membership status", "Hali ya uanachama")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {borrower
                      ? `${borrower.role} ${borrower.is_verified ? tt("- Verified", "- Amethibitishwa") : tt("- Pending verification", "- Anasubiri uthibitisho")}`
                      : tt("Not loaded from the group members list", "Hajapatikana kwenye orodha ya wanachama")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-bold text-foreground">
                    {tt("Installment schedule", "Ratiba ya awamu")}
                  </h2>
                </div>
                <Badge variant="secondary" className="uppercase">
                  {installments.length} {tt("items", "rekodi")}
                </Badge>
              </div>

              <div className="space-y-3">
                {installments.map((installment) => (
                  <div
                    key={installment.uuid}
                    className="rounded-2xl border border-border/60 bg-background/80 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {tt("Installment", "Awamu")} {installment.installment_number}
                        </p>
                        <p className="mt-1 wrap-break-word text-sm text-foreground">
                          {tt("Due", "Mwisho")} {formatDate(installment.due_date)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`uppercase ${statusTone(installment.status)}`}
                      >
                        {installment.status === "PAID"
                          ? tt("paid", "imelipwa")
                          : installment.status === "PARTIAL"
                            ? tt("partial", "sehemu")
                            : installment.status === "OVERDUE"
                              ? tt("overdue", "imechelewa")
                              : tt("pending", "inasubiri")}
                      </Badge>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {tt("Due", "Inayodaiwa")}
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {formatTzs(parseTzsAmount(installment.amount_due))}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {tt("Paid", "Imelipwa")}
                        </p>
                        <p className="mt-1 font-semibold text-chart-3">
                          {formatTzs(parseTzsAmount(installment.amount_paid))}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {tt("Remaining", "Iliyobaki")}
                        </p>
                        <p className="mt-1 font-semibold text-destructive">
                          {formatTzs(
                            parseTzsAmount(installment.remaining_balance),
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {installments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {tt("No installments have been generated yet.", "Bado hakuna awamu zilizotengenezwa.")}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-bold text-foreground">
                    {tt("Payment history", "Historia ya malipo")}
                  </h2>
                </div>
                <Badge variant="secondary" className="uppercase">
                  {payments.length} {tt("records", "rekodi")}
                </Badge>
              </div>

              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.uuid}
                    className="rounded-2xl border border-border/60 bg-background/80 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold text-foreground">
                          {formatTzs(parseTzsAmount(payment.amount))}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {tt("Paid", "Imelipwa")} {formatDate(payment.payment_date)}
                        </p>
                      </div>
                      <Badge variant="outline" className="uppercase">
                        {paymentMethodLabel(payment.payment_method)}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted/30 px-2.5 py-1">
                        {tt("Installment", "Awamu")} {payment.installment_number ?? "N/A"}
                      </span>
                      {payment.reference ? (
                        <span className="max-w-full break-words rounded-full bg-muted/30 px-2.5 py-1">
                          {tt("Ref", "Rejea")} {payment.reference}
                        </span>
                      ) : null}
                      {payment.note ? (
                        <span className="max-w-full break-words rounded-full bg-muted/30 px-2.5 py-1">
                          {tt("Note", "Maelezo")} {payment.note}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
                {payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 py-12 text-center">
                    <BadgeInfo className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {tt("No payment history yet", "Bado hakuna historia ya malipo")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tt("Payments will appear here as soon as the borrower starts repaying this loan.", "Malipo yataonekana hapa mara mkopaji atakapoanza kurejesha mkopo huu.")}
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90 shadow-sm xl:col-span-2">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-bold text-foreground">
                  {tt("Summary notes", "Maelezo ya muhtasari")}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                    <span className="text-sm font-semibold text-foreground">
                      {tt("Repayment rule", "Kanuni ya marejesho")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tt("Payments are allocated to the oldest unpaid installment first.", "Malipo huwekwa kwanza kwenye awamu ya zamani ambayo haijalipwa.")}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-chart-2" />
                    <span className="text-sm font-semibold text-foreground">
                      {tt("Available methods", "Njia zinazopatikana")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tt("Cash, mobile money, bank transfer, and credit card payments are supported by the ledger.", "Rejista inasaidia fedha taslimu, fedha za simu, uhamisho wa benki, na kadi.")}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      {tt("Remaining balance", "Salio lililobaki")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatTzs(activeBalance)} {tt("remains payable on this loan.", "bado linapaswa kulipwa kwenye mkopo huu.")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
