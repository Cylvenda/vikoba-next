"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { BarChart3, CalendarRange, Download, FileSpreadsheet, FileText, TrendingDown, TrendingUp, WalletCards } from "lucide-react"
import { useFinanceStore } from "@/store/finance/finance.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useLanguage } from "@/components/language/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatTzs } from "@/lib/vikoba-finance"
import { exportRowsAsCsv, exportRowsAsDocx, exportRowsAsXlsx, type ReportRow } from "@/lib/report-export"
import { financeServices } from "@/api/services/finance.service"
import type { VikobaFinanceSnapshot } from "@/lib/vikoba-finance"

type PeriodMode = "all" | "month" | "range"
type ExportFormat = "xlsx" | "csv" | "word"

const INFLOW_TYPES = new Set(["CONTRIBUTION", "LOAN_REPAYMENT", "FINE_PAYMENT"])
const OUTFLOW_TYPES = new Set(["LOAN_DISBURSEMENT"])

export default function FinancialAnalyticsPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { selectedGroup } = useGroupStore()
  const { snapshot, fetchSnapshot, isLoading } = useFinanceStore()
  const { language } = useLanguage()
  const tt = useCallback((en: string, sw: string) => language === "sw" ? sw : en, [language])
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month")
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx")
  const [reportSnapshot, setReportSnapshot] = useState<VikobaFinanceSnapshot | null>(null)

  useEffect(() => {
    if (groupId) void fetchSnapshot(groupId)
  }, [fetchSnapshot, groupId])

  useEffect(() => {
    if (!groupId) return

    const params =
      periodMode === "month"
        ? { month }
        : periodMode === "range"
          ? { date_from: dateFrom || undefined, date_to: dateTo || undefined }
          : { all_activity: true }

    let cancelled = false
    void financeServices.getFinancialSnapshot(groupId, params).then((response) => {
      if (!cancelled) setReportSnapshot(response.data)
    })

    return () => {
      cancelled = true
    }
  }, [dateFrom, dateTo, groupId, month, periodMode])

  const filteredActivity = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null

    return (reportSnapshot?.recentActivity ?? snapshot?.recentActivity ?? [])
      .filter((item) => {
        const happenedAt = new Date(item.happenedAt)
        if (periodMode === "month") return item.happenedAt.slice(0, 7) === month
        if (periodMode === "range") {
          return (!from || happenedAt >= from) && (!to || happenedAt <= to)
        }
        return true
      })
      .sort((left, right) => new Date(right.happenedAt).getTime() - new Date(left.happenedAt).getTime())
  }, [dateFrom, dateTo, month, periodMode, reportSnapshot?.recentActivity, snapshot?.recentActivity])

  const analytics = useMemo(() => {
    const byType = filteredActivity.reduce<Record<string, number>>((result, item) => {
      result[item.type] = (result[item.type] ?? 0) + Number(item.amount || 0)
      return result
    }, {})
    const inflow = Object.entries(byType).reduce(
      (total, [type, amount]) => total + (INFLOW_TYPES.has(type) ? amount : 0),
      0,
    )
    const outflow = Object.entries(byType).reduce(
      (total, [type, amount]) => total + (OUTFLOW_TYPES.has(type) ? amount : 0),
      0,
    )

    return { byType, inflow, outflow, netMovement: inflow - outflow }
  }, [filteredActivity])

  const categoryRows = useMemo(() => [
    { type: "CONTRIBUTION", label: tt("Savings contributions", "Michango ya akiba"), color: "bg-chart-1" },
    { type: "LOAN_REPAYMENT", label: tt("Loan repayments", "Marejesho ya mikopo"), color: "bg-chart-2" },
    { type: "FINE_PAYMENT", label: tt("Fine payments", "Malipo ya faini"), color: "bg-chart-3" },
    { type: "LOAN_DISBURSEMENT", label: tt("Loan disbursements", "Mikopo iliyotolewa"), color: "bg-destructive" },
  ], [tt])
  const maximumCategoryAmount = Math.max(1, ...categoryRows.map((row) => analytics.byType[row.type] ?? 0))

  const periodLabel =
    periodMode === "all"
      ? tt("All available dates", "Tarehe zote zilizopo")
      : periodMode === "month"
        ? month
        : `${dateFrom || "…"} – ${dateTo || "…"}`

  const reportRows = useMemo<ReportRow[]>(() => [
    [tt("Financial Analytics Report", "Ripoti ya Uchambuzi wa Fedha")],
    [tt("Group", "Kikundi"), selectedGroup?.name ?? ""],
    [tt("Period", "Kipindi"), periodLabel],
    [tt("Generated", "Imetengenezwa"), new Date().toLocaleString(language === "sw" ? "sw-TZ" : "en-TZ")],
    [],
    [tt("Summary", "Muhtasari"), tt("Amount (TZS)", "Kiasi (TZS)")],
    [tt("Total inflow", "Jumla ya fedha zinazoingia"), analytics.inflow],
    [tt("Total outflow", "Jumla ya fedha zinazotoka"), analytics.outflow],
    [tt("Net movement", "Mabadiliko halisi"), analytics.netMovement],
    [tt("Current wallet balance", "Salio la sasa la mkoba"), snapshot?.groupWallet?.balance ?? snapshot?.availableCash ?? 0],
    [],
    [tt("Category", "Aina"), tt("Amount (TZS)", "Kiasi (TZS)")],
    ...categoryRows.map((row) => [row.label, analytics.byType[row.type] ?? 0]),
    [],
    [tt("Transaction Date", "Tarehe ya Muamala"), tt("Type", "Aina"), tt("Description", "Maelezo"), tt("Actor", "Mhusika"), tt("Status", "Hali"), tt("Amount (TZS)", "Kiasi (TZS)")],
    ...filteredActivity.map((item) => [
      new Date(item.happenedAt).toLocaleString(language === "sw" ? "sw-TZ" : "en-TZ"),
      item.type.replaceAll("_", " "),
      item.title,
      item.actor,
      item.status,
      Number(item.amount || 0),
    ]),
  ], [analytics, categoryRows, filteredActivity, language, periodLabel, selectedGroup?.name, snapshot, tt])

  const handleExport = () => {
    const baseName = `${selectedGroup?.name || "group"}-financial-report-${periodLabel}`
    if (exportFormat === "xlsx") {
      exportRowsAsXlsx(reportRows, baseName, tt("Financial Report", "Ripoti ya Fedha"))
    } else if (exportFormat === "word") {
      exportRowsAsDocx(reportRows, baseName, tt("Financial Analytics Report", "Ripoti ya Uchambuzi wa Fedha"))
    } else {
      exportRowsAsCsv(reportRows, baseName)
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <section className="rounded-3xl border border-border/80 bg-card/70 p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-chart-3/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-chart-3">
                <BarChart3 className="size-4" />
                {tt("Financial Analytics", "Uchambuzi wa Fedha")}
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                {selectedGroup?.name || tt("Group", "Kikundi")} {tt("Financial Report", "Ripoti ya Fedha")}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {tt("Filter financial activity by month or date range, review cash movement, and export a compatible report.", "Chuja shughuli za fedha kwa mwezi au tarehe, kagua mzunguko wa fedha, na pakua ripoti inayofunguka vizuri.")}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                <SelectTrigger className="h-11 w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="word">Microsoft Word (.docx)</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" className="h-11" onClick={handleExport} disabled={isLoading}>
                <Download className="size-4" />
                {tt("Export Report", "Pakua Ripoti")}
              </Button>
            </div>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="size-5 text-chart-3" />
              {tt("Report Period", "Kipindi cha Ripoti")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <Select value={periodMode} onValueChange={(value) => setPeriodMode(value as PeriodMode)}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{tt("Filter by month", "Chuja kwa mwezi")}</SelectItem>
                <SelectItem value="range">{tt("Custom date range", "Tarehe maalum")}</SelectItem>
                <SelectItem value="all">{tt("All dates", "Tarehe zote")}</SelectItem>
              </SelectContent>
            </Select>
            {periodMode === "month" ? (
              <Input className="h-11 md:col-span-2" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            ) : periodMode === "range" ? (
              <>
                <Input className="h-11" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label={tt("Start date", "Tarehe ya kuanza")} />
                <Input className="h-11" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label={tt("End date", "Tarehe ya mwisho")} />
              </>
            ) : null}
            <div className="flex items-center rounded-xl border border-border bg-muted/30 px-4 text-sm text-muted-foreground">
              {filteredActivity.length} {tt("transactions", "miamala")}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: tt("Total Inflow", "Fedha Zilizoingia"), value: analytics.inflow, icon: TrendingUp, tone: "text-emerald-600" },
            { label: tt("Total Outflow", "Fedha Zilizotoka"), value: analytics.outflow, icon: TrendingDown, tone: "text-destructive" },
            { label: tt("Net Movement", "Mabadiliko Halisi"), value: analytics.netMovement, icon: BarChart3, tone: "text-chart-3" },
            { label: tt("Current Balance", "Salio la Sasa"), value: snapshot?.groupWallet?.balance ?? snapshot?.availableCash ?? 0, icon: WalletCards, tone: "text-chart-2" },
          ].map((metric) => (
            <Card key={metric.label}>
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-xl font-black">{formatTzs(metric.value)}</p>
                </div>
                <metric.icon className={`size-5 ${metric.tone}`} />
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader><CardTitle>{tt("Cash Movement by Category", "Mzunguko wa Fedha kwa Aina")}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {categoryRows.map((row) => {
                const amount = analytics.byType[row.type] ?? 0
                return (
                  <div key={row.type}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span>{row.label}</span>
                      <span className="font-bold">{formatTzs(amount)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(amount / maximumCategoryAmount) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-chart-2" />
                {tt("Filtered Financial Activity", "Shughuli za Fedha Zilizochujwa")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredActivity.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  <FileText className="mx-auto mb-3 size-8" />
                  {tt("No financial activity exists for the selected period.", "Hakuna shughuli za fedha katika kipindi ulichochagua.")}
                </div>
              ) : (
                <div className="app-scrollbar overflow-x-auto">
                  <table className="min-w-[46rem] w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3">{tt("Date", "Tarehe")}</th>
                        <th className="px-3 py-3">{tt("Type", "Aina")}</th>
                        <th className="px-3 py-3">{tt("Description", "Maelezo")}</th>
                        <th className="px-3 py-3">{tt("Actor", "Mhusika")}</th>
                        <th className="px-3 py-3 text-right">{tt("Amount", "Kiasi")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredActivity.map((item) => (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap px-3 py-3">{new Date(item.happenedAt).toLocaleDateString(language === "sw" ? "sw-TZ" : "en-TZ")}</td>
                          <td className="whitespace-nowrap px-3 py-3">{item.type.replaceAll("_", " ")}</td>
                          <td className="max-w-xs truncate px-3 py-3">{item.title}</td>
                          <td className="px-3 py-3">{item.actor}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-right font-bold">{formatTzs(Number(item.amount || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
