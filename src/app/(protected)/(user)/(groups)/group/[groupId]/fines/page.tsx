"use client"

import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertCircle,
  CalendarRange,
  Clock3,
  Coins,
  FileText,
  HandCoins,
  ReceiptText,
  WalletCards,
} from "lucide-react"
import {
  financeServices,
  type Fine,
  type FinePayment,
} from "@/api/services/finance.service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { formatTzs } from "@/lib/vikoba-finance"

type FinePaymentFormState = {
  fine_id: string
  amount: string
  reference: string
  note: string
}

const defaultPaymentFormState: FinePaymentFormState = {
  fine_id: "",
  amount: "",
  reference: "",
  note: "",
}

const fineStatusVariants: Record<Fine["status"], "default" | "secondary"> = {
  UNPAID: "secondary",
  PAID: "default",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-TZ", {
    dateStyle: "medium",
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-TZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getFineStatusLabel(status: Fine["status"]) {
  return status.toLowerCase()
}

function getErrorMessage(error: unknown): string {
  const errorResponse = (error as {
    response?: {
      data?: {
        detail?: string
        non_field_errors?: string[]
        fine_id?: string[]
        amount?: string[]
        reference?: string[]
        note?: string[]
        group_uuid?: string[]
      }
    }
  })?.response?.data

  return (
    errorResponse?.detail ||
    errorResponse?.non_field_errors?.[0] ||
    errorResponse?.fine_id?.[0] ||
    errorResponse?.amount?.[0] ||
    errorResponse?.reference?.[0] ||
    errorResponse?.note?.[0] ||
    errorResponse?.group_uuid?.[0] ||
    (error instanceof Error ? error.message : "Something went wrong while loading fines.")
  )
}

export default function GroupFinesPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const user = useAuthUserStore((state) => state.user)

  const [fines, setFines] = useState<Fine[]>([])
  const [payments, setPayments] = useState<FinePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentForm, setPaymentForm] = useState<FinePaymentFormState>(defaultPaymentFormState)

  const currentMembership = selectedGroupMembers.find((member) => member.user_id === user?.uuid)
  const isVerifiedMember = Boolean(currentMembership?.is_active && currentMembership?.is_verified)
  const canManageFines = Boolean(
    isVerifiedMember &&
      (currentMembership?.role === "CHAIRPERSON" ||
        currentMembership?.role === "SECRETARY" ||
        currentMembership?.role === "TREASURER")
  )

  const stats = useMemo(() => {
    const totalAmount = fines.reduce((sum, fine) => sum + Number(fine.amount || 0), 0)
    const outstandingBalance = fines.reduce((sum, fine) => sum + Number(fine.balance || 0), 0)
    const unpaidCount = fines.filter((fine) => fine.status === "UNPAID").length
    const paidCount = fines.filter((fine) => fine.status === "PAID").length

    return {
      totalAmount,
      outstandingBalance,
      unpaidCount,
      paidCount,
    }
  }, [fines])

  useEffect(() => {
    if (!groupId) return

    let isCancelled = false

    const loadFines = async () => {
      setLoading(true)
      setError(null)

      try {
        const [finesResponse, paymentsResponse] = await Promise.all([
          financeServices.getFines(groupId),
          financeServices.getFinePayments(groupId),
        ])

        if (!isCancelled) {
          setFines(finesResponse.data)
          setPayments(paymentsResponse.data)
        }
      } catch (loadError: unknown) {
        if (!isCancelled) {
          setError(getErrorMessage(loadError))
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void loadFines()

    return () => {
      isCancelled = true
    }
  }, [groupId])

  const resetPaymentForm = () => {
    setPaymentForm(defaultPaymentFormState)
  }

  const openPaymentModal = (fine?: Fine) => {
    setFeedback(null)
    setError(null)
    setPaymentForm({
      fine_id: fine?.uuid || fines[0]?.uuid || "",
      amount: fine?.balance || fines[0]?.balance || "",
      reference: "",
      note: fine ? `Payment received for ${fine.reason}` : fines[0] ? `Payment received for ${fines[0].reason}` : "",
    })
    setIsPaymentModalOpen(true)
  }

  const closePaymentModal = () => {
    if (paymentSubmitting) return
    resetPaymentForm()
    setIsPaymentModalOpen(false)
  }

  const handlePaymentInputChange = (field: keyof FinePaymentFormState, value: string) => {
    setPaymentForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!groupId) {
      setError("Missing group context for this page.")
      return
    }

    setPaymentSubmitting(true)
    setFeedback(null)
    setError(null)

    try {
      const response = await financeServices.createFinePayment({
        group_id: groupId,
        fine_id: paymentForm.fine_id,
        amount: paymentForm.amount.trim(),
        reference: paymentForm.reference.trim(),
        note: paymentForm.note.trim(),
      })

      setPayments((current) => [response.data, ...current])
      setFines((current) =>
        current.map((fine) =>
          fine.uuid === paymentForm.fine_id
            ? {
                ...fine,
                total_paid: String(Number(fine.total_paid || 0) + Number(paymentForm.amount || 0)),
                balance: String(Math.max(0, Number(fine.balance || 0) - Number(paymentForm.amount || 0))),
                status: Math.max(0, Number(fine.balance || 0) - Number(paymentForm.amount || 0)) <= 0 ? "PAID" : fine.status,
              }
            : fine
        )
      )
      setFeedback("Fine payment recorded successfully.")
      resetPaymentForm()
      setIsPaymentModalOpen(false)
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError))
    } finally {
      setPaymentSubmitting(false)
    }
  }

  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <Card className="border-none bg-card shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading group...
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-screen-3xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-md">
          <div className="absolute inset-0 bg-primary opacity-10" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500 shadow-sm">
                  <FileText className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 uppercase tracking-[0.18em]">
                  {canManageFines ? "Finance operations" : "Member view"}
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Fines and payments
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {canManageFines
                  ? "Track penalties, collect payments, and keep the fine ledger aligned with the transaction history."
                  : "Review your group fines, balances, and payment history in one place."}
              </p>
            </div>

            {canManageFines ? (
              <Button onClick={() => openPaymentModal()} disabled={fines.length === 0}>
                <HandCoins className="h-4 w-4" />
                Record payment
              </Button>
            ) : null}
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-4">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Total fines
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{fines.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Outstanding balance
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(stats.outstandingBalance)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Unpaid fines
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{stats.unpaidCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Payments logged
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{payments.length}</p>
            </CardContent>
          </Card>
        </div>

        {feedback ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {feedback}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Tabs defaultValue="fines" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-card/70">
            <TabsTrigger value="fines" className="gap-2">
              <CalendarRange className="h-4 w-4" />
              Fines
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <ReceiptText className="h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fines">
            <Card className="border-border/70 bg-card/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                      Fine ledger
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      Group fines
                    </h2>
                  </div>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading fines...</div>
                ) : fines.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                      <Coins className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-foreground">No fines recorded yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Fine balances and payment tracking will appear here once the group starts issuing penalties.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fines.map((fine) => (
                      <Card key={fine.uuid} className="border-border/70 bg-background/70 shadow-none">
                        <CardContent className="p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-bold tracking-tight text-foreground">
                                  {fine.reason}
                                </h3>
                                <Badge variant={fineStatusVariants[fine.status]} className="uppercase">
                                  {getFineStatusLabel(fine.status)}
                                </Badge>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-border/70 bg-card/60 p-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Fine amount
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-foreground">
                                    {formatTzs(Number(fine.amount))}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-card/60 p-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Paid
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-foreground">
                                    {formatTzs(Number(fine.total_paid))}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-card/60 p-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Balance
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-foreground">
                                    {formatTzs(Number(fine.balance))}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span>{fine.member_name || "Unnamed member"}</span>
                                <span className="inline-flex items-center gap-2">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  Due {formatDate(fine.due_date)}
                                </span>
                                <span>Issued {formatDate(fine.issued_at)}</span>
                              </div>
                            </div>

                            {canManageFines && Number(fine.balance) > 0 ? (
                              <Button variant="outline" onClick={() => openPaymentModal(fine)}>
                                <HandCoins className="h-4 w-4" />
                                Record payment
                              </Button>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-border/70 bg-card/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-chart-3">
                    Payment history
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    Fine payment records
                  </h2>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading payments...</div>
                ) : payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-3/10 text-chart-3">
                      <ReceiptText className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-foreground">No payments logged yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Fine payments recorded by leaders will appear here together with their references and timestamps.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <Card key={payment.uuid} className="border-border/70 bg-background/70 shadow-none">
                        <CardContent className="p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-bold tracking-tight text-foreground">
                                  {payment.fine_reason}
                                </h3>
                                <Badge variant="secondary">Payment</Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {formatTzs(Number(payment.amount))}
                                </span>
                                <span>{formatDateTime(payment.paid_at)}</span>
                                <span>{payment.received_by_name || "System"}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {payment.reference ? `Reference: ${payment.reference}` : "No payment reference supplied."}
                              </p>
                            </div>

                            {payment.note ? (
                              <div className="rounded-2xl border border-border/70 bg-card/60 p-3 text-sm text-muted-foreground sm:max-w-md">
                                {payment.note}
                              </div>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isPaymentModalOpen} onOpenChange={(open) => { if (!open) closePaymentModal() }}>
        <DialogContent className="sm:max-w-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Record fine payment</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Capture the amount received, who recorded it, and the payment reference.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handlePaymentSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fine-id">Fine</FieldLabel>
                <FieldContent>
                  <Select
                    value={paymentForm.fine_id}
                    onValueChange={(value) => handlePaymentInputChange("fine_id", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a fine" />
                    </SelectTrigger>
                    <SelectContent>
                      {fines.map((fine) => (
                        <SelectItem key={fine.uuid} value={fine.uuid}>
                          {fine.reason} - {fine.member_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Choose the fine you want to mark as paid.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="fine-amount">Amount received (TZS)</FieldLabel>
                <FieldContent>
                  <Input
                    id="fine-amount"
                    inputMode="decimal"
                    min="0"
                    placeholder="20000"
                    value={paymentForm.amount}
                    onChange={(event) => handlePaymentInputChange("amount", event.target.value)}
                    required
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="fine-reference">Reference</FieldLabel>
                <FieldContent>
                  <Input
                    id="fine-reference"
                    placeholder="Receipt or mobile money ref"
                    value={paymentForm.reference}
                    onChange={(event) => handlePaymentInputChange("reference", event.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="fine-note">Note</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="fine-note"
                    placeholder="Optional payment note"
                    value={paymentForm.note}
                    onChange={(event) => handlePaymentInputChange("note", event.target.value)}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={closePaymentModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={paymentSubmitting}>
                <WalletCards className="h-4 w-4 mr-2" />
                {paymentSubmitting ? "Recording..." : "Record payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
