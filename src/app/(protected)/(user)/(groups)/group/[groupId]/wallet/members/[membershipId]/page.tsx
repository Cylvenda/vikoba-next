"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  WalletCards,
  Printer,
} from "lucide-react"
import { financeServices, type Contribution, type Fine, type FinePayment, type Loan, type LoanPayment } from "@/api/services/finance.service"
import { useFinanceStore } from "@/store/finance/finance.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatTzs } from "@/lib/vikoba-finance"
import { useLanguage } from "@/components/language/language-provider"

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-TZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

type TimelineItem = {
  id: string
  type: "CONTRIBUTION" | "LOAN" | "LOAN_REPAYMENT" | "FINE" | "FINE_PAYMENT"
  title: string
  amount: number
  happenedAt: string
  note?: string | null
  positive: boolean
}

export default function MemberWalletDetailPage() {
  const params = useParams<{ groupId: string; membershipId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const membershipId = Array.isArray(params?.membershipId) ? params.membershipId[0] : params?.membershipId
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const { walletReport, fetchWalletReport } = useFinanceStore()
  const { language } = useLanguage()
  const isSwahili = language === "sw"
  const tt = (en: string, sw: string) => (isSwahili ? sw : en)

  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [fines, setFines] = useState<Fine[]>([])
  const [finePayments, setFinePayments] = useState<FinePayment[]>([])
  const [loanPayments, setLoanPayments] = useState<LoanPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [exportFormat, setExportFormat] = useState<"csv" | "xls">("csv")

  useEffect(() => {
    if (!groupId) return

    void fetchWalletReport(groupId)
  }, [fetchWalletReport, groupId])

  useEffect(() => {
    if (!groupId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const [contribRes, loansRes, finesRes, finePaymentsRes] = await Promise.all([
          financeServices.getContributions(groupId),
          financeServices.getLoans(groupId),
          financeServices.getFines(groupId),
          financeServices.getFinePayments(groupId),
        ])

        if (cancelled) return

        const memberLoans = loansRes.data.filter(
          (loan) => loan.borrower === membershipId || loan.borrower_user_id === selectedGroupMembers.find((member) => member.membership_id === membershipId)?.user_id
        )
        const memberFines = finesRes.data.filter(
          (fine) => fine.member === membershipId || fine.member_user_id === selectedGroupMembers.find((member) => member.membership_id === membershipId)?.user_id
        )

        const memberLoanPayments = await Promise.all(
          memberLoans.map(async (loan) => {
            const res = await financeServices.getLoanPayments(loan.uuid)
            return res.data
          })
        )

        if (cancelled) return

        setContributions(
          contribRes.data.filter(
            (contribution) =>
              contribution.member === membershipId ||
              contribution.member_user_id === selectedGroupMembers.find((member) => member.membership_id === membershipId)?.user_id
          )
        )
        setLoans(memberLoans)
        setFines(memberFines)
        setFinePayments(
          finePaymentsRes.data.filter((payment) =>
            memberFines.some((fine) => fine.uuid === payment.fine)
          )
        )
        setLoanPayments(memberLoanPayments.flat())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [groupId, membershipId, selectedGroupMembers])

  const member = selectedGroupMembers.find((item) => item.membership_id === membershipId)
  const wallet = walletReport?.memberWallets?.find((item) => item.membership_uuid === membershipId)

  const timeline = useMemo<TimelineItem[]>(() => {
    const label = (en: string, sw: string) => (isSwahili ? sw : en)
    const contributionItems = contributions.map((item) => ({
      id: item.uuid,
      type: "CONTRIBUTION" as const,
      title: item.status === "VERIFIED" ? label("Verified contribution", "Mchango uliothibitishwa") : label("Pending contribution", "Mchango unasubiri"),
      amount: Number(item.amount || 0),
      happenedAt: item.paid_at,
      note: item.note,
      positive: item.status === "VERIFIED",
    }))

    const loanItems = loans.map((item) => ({
      id: item.uuid,
      type: "LOAN" as const,
      title: label(`Loan ${item.status.toLowerCase().replaceAll("_", " ")}`, `Mkopo ${item.status.toLowerCase().replaceAll("_", " ")}`),
      amount: Number(item.principal_amount || 0),
      happenedAt: item.disbursed_at || item.created_at,
      note: item.purpose,
      positive: false,
    }))

    const loanPaymentItems = loanPayments.map((item) => ({
      id: item.uuid,
      type: "LOAN_REPAYMENT" as const,
      title: label("Loan repayment", "Marejesho ya mkopo"),
      amount: Number(item.amount || 0),
      happenedAt: item.paid_at,
      note: item.note,
      positive: true,
    }))

    const fineItems = fines.map((item) => ({
      id: item.uuid,
      type: "FINE" as const,
      title: item.status === "PAID" ? label("Fine settled", "Faini imelipwa") : label("Fine issued", "Faini imetolewa"),
      amount: Number(item.amount || 0),
      happenedAt: item.issued_at,
      note: item.reason,
      positive: item.status === "PAID",
    }))

    const finePaymentItems = finePayments.map((item) => ({
      id: item.uuid,
      type: "FINE_PAYMENT" as const,
      title: label("Fine payment", "Malipo ya faini"),
      amount: Number(item.amount || 0),
      happenedAt: item.paid_at,
      note: item.note,
      positive: true,
    }))

    return [...contributionItems, ...loanItems, ...loanPaymentItems, ...fineItems, ...finePaymentItems].sort(
      (left, right) => new Date(right.happenedAt).getTime() - new Date(left.happenedAt).getTime()
    )
  }, [contributions, finePayments, fines, isSwahili, loanPayments, loans])

  const totals = useMemo(() => {
    const totalContributions = contributions
      .filter((item) => item.status === "VERIFIED")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const totalBorrowed = loans.reduce((sum, item) => sum + Number(item.principal_amount || 0), 0)
    const totalFineBalance = fines.reduce((sum, item) => sum + Number(item.balance || 0), 0)
    const totalLoanBalance = loans.reduce((sum, item) => sum + Number(item.remaining_balance || item.balance || 0), 0)

    return {
      totalContributions,
      totalBorrowed,
      totalFineBalance,
      totalLoanBalance,
    }
  }, [contributions, fines, loans])

  const downloadStatement = () => {
    if (!member || !selectedGroup) return

    const csvEscape = (value: string | number | null | undefined) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`

    const rows = [
      ["section", "label", "value", "date", "notes"],
      ["member", "name", `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim(), "", ""],
      ["member", "group", selectedGroup.name, "", ""],
      ["summary", "savings", wallet?.savings_balance ?? totals.totalContributions, "", ""],
      ["summary", "loan_outstanding", wallet?.loan_outstanding ?? totals.totalLoanBalance, "", ""],
      ["summary", "fine_outstanding", wallet?.fine_outstanding ?? totals.totalFineBalance, "", ""],
      ["summary", "net_balance", wallet?.net_balance ?? 0, "", ""],
      ["timeline", "items", timeline.length, "", ""],
      ...timeline.map((item) => [
        "timeline",
        item.type.replaceAll("_", " "),
        item.positive ? `+${item.amount}` : `-${item.amount}`,
        item.happenedAt,
        item.note || item.title,
      ]),
    ]

    const csvBody = rows
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\n")

    const xlsBody = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${rows
      .map((row) => `<tr>${row.map((cell) => `<td>${String(cell ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</td>`).join("")}</tr>`)
      .join("")}</table></body></html>`

    const content = exportFormat === "xls" ? xlsBody : csvBody
    const mimeType = exportFormat === "xls" ? "application/vnd.ms-excel" : "text/csv;charset=utf-8"
    const extension = exportFormat === "xls" ? "xls" : "csv"
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${(member.first_name || member.last_name || "member").toLowerCase().replaceAll(" ", "-")}-wallet-statement.${extension}`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  if (!selectedGroup || !member) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
          {tt("Loading member wallet details...", "Inapakia maelezo ya mkoba wa mwanachama...")}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-chart-2/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-chart-2">
              <WalletCards className="h-3.5 w-3.5" />
              {tt("Member Wallet", "Mkoba wa Mwanachama")}
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">{member.first_name} {member.last_name}</h1>
            <p className="text-sm text-muted-foreground">
              {tt("Detailed wallet history for this member inside", "Historia ya kina ya mkoba wa mwanachama huyu ndani ya")} {selectedGroup.name}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as "csv" | "xls")}>
                <SelectTrigger className="h-8 rounded-full border-0 bg-transparent px-3">
                  <SelectValue placeholder={tt("CSV", "CSV")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">{tt("CSV export", "Hamisha CSV")}</SelectItem>
                  <SelectItem value="xls">{tt("Excel export", "Hamisha Excel")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="rounded-full" onClick={downloadStatement}>
                <Download className="mr-2 h-4 w-4" />
                {tt("Export", "Hamisha")}
              </Button>
            </div>
            <Button variant="outline" className="rounded-full" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/group/${groupId}/wallet`}>{tt("Back to wallet", "Rudi kwenye mkoba")}</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={`/group/${groupId}`}>{tt("Back to dashboard", "Rudi kwenye dashibodi")}</Link>
            </Button>
          </div>
        </div>

        <section className="rounded-3xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-md print:border-black print:bg-white print:shadow-none">
          <div className="flex items-center justify-between gap-3 print:mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground print:text-black">{tt("Wallet Statement", "Taarifa ya Mkoba")}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight print:text-black">{member.first_name} {member.last_name}</h2>
              <p className="text-sm text-muted-foreground print:text-black">
                {selectedGroup.name} {tt("member wallet statement", "taarifa ya mkoba wa mwanachama")}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-2 text-right print:border-black">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground print:text-black">{tt("Net Balance", "Salio Halisi")}</p>
              <p className="mt-1 text-xl font-extrabold print:text-black">{formatTzs(wallet?.net_balance ?? 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
            <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md print:border-black print:bg-white print:shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground print:text-black">{tt("Savings", "Akiba")}</p>
                <p className="mt-2 text-3xl font-extrabold text-chart-1 print:text-black">{formatTzs(wallet?.savings_balance ?? totals.totalContributions)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md print:border-black print:bg-white print:shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground print:text-black">{tt("Loan Outstanding", "Deni la Mkopo")}</p>
                <p className="mt-2 text-3xl font-extrabold text-destructive print:text-black">{formatTzs(wallet?.loan_outstanding ?? totals.totalLoanBalance)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md print:border-black print:bg-white print:shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground print:text-black">{tt("Fine Outstanding", "Deni la Faini")}</p>
                <p className="mt-2 text-3xl font-extrabold text-amber-500 print:text-black">{formatTzs(wallet?.fine_outstanding ?? totals.totalFineBalance)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md print:border-black print:bg-white print:shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground print:text-black">{tt("Net Balance", "Salio Halisi")}</p>
                <p className="mt-2 text-3xl font-extrabold print:text-black">{formatTzs(wallet?.net_balance ?? 0)}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr] print:hidden">
          <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-0">
              <div className="border-b border-border/80 px-6 py-5">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-bold">{tt("Contributions", "Michango")}</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tt("Savings recorded for this member in the group.", "Akiba zilizorekodiwa kwa mwanachama huyu kwenye kikundi.")}</p>
              </div>
              <div className="space-y-3 p-6">
                {contributions.length > 0 ? contributions.map((item) => (
                  <div key={item.uuid} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{tt(item.status, item.status)}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(item.paid_at)}</p>
                        {item.reference ? <p className="text-[11px] text-muted-foreground">{tt("Ref", "Kumb.")} {item.reference}</p> : null}
                      </div>
                      <p className="font-bold text-chart-1">{formatTzs(Number(item.amount))}</p>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                    {tt("No contributions recorded for this member.", "Hakuna michango iliyorekodiwa kwa mwanachama huyu.")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-0">
              <div className="border-b border-border/80 px-6 py-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-bold">{tt("Loans & Fines", "Mikopo na Faini")}</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tt("Borrowing and penalty summary for this member.", "Muhtasari wa kukopa na adhabu kwa mwanachama huyu.")}</p>
              </div>
              <div className="space-y-4 p-6">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{tt("Loans", "Mikopo")}</p>
                  <p className="mt-2 text-lg font-bold">{loans.length} {tt("loan(s)", "mkopo")}</p>
                  <p className="text-sm text-muted-foreground">{tt("Borrowed", "Amechukua")} {formatTzs(totals.totalBorrowed)} {tt("total principal.", "jumla ya mtaji.")}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{tt("Fines", "Faini")}</p>
                  <p className="mt-2 text-lg font-bold">{fines.length} {tt("fine(s)", "faini")}</p>
                  <p className="text-sm text-muted-foreground">{tt("Outstanding balance", "Salio lililobaki")} {formatTzs(totals.totalFineBalance)}.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{tt("Payments", "Malipo")}</p>
                  <p className="mt-2 text-lg font-bold">{loanPayments.length + finePayments.length} {tt("payment(s)", "malipo")}</p>
                  <p className="text-sm text-muted-foreground">{tt("Repayments and fine settlements logged for the member.", "Marejesho na malipo ya faini yamehifadhiwa kwa mwanachama.")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card/60 shadow-sm backdrop-blur-md print:hidden">
          <div className="border-b border-border/80 px-6 py-5">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold">{tt("Wallet Timeline", "Mfuatano wa Mkoba")}</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {tt("Combined contribution, loan, repayment, and fine activity for this member.", "Shughuli za michango, mikopo, marejesho, na faini kwa mwanachama huyu.")}
            </p>
          </div>

          <div className="space-y-3 p-6">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                {tt("Loading member timeline...", "Inapakia mfuatano wa mwanachama...")}
              </div>
            ) : timeline.length > 0 ? (
              timeline.map((item) => (
                <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl p-2 ${item.positive ? "bg-chart-1/10 text-chart-1" : "bg-destructive/10 text-destructive"}`}>
                      {item.positive ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(item.happenedAt)}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">
                          {item.type.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <p className={`mt-2 text-sm font-bold ${item.positive ? "text-chart-1" : "text-destructive"}`}>
                        {item.positive ? "+" : "-"}{formatTzs(item.amount)}
                      </p>
                      {item.note ? <p className="mt-1 text-sm text-muted-foreground">{item.note}</p> : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                {tt("No wallet timeline items found for this member.", "Hakuna vipengele vya mfuatano wa mkoba kwa mwanachama huyu.")}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
