"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  LoaderCircle,
  LockKeyhole,
  Send,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react"
import { toast } from "react-toastify"

import {
  paymentServices,
  type LoanPayoutPreview,
} from "@/api/services/payment.service"
import { useLanguage } from "@/components/language/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatTzs } from "@/lib/vikoba-finance"


type PayoutStatus = "IDLE" | "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "REVERSED"

function errorMessage(error: unknown) {
  const detail = (error as { response?: { data?: { detail?: string } } })
    ?.response?.data?.detail
  return detail || (error instanceof Error ? error.message : "Unable to process the payout.")
}

function maskPhone(phone: string) {
  return phone.length > 7
    ? `${phone.slice(0, 5)}•••${phone.slice(-4)}`
    : phone
}

export default function LoanPayoutPage() {
  const params = useParams<{ groupId: string; loanId: string }>()
  const router = useRouter()
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => (language === "sw" ? sw : en)
  const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId
  const loanId = Array.isArray(params.loanId) ? params.loanId[0] : params.loanId

  const [preview, setPreview] = useState<LoanPayoutPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [transactionUuid, setTransactionUuid] = useState<string | null>(null)
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus>("IDLE")
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let active = true

    async function loadPreview() {
      try {
        const response = await paymentServices.previewLoanPayout(loanId)
        if (active) setPreview(response.data)
      } catch (error) {
        if (active) setLoadError(errorMessage(error))
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadPreview()
    return () => {
      active = false
    }
  }, [loanId])

  useEffect(() => {
    if (!transactionUuid || !["PENDING", "PROCESSING"].includes(payoutStatus)) {
      return
    }

    let attempts = 0
    const maxAttempts = 30

    const poll = window.setInterval(async () => {
      try {
        attempts++
        const response = await paymentServices.getTransactionStatus(transactionUuid)
        const nextStatus = response.data.status as PayoutStatus
        setPayoutStatus(nextStatus)
        if (nextStatus === "SUCCESS") {
          toast.success(
            language === "sw"
              ? "Fedha za mkopo zimetumwa kwa mafanikio."
              : "Loan money was sent successfully."
          )
        }
        if (["FAILED", "REVERSED", "CANCELLED", "EXPIRED"].includes(nextStatus)) {
          toast.error(
            language === "sw"
              ? "Malipo hayakukamilika. Fedha za kikundi zimerejeshwa."
              : "The payout was not completed. Group funds were restored."
          )
        }
        if (attempts >= maxAttempts) {
          window.clearInterval(poll)
        }
      } catch {
        // Keep polling; the gateway or network may be briefly unavailable.
      }
    }, 10000)

    return () => window.clearInterval(poll)
  }, [language, payoutStatus, transactionUuid])

  async function releaseMoney() {
    if (!confirmed) return
    setSubmitting(true)
    try {
      const response = await paymentServices.initiateLoanPayout(loanId)
      setTransactionUuid(response.data.transaction_uuid)
      setPayoutStatus(response.data.status as PayoutStatus)
      toast.info(tt("Payout submitted to ClickPesa.", "Malipo yametumwa ClickPesa."))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-chart-1" />
      </div>
    )
  }

  if (loadError || !preview) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="border-destructive/25 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <CircleAlert className="h-10 w-10 text-destructive" />
            <h1 className="text-xl font-bold">{tt("Payout preview unavailable", "Muhtasari wa malipo haupatikani")}</h1>
            <p className="max-w-lg text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tt("Back to loans", "Rudi kwenye mikopo")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isFinished = ["SUCCESS", "FAILED", "REVERSED"].includes(payoutStatus)
  const isProcessing = ["PENDING", "PROCESSING"].includes(payoutStatus)

  return (
    <div className="relative min-h-full overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_5%,hsl(var(--chart-1)/0.12),transparent_34%),radial-gradient(circle_at_88%_20%,hsl(var(--chart-3)/0.10),transparent_30%)]" />
      <div className="mx-auto max-w-5xl space-y-6">
        <Button variant="ghost" className="-ml-3 rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tt("Back to loans", "Rudi kwenye mikopo")}
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <Card className="overflow-hidden border-border/70 bg-card/90 shadow-xl shadow-chart-1/5">
            <div className="border-b border-border/70 bg-gradient-to-br from-chart-1/15 via-card to-chart-3/10 p-6 sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <Badge className="rounded-full bg-chart-1/15 text-chart-1 hover:bg-chart-1/15">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  {tt("Treasurer confirmation", "Uthibitisho wa mweka hazina")}
                </Badge>
                <LockKeyhole className="h-5 w-5 text-muted-foreground" />
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {tt("Release loan money", "Toa fedha za mkopo")}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                {tt(
                  "Review the beneficiary, fee, and wallet balance. The loan activates only after ClickPesa confirms delivery.",
                  "Kagua mpokeaji, ada na salio la pochi. Mkopo utaanza baada ya ClickPesa kuthibitisha fedha zimefika."
                )}
              </p>
            </div>

            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">{tt("Beneficiary", "Mpokeaji")}</p>
                  <p className="mt-2 font-bold">{preview.borrower_name}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">{tt("Mobile wallet", "Pochi ya simu")}</p>
                  <p className="mt-2 flex items-center gap-2 font-bold">
                    <Smartphone className="h-4 w-4 text-chart-1" />
                    {maskPhone(preview.phone_number)}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-chart-1/20 bg-chart-1/5 p-5">
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{tt("Loan principal", "Kiasi cha mkopo")}</span>
                  <strong>{formatTzs(Number(preview.amount))}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-chart-1/15 py-2 text-sm">
                  <span className="text-muted-foreground">{tt("ClickPesa fee", "Ada ya ClickPesa")}</span>
                  <strong>{formatTzs(Number(preview.fee))}</strong>
                </div>
                <div className="flex items-end justify-between gap-4 pt-5">
                  <span className="font-semibold">{tt("Total wallet debit", "Jumla itakayotoka")}</span>
                  <strong className="text-2xl font-black text-chart-1">{formatTzs(Number(preview.total_debit))}</strong>
                </div>
              </div>

              {!isFinished && !isProcessing && (
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/80 p-4 transition-colors hover:bg-muted/35">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                  />
                  <span className="text-sm leading-6">
                    {tt(
                      "I have verified the member, mobile number, amount, and fee. I authorize this real-money payout.",
                      "Nimethibitisha mwanachama, namba ya simu, kiasi na ada. Ninaruhusu malipo haya ya fedha halisi."
                    )}
                  </span>
                </label>
              )}

              {isProcessing && (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm">
                  <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-amber-700" />
                  {tt("ClickPesa is processing the transfer. Keep this page open.", "ClickPesa inashughulikia uhamisho. Acha ukurasa huu wazi.")}
                </div>
              )}

              {payoutStatus === "SUCCESS" && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-600/25 bg-emerald-600/10 p-4 text-sm text-emerald-800">
                  <BadgeCheck className="h-6 w-6 shrink-0" />
                  {tt("Transfer confirmed. The loan is active and its repayment schedule is ready.", "Uhamisho umethibitishwa. Mkopo umeanza na ratiba ya marejesho ipo tayari.")}
                </div>
              )}

              {["FAILED", "REVERSED"].includes(payoutStatus) && (
                <div className="flex items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
                  <CircleAlert className="h-6 w-6 shrink-0" />
                  {tt("The transfer did not complete. No loan was activated and reserved funds were restored.", "Uhamisho haukukamilika. Mkopo haujaanza na fedha zilizohifadhiwa zimerejeshwa.")}
                </div>
              )}

              <Button
                size="lg"
                className="h-12 w-full rounded-2xl font-bold"
                disabled={!confirmed || submitting || isProcessing || isFinished}
                onClick={() => void releaseMoney()}
              >
                {submitting || isProcessing ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isProcessing
                  ? tt("Waiting for confirmation", "Inasubiri uthibitisho")
                  : tt("Release money with ClickPesa", "Toa fedha kupitia ClickPesa")}
              </Button>

              {isFinished && (
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-2xl"
                  onClick={() => router.push(`/group/${groupId}/loans`)}
                >
                  {tt("Return to loan ledger", "Rudi kwenye leja ya mikopo")}
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border/70 bg-card/80">
              <CardContent className="space-y-5 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-chart-3/15 text-chart-3">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">{tt("Group ClickPesa cash", "Fedha za kikundi ClickPesa")}</p>
                  <p className="mt-2 text-2xl font-black">{formatTzs(Number(preview.group_wallet_balance))}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{tt("Available for real gateway payouts", "Zinazopatikana kwa malipo halisi")}</p>
                </div>
                <div className="border-t border-border/70 pt-4">
                  <p className="text-xs text-muted-foreground">{tt("Internal finance wallet", "Pochi ya ndani ya fedha")}</p>
                  <p className="mt-1 font-bold">{formatTzs(Number(preview.finance_wallet_balance))}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-chart-1/20 bg-chart-1/5">
              <CardContent className="p-6">
                <h2 className="font-bold">{tt("What happens next?", "Nini kitafuata?")}</h2>
                <ol className="mt-4 space-y-4 text-sm text-muted-foreground">
                  <li className="flex gap-3"><span className="font-black text-chart-1">1</span>{tt("Funds are reserved to prevent duplicate payouts.", "Fedha zinahifadhiwa kuzuia malipo kurudiwa.")}</li>
                  <li className="flex gap-3"><span className="font-black text-chart-1">2</span>{tt("ClickPesa sends money to the member wallet.", "ClickPesa inatuma fedha kwenye pochi ya mwanachama.")}</li>
                  <li className="flex gap-3"><span className="font-black text-chart-1">3</span>{tt("Only a successful transfer activates the loan.", "Uhamisho uliofanikiwa pekee ndio huanzisha mkopo.")}</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
