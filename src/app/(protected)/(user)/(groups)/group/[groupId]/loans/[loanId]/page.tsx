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
              (error instanceof Error ? error.message : "Unable to load loan details.")
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
  }, [groupId, loanId])

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
      toast.error("Please enter a valid amount before continuing.")
      return
    }

    if (amount > activeBalance) {
      toast.error("The repayment amount cannot exceed the remaining balance.")
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
            <CardContent className="py-16 text-center text-muted-foreground">Loading loan details...</CardContent>
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
              Back to loans
            </Link>
          </Button>
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardContent className="py-16 text-center">
              <Badge variant="outline" className="mb-4 uppercase">
                Loan not found
              </Badge>
              <h1 className="text-2xl font-extrabold text-foreground">We could not find this loan</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The loan may have been removed or you may not have access to this record.
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
              Back to loans
            </Link>
          </Button>
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 uppercase tracking-[0.18em]"
          >
            {selectedGroup?.name || "Group loan ledger"}
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
                  Loan details
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full uppercase tracking-[0.16em]"
                >
                  {getStatusLabel(loan.status)}
                </Badge>
              </div>

              <div>
                <h1 className="break-words text-3xl font-black tracking-tight text-foreground md:text-4xl">
                  {loan.loan_product_name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
                  A complete repayment view with installment schedule, active
                  installment status, and payment history.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border-border/60 bg-background/80 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Principal
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-foreground">
                      {formatTzs(parseTzsAmount(loan.principal_amount))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-background/80 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Total repayment
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-foreground">
                      {formatTzs(parseTzsAmount(loan.total_repayment_amount))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-background/80 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Paid so far
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-chart-3">
                      {formatTzs(parseTzsAmount(loan.total_paid))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-background/80 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Remaining
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
                    Repayment progress
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
                        Late payment penalties
                      </p>
                      <h3 className="mt-1 text-base font-bold text-foreground">
                        {latePenaltySummary.overdueInstallments} overdue installment
                        {latePenaltySummary.overdueInstallments === 1 ? "" : "s"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {formatTzs(latePenaltySummary.perInstallmentPenalty)} per overdue installment,
                        totaling {formatTzs(latePenaltySummary.penaltyAmount)} in late payment penalties.
                        {latePenaltySummary.maxDaysOverdue > 0 ? (
                          <>
                            {" "}
                            The oldest overdue installment is about {latePenaltySummary.maxDaysOverdue} day
                            {latePenaltySummary.maxDaysOverdue === 1 ? "" : "s"} late.
                          </>
                        ) : null}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        This page shows the amount that has fallen behind schedule.
                        If your group uses an extra late-fee rule, we can wire that in next.
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
                      Repayment actions
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">
                      Choose how to pay
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
                        Full balance
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
                        Next installment
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
                    Custom amount
                  </p>
                  <Input
                    type="number"
                    min="1"
                    max={activeBalance}
                    step="0.01"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    placeholder={`Up to ${formatTzs(activeBalance)}`}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-xl"
                    onClick={() => navigateToPayment("custom")}
                    disabled={!isRepayable}
                  >
                    Continue with custom amount
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-chart-3" />
                    <span className="text-sm font-semibold text-foreground">
                      Installment aware
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Payments are allocated oldest-unpaid installment first, so
                    the ledger stays accurate even when users choose a custom
                    amount.
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
                    Loan overview
                  </h2>
                </div>
                <Badge variant="outline" className="uppercase">
                  {loan.duration_count} {loan.duration_type.toLowerCase()}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Interest rate
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {loan.interest_rate}%
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Due date
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {formatDate(loan.due_date)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Approved at
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {loan.approved_at ? formatDate(loan.approved_at) : "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Disbursed at
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {loan.disbursed_at ? formatDate(loan.disbursed_at) : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Purpose
                </p>
                <p className="mt-2 wrap-break-word text-sm leading-6 text-foreground">
                  {loan.purpose ||
                    "No purpose was provided for this loan request."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-bold text-foreground">Requester</h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Name
                  </p>
                  <p className="mt-1 wrap-break-word text-lg font-bold text-foreground">
                    {borrower
                      ? `${borrower.first_name} ${borrower.last_name}`.trim() ||
                        borrower.email
                      : loan.borrower_name || "Unnamed member"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 inline-flex min-w-0 items-center gap-2 break-words text-sm font-semibold text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {borrower?.email || "No email available"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Membership status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {borrower
                      ? `${borrower.role} ${borrower.is_verified ? "· Verified" : "· Pending verification"}`
                      : "Not loaded from the group members list"}
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
                    Installment schedule
                  </h2>
                </div>
                <Badge variant="secondary" className="uppercase">
                  {installments.length} items
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
                          Installment {installment.installment_number}
                        </p>
                        <p className="mt-1 wrap-break-word text-sm text-foreground">
                          Due {formatDate(installment.due_date)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`uppercase ${statusTone(installment.status)}`}
                      >
                        {installment.status.toLowerCase()}
                      </Badge>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Due
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {formatTzs(parseTzsAmount(installment.amount_due))}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Paid
                        </p>
                        <p className="mt-1 font-semibold text-chart-3">
                          {formatTzs(parseTzsAmount(installment.amount_paid))}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Remaining
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
                    No installments have been generated yet.
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
                    Payment history
                  </h2>
                </div>
                <Badge variant="secondary" className="uppercase">
                  {payments.length} records
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
                          Paid {formatDate(payment.payment_date)}
                        </p>
                      </div>
                      <Badge variant="outline" className="uppercase">
                        {paymentMethodLabel(payment.payment_method)}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted/30 px-2.5 py-1">
                        Installment {payment.installment_number ?? "N/A"}
                      </span>
                      {payment.reference ? (
                        <span className="max-w-full break-words rounded-full bg-muted/30 px-2.5 py-1">
                          Ref {payment.reference}
                        </span>
                      ) : null}
                      {payment.note ? (
                        <span className="max-w-full break-words rounded-full bg-muted/30 px-2.5 py-1">
                          Note {payment.note}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
                {payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 py-12 text-center">
                    <BadgeInfo className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      No payment history yet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Payments will appear here as soon as the borrower starts
                      repaying this loan.
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
                  Summary notes
                </h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                    <span className="text-sm font-semibold text-foreground">
                      Repayment rule
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Payments are allocated to the oldest unpaid installment
                    first.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-chart-2" />
                    <span className="text-sm font-semibold text-foreground">
                      Available methods
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cash, mobile money, bank transfer, and credit card payments
                    are supported by the ledger.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Remaining balance
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatTzs(activeBalance)} remains payable on this loan.
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
