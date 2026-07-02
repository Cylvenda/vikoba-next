"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Download,
  PiggyBank,
  ReceiptText,
  Users,
  WalletCards,
} from "lucide-react"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useFinanceStore } from "@/store/finance/finance.store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatTzs } from "@/lib/vikoba-finance"

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-TZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

const walletActionTypes = new Set([
  "CONTRIBUTION",
  "LOAN_DISBURSEMENT",
  "LOAN_REPAYMENT",
  "FINE_PAYMENT",
])

const actionFilters = [
  { key: "ALL", label: "All actions" },
  { key: "CONTRIBUTION", label: "Contributions" },
  { key: "LOAN_REPAYMENT", label: "Repayments" },
  { key: "FINE_PAYMENT", label: "Fines" },
  { key: "LOAN_DISBURSEMENT", label: "Disbursements" },
] as const

type ActionFilter = (typeof actionFilters)[number]["key"]

export default function GroupWalletPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const { snapshot, walletReport, fetchSnapshot, fetchWalletReport } = useFinanceStore()
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL")
  const [actionSearch, setActionSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [exportFormat, setExportFormat] = useState<"csv" | "xls">("csv")

  useEffect(() => {
    if (!groupId) return

    void fetchSnapshot(groupId)
    void fetchWalletReport(groupId)
  }, [fetchSnapshot, fetchWalletReport, groupId])

  const groupWallet = walletReport?.groupWallet ?? snapshot?.groupWallet
  const memberWallets = walletReport?.memberWallets ?? snapshot?.memberWallets ?? []

  const walletActions = useMemo(() => {
    return (snapshot?.recentActivity ?? [])
      .filter((action) => walletActionTypes.has(action.type))
      .slice()
      .sort((left, right) => new Date(right.happenedAt).getTime() - new Date(left.happenedAt).getTime())
  }, [snapshot?.recentActivity])

  const filteredWalletActions = useMemo(() => {
    const normalizedSearch = actionSearch.trim().toLowerCase()
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null

    return walletActions.filter((action) => {
      const matchesType = actionFilter === "ALL" || action.type === actionFilter
      const haystack = `${action.title} ${action.actor} ${action.type}`.toLowerCase()
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
      const happenedAt = new Date(action.happenedAt)
      const matchesFrom = !fromDate || happenedAt >= fromDate
      const matchesTo = !toDate || happenedAt <= toDate

      return matchesType && matchesSearch && matchesFrom && matchesTo
    })
  }, [actionFilter, actionSearch, dateFrom, dateTo, walletActions])

  const totals = useMemo(() => {
    const savings = snapshot?.totalSavings ?? 0
    const repayments = groupWallet?.totalLoanRepayments ?? 0
    const fines = groupWallet?.totalFinesCollected ?? 0
    const disbursed = groupWallet?.totalLoanDisbursed ?? 0
    return {
      inflow: savings + repayments + fines,
      outflow: disbursed,
      balance: groupWallet?.balance ?? snapshot?.availableCash ?? 0,
    }
  }, [groupWallet, snapshot])

  const actionStats = useMemo(() => {
    const totalsByType = filteredWalletActions.reduce(
      (acc, action) => {
        acc.count += 1
        acc.amount += Number(action.amount || 0)
        acc[action.type] = (acc[action.type] || 0) + Number(action.amount || 0)
        return acc
      },
      {
        count: 0,
        amount: 0,
        CONTRIBUTION: 0,
        LOAN_DISBURSEMENT: 0,
        LOAN_REPAYMENT: 0,
        FINE_PAYMENT: 0,
      } as Record<string, number>,
    )

    return totalsByType
  }, [filteredWalletActions])

  const walletsCount = memberWallets.length || selectedGroupMembers.length
  const getWalletMembershipUuid = (wallet: (typeof memberWallets)[number]) =>
    wallet.membershipUuid ?? (wallet as unknown as { membership_uuid?: string }).membership_uuid ?? ""

  const getWalletMemberName = (wallet: (typeof memberWallets)[number]) => {
    const directName = wallet.memberName ?? (wallet as unknown as { member_name?: string }).member_name
    if (directName && String(directName).trim()) {
      return directName
    }

    const membershipUuid = getWalletMembershipUuid(wallet)
    const matchedMember = selectedGroupMembers.find(
      (member) => member.membership_id === membershipUuid || member.id === membershipUuid,
    )

    if (matchedMember) {
      return `${matchedMember.first_name ?? ""} ${matchedMember.last_name ?? ""}`.trim() || matchedMember.email
    }

    return membershipUuid || "Member"
  }

  const exportWalletReport = () => {
    const reportRows = [
      ["Wallet Summary", "Value"],
      ["Group", selectedGroup.name],
      ["Balance", formatTzs(totals.balance)],
      ["Inflow", formatTzs(totals.inflow)],
      ["Outflow", formatTzs(totals.outflow)],
      ["Verified Savings", formatTzs(groupWallet?.totalVerifiedSavings ?? snapshot?.totalSavings ?? 0)],
      ["Loan Disbursed", formatTzs(groupWallet?.totalLoanDisbursed ?? 0)],
      ["Loan Repayments", formatTzs(groupWallet?.totalLoanRepayments ?? 0)],
      ["Fines Collected", formatTzs(groupWallet?.totalFinesCollected ?? 0)],
      [],
      ["Member Wallets"],
      ["Member", "Savings", "Loan Outstanding", "Fine Outstanding", "Net Balance"],
      ...memberWallets.map((wallet) => [
        getWalletMemberName(wallet),
        formatTzs(wallet.savingsBalance ?? (wallet as unknown as { savings_balance?: number }).savings_balance),
        formatTzs(wallet.loanOutstanding ?? (wallet as unknown as { loan_outstanding?: number }).loan_outstanding),
        formatTzs(wallet.fineOutstanding ?? (wallet as unknown as { fine_outstanding?: number }).fine_outstanding),
        formatTzs(wallet.netBalance ?? (wallet as unknown as { net_balance?: number }).net_balance),
      ]),
      [],
      ["Wallet Actions"],
      ["Type", "Actor", "Amount", "Date", "Title"],
      ...filteredWalletActions.map((action) => [
        action.type.replaceAll("_", " "),
        action.actor,
        formatTzs(action.amount),
        formatDateTime(action.happenedAt),
        action.title,
      ]),
    ]

    const csvEscape = (value: string | number | null | undefined) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`

    const buildCsv = () =>
      reportRows
        .map((row) =>
          row.length === 0 ? "" : row.map((cell) => csvEscape(cell)).join(",")
        )
        .join("\n")

    const buildXls = () => {
      const htmlRows = reportRows
        .map((row) => {
          if (row.length === 0) return "<tr><td></td></tr>"
          return `<tr>${row.map((cell) => `<td>${String(cell ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</td>`).join("")}</tr>`
        })
        .join("")

      return `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${htmlRows}</table></body></html>`
    }

    const fileBody = exportFormat === "xls" ? buildXls() : buildCsv()
    const mimeType = exportFormat === "xls" ? "application/vnd.ms-excel" : "text/csv;charset=utf-8"
    const extension = exportFormat === "xls" ? "xls" : "csv"
    const blob = new Blob([fileBody], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${selectedGroup.name.toLowerCase().replaceAll(" ", "-")}-wallet-report.${extension}`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="text-center text-muted-foreground animate-pulse font-medium">
          Loading wallet dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-screen-3xl space-y-6">
        <section className="rounded-3xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-chart-2/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-chart-2">
                <WalletCards className="h-3.5 w-3.5" />
                Wallet Center
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                {selectedGroup.name} Wallet
              </h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Track the group wallet, member wallets, and every wallet-moving action in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
                <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as "csv" | "xls")}>
                  <SelectTrigger className="h-8 rounded-full border-0 bg-transparent px-3">
                    <SelectValue placeholder="CSV" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV export</SelectItem>
                    <SelectItem value="xls">Excel export</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportWalletReport} className="rounded-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Balance</p>
                <p className="mt-2 text-lg font-extrabold">{formatTzs(totals.balance)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Inflow</p>
                <p className="mt-2 text-lg font-extrabold text-chart-1">{formatTzs(totals.inflow)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Outflow</p>
                <p className="mt-2 text-lg font-extrabold text-chart-3">{formatTzs(totals.outflow)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Wallets</p>
                <p className="mt-2 text-lg font-extrabold">{walletsCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-4">
          <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Group Wallet</p>
                  <p className="mt-2 text-3xl font-extrabold text-chart-3">{formatTzs(groupWallet?.balance ?? 0)}</p>
                </div>
                <div className="rounded-2xl bg-chart-2/10 p-3 text-chart-2">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">The actual group cash position available for lending.</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Verified Savings</p>
                  <p className="mt-2 text-3xl font-extrabold text-chart-3">
                    {formatTzs(groupWallet?.totalVerifiedSavings ?? snapshot?.totalSavings ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-chart-1/10 p-3 text-chart-1">
                  <PiggyBank className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Savings confirmed and counted into the wallet.</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Repayments + Fines</p>
                  <p className="mt-2 text-3xl font-extrabold text-chart-3">
                    {formatTzs((groupWallet?.totalLoanRepayments ?? 0) + (groupWallet?.totalFinesCollected ?? 0))}
                  </p>
                </div>
                <div className="rounded-2xl bg-chart-3/10 p-3 text-chart-3">
                  <ArrowDownRight className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Money flowing back into the group wallet.</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Loan Disbursements</p>
                  <p className="mt-2 text-3xl font-extrabold text-destructive">
                    {formatTzs(groupWallet?.totalLoanDisbursed ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Funds released from the group wallet to borrowers.</p>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full  grid-cols-2 rounded-md bg-card p-1">
            <TabsTrigger value="members" className="rounded-md">
              Wallet Members
            </TabsTrigger>
            <TabsTrigger value="actions" className="rounded-md">
              Wallet Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
              <CardContent className="p-0">
                <div className="border-b border-border/80 px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-bold">Member Wallets</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Per-member balances for savings, loan exposure, and fines inside the group.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-background/80">
                      <tr className="text-left text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        <th className="px-6 py-3">Member</th>
                        <th className="px-6 py-3">Savings</th>
                        <th className="px-6 py-3">Loan Outstanding</th>
                        <th className="px-6 py-3">Fine Outstanding</th>
                        <th className="px-6 py-3">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                {memberWallets.length > 0 ? (
                  memberWallets
                    .slice()
                    .sort(
                      (left, right) =>
                        (right.netBalance ?? (right as unknown as { net_balance?: number }).net_balance ?? 0) -
                        (left.netBalance ?? (left as unknown as { net_balance?: number }).net_balance ?? 0),
                    )
                    .map((wallet) => (
                      <tr key={getWalletMembershipUuid(wallet)} className="bg-card/20">
                        <td className="px-6 py-4">
                          <Link
                            href={`/group/${groupId}/wallet/members/${getWalletMembershipUuid(wallet)}`}
                            className="font-semibold text-foreground hover:text-primary"
                          >
                            {getWalletMemberName(wallet)}
                          </Link>
                                <p className="text-[11px] text-muted-foreground">
                                  {wallet.memberUserId ?? (wallet as unknown as { member_user_id?: string }).member_user_id}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {formatTzs(wallet.savingsBalance ?? (wallet as unknown as { savings_balance?: number }).savings_balance)}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {formatTzs(wallet.loanOutstanding ?? (wallet as unknown as { loan_outstanding?: number }).loan_outstanding)}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {formatTzs(wallet.fineOutstanding ?? (wallet as unknown as { fine_outstanding?: number }).fine_outstanding)}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold">
                                {formatTzs(wallet.netBalance ?? (wallet as unknown as { net_balance?: number }).net_balance)}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-sm text-muted-foreground">
                            No member wallet data yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Search and Filter</p>
                    <h3 className="text-xl font-bold">Find wallet actions</h3>
                    <p className="text-sm text-muted-foreground">
                      Search by member, action title, or transaction type, then narrow by date.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 xl:min-w-[48rem]">
                    <Input
                      value={actionSearch}
                      onChange={(event) => setActionSearch(event.target.value)}
                      placeholder="Search actions..."
                      className="rounded-full"
                    />
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(event) => setDateFrom(event.target.value)}
                      className="rounded-full"
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(event) => setDateTo(event.target.value)}
                      className="rounded-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
              <CardContent className="p-0">
                <div className="border-b border-border/80 px-6 py-5">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-bold">Wallet Actions</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Contributions, fines, repayments, and loan disbursements recorded in the ledger.
                  </p>
                </div>

                <div className="space-y-3 p-6">
                  <div className="flex flex-wrap gap-2">
                    {actionFilters.map((filter) => (
                      <Button
                        key={filter.key}
                        variant={actionFilter === filter.key ? "default" : "outline"}
                        size="sm"
                        className="rounded-full"
                        onClick={() => setActionFilter(filter.key)}
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Actions</p>
                      <p className="mt-2 text-2xl font-extrabold">{actionStats.count}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Action Value</p>
                      <p className="mt-2 text-2xl font-extrabold">{formatTzs(actionStats.amount)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredWalletActions.length > 0 ? (
                      filteredWalletActions.slice(0, 10).map((action) => {
                        const isInflow = action.type !== "LOAN_DISBURSEMENT"
                        const icon = isInflow ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )

                        const toneClass =
                          action.type === "CONTRIBUTION"
                            ? "bg-chart-1/10 text-chart-1"
                            : action.type === "LOAN_REPAYMENT"
                              ? "bg-chart-3/10 text-chart-3"
                              : action.type === "FINE_PAYMENT"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-destructive/10 text-destructive"

                        return (
                          <div key={action.id} className="rounded-2xl border border-border bg-background p-4">
                            <div className="flex items-start gap-3">
                              <div className={`rounded-xl p-2 ${toneClass}`}>{icon}</div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-foreground">{action.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {action.actor} · {formatDateTime(action.happenedAt)}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">
                                    {action.type.replaceAll("_", " ")}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-sm font-bold">{formatTzs(action.amount)}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                        No wallet actions match the current filter.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Contribution Inflow</p>
              <p className="mt-2 text-2xl font-extrabold text-chart-1">
                {formatTzs(actionStats.CONTRIBUTION)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Repayment Inflow</p>
              <p className="mt-2 text-2xl font-extrabold text-chart-3">
                {formatTzs(actionStats.LOAN_REPAYMENT)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Fine Inflow</p>
              <p className="mt-2 text-2xl font-extrabold text-amber-500">
                {formatTzs(actionStats.FINE_PAYMENT)}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
