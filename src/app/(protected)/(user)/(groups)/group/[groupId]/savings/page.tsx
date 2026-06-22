"use client"

import React from "react"
import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  PiggyBank,
  Plus,
  Receipt,
  RefreshCcw,
  Users,
  XCircle,
} from "lucide-react"
import { financeServices, type Contribution } from "@/api/services/finance.service"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { formatTzs } from "@/lib/vikoba-finance"

type ContributionFormState = {
  membership_id: string
  amount: string
  reference: string
  note: string
}

const defaultContributionFormState: ContributionFormState = {
  membership_id: "",
  amount: "",
  reference: "",
  note: "",
}

function getErrorMessage(error: unknown): string {
  const errorResponse = (error as {
    response?: {
      data?: {
        detail?: string
        non_field_errors?: string[]
        membership_id?: string[]
        amount?: string[]
        reference?: string[]
      }
    }
  })?.response?.data

  return (
    errorResponse?.detail ||
    errorResponse?.non_field_errors?.[0] ||
    errorResponse?.membership_id?.[0] ||
    errorResponse?.amount?.[0] ||
    errorResponse?.reference?.[0] ||
    (error instanceof Error ? error.message : "Something went wrong while saving this contribution.")
  )
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-TZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-4/10 text-chart-4">
        {icon}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function ContributionCard({
  contribution,
  action,
}: {
  contribution: Contribution
  action?: React.ReactNode
}) {
  const statusStyles: Record<string, string> = {
    VERIFIED: "border-chart-1/30 bg-chart-1/5 text-chart-1",
    PENDING: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
    REJECTED: "border-destructive/30 bg-destructive/5 text-destructive",
  }
  const statusIcons: Record<string, React.ReactNode> = {
    VERIFIED: <CheckCircle2 className="h-3.5 w-3.5" />,
    PENDING: <Clock className="h-3.5 w-3.5" />,
    REJECTED: <XCircle className="h-3.5 w-3.5" />,
  }
  const statusClass = statusStyles[contribution.status] ?? "border-border/60 bg-muted/20"
  const statusIcon = statusIcons[contribution.status]

  return (
    <Card className="border-border/70 bg-background/70 shadow-none">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-foreground">
                {contribution.member_name || "Unnamed member"}
              </h3>
              <Badge
                variant="outline"
                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${statusClass}`}
              >
                {statusIcon}
                {contribution.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {formatTzs(Number(contribution.amount))}
              </span>
            </div>

            {contribution.note ? (
              <p className="text-sm text-muted-foreground">{contribution.note}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <span>Logged {formatDateLabel(contribution.created_at)}</span>
              {contribution.reference ? <span>Ref {contribution.reference}</span> : null}
            </div>
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default function GroupSavingsPage() {
  const router = useRouter()
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const user = useAuthUserStore((state) => state.user)

  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"OWN" | "OTHERS" | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ContributionFormState>(defaultContributionFormState)

  const currentMembership = selectedGroupMembers.find((member) => member.user_id === user?.uuid)
  const canRecordContribution = Boolean(
    currentMembership?.is_active &&
      currentMembership?.is_verified &&
      ["CHAIRPERSON", "SECRETARY", "TREASURER"].includes(currentMembership.role)
  )

  const eligibleMembers = selectedGroupMembers.filter(
    (member) => member.is_active && member.is_verified
  )

  const verifiedContributions = contributions.filter((c) => c.status === "VERIFIED")
  const pendingContributions = contributions.filter((c) => c.status === "PENDING")
  const failedContributions = contributions.filter((c) => c.status === "REJECTED")

  const totalSavings = verifiedContributions.reduce(
    (sum, contribution) => sum + Number(contribution.amount),
    0
  )
  const selectedMember = eligibleMembers.find(
    (member) => member.membership_id === form.membership_id
  )

  useEffect(() => {
    if (!groupId) return

    let isCancelled = false

    const loadContributions = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await financeServices.getContributions(groupId)
        if (!isCancelled) {
          setContributions(response.data)
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

    void loadContributions()

    return () => {
      isCancelled = true
    }
  }, [groupId])

  const handleInputChange = (field: keyof ContributionFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setForm(defaultContributionFormState)
  }

  const closeContributionModal = () => {
    if (submitting) return
    resetForm()
    setModalMode(null)
    setIsContributionModalOpen(false)
  }

  const openModal = (mode: "OWN" | "OTHERS") => {
    setModalMode(mode)
    if (mode === "OWN" && currentMembership) {
      setForm((prev) => ({ ...prev, membership_id: currentMembership.membership_id }))
    }
    setIsContributionModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!groupId) {
      setError("Missing group context for this page.")
      return
    }

    setSubmitting(true)
    setFeedback(null)
    setError(null)

    try {
      const isMobileMoney = modalMode === "OWN"

      const response = await financeServices.createContribution({
        group_id: groupId,
        membership_id: form.membership_id,
        amount: form.amount.trim(),
        reference: form.reference.trim(),
        note: form.note.trim(),
        status: isMobileMoney ? "PENDING" : "VERIFIED",
      })

      const contribution = response.data

      // Step 2: Trigger mobile money collection redirect
      if (isMobileMoney) {
        setFeedback("Redirecting to secure payment page...")
        router.push(`/group/${groupId}/payment?type=saving&id=${contribution.uuid}&amount=${form.amount.trim()}`)
        return
      } else {
        setFeedback("Cash contribution recorded successfully.")
      }

      setContributions((current) => [contribution, ...current])
      setTimeout(() => {
        resetForm()
        setIsContributionModalOpen(false)
      }, 3000)
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-chart-4/15 text-chart-4 shadow-sm">
                  <PiggyBank className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 uppercase tracking-[0.18em]">
                  {canRecordContribution ? "Finance manager" : "Member view"}
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Savings and contribution ledger
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {canRecordContribution
                  ? "Review all savings activity for this group and record verified member deposits."
                  : "Review your recorded savings contributions and payment references."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
              {canRecordContribution ? (
                <>
                  <Button variant="outline" onClick={() => openModal("OWN")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add my saving
                  </Button>
                  <Button onClick={() => openModal("OTHERS")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add saving for others
                  </Button>
                </>
              ) : (
                <Button onClick={() => openModal("OWN")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add saving
                </Button>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {canRecordContribution ? "Total verified savings" : "My verified savings"}
              </p>
              <p className="mt-2 text-2xl font-bold text-chart-1">{formatTzs(totalSavings)}</p>
              <p className="mt-1 text-xs text-muted-foreground">From confirmed payments only</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Pending amount
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatTzs(pendingContributions.reduce((sum, c) => sum + Number(c.amount), 0))}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{pendingContributions.length} payment{pendingContributions.length !== 1 ? "s" : ""} awaiting confirmation</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Rejected
              </p>
              <p className="mt-2 text-2xl font-bold text-destructive">{failedContributions.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Transaction{failedContributions.length !== 1 ? "s" : ""} that need attention</p>
            </CardContent>
          </Card>
        </div>

        {feedback ? (
          <div className="rounded-2xl border border-chart-1/25 bg-chart-1/10 px-4 py-3 text-sm text-chart-1">
            {feedback}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-chart-4">
                  Contribution History
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {canRecordContribution ? "Recent savings entries" : "My savings entries"}
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{eligibleMembers.length} verified members</span>
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Loading contributions...</div>
            ) : (
              <Tabs defaultValue="verified" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-3 h-11 rounded-xl bg-muted/50 p-1">
                  <TabsTrigger value="verified" className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-chart-1" />
                    Verified
                    {verifiedContributions.length > 0 && (
                      <span className="ml-2 rounded-full bg-chart-1/15 px-1.5 py-0.5 text-xs font-bold text-chart-1">
                        {verifiedContributions.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Clock className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                    Pending
                    {pendingContributions.length > 0 && (
                      <span className="ml-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        {pendingContributions.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="failed" className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <XCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" />
                    Rejected
                    {failedContributions.length > 0 && (
                      <span className="ml-2 rounded-full bg-destructive/15 px-1.5 py-0.5 text-xs font-bold text-destructive">
                        {failedContributions.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ── Verified Tab ── */}
                <TabsContent value="verified">
                  {verifiedContributions.length === 0 ? (
                    <EmptyState icon={<Receipt className="h-6 w-6" />} message="No verified contributions yet." />
                  ) : (
                    <div className="space-y-3">
                      {verifiedContributions.map((contribution) => (
                        <ContributionCard key={contribution.uuid} contribution={contribution} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ── Pending Tab ── */}
                <TabsContent value="pending">
                  {pendingContributions.length === 0 ? (
                    <EmptyState icon={<Clock className="h-6 w-6" />} message="No pending contributions." />
                  ) : (
                    <div className="space-y-3">
                      {pendingContributions.map((contribution) => (
                        <ContributionCard
                          key={contribution.uuid}
                          contribution={contribution}
                          action={
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 dark:text-amber-400"
                              onClick={() =>
                                router.push(
                                  `/group/${groupId}/payment?type=saving&id=${contribution.uuid}&amount=${contribution.amount}`
                                )
                              }
                            >
                              <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                              Retry payment
                            </Button>
                          }
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ── Rejected Tab ── */}
                <TabsContent value="failed">
                  {failedContributions.length === 0 ? (
                    <EmptyState icon={<XCircle className="h-6 w-6" />} message="No rejected contributions." />
                  ) : (
                    <div className="space-y-3">
                      {failedContributions.map((contribution) => (
                        <ContributionCard key={contribution.uuid} contribution={contribution} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isContributionModalOpen} onOpenChange={(open) => { if (!open) closeContributionModal() }}>
        <DialogContent className="sm:max-w-xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">
              {modalMode === "OWN" ? "Add my saving" : "Record saving for others"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {modalMode === "OWN" 
                ? "Initiate a mobile money payment for your own savings deposit."
                : "Add a verified cash contribution to the group ledger."}
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
              {modalMode === "OTHERS" ? (
                <>
                  <Field>
                    <FieldLabel>Member</FieldLabel>
                    <FieldContent>
                      <Select
                        value={form.membership_id}
                        onValueChange={(value) => handleInputChange("membership_id", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a verified member" />
                        </SelectTrigger>
                        <SelectContent>
                          {eligibleMembers.map((member) => (
                            <SelectItem key={member.membership_id} value={member.membership_id}>
                              {[member.first_name, member.last_name].filter(Boolean).join(" ") || member.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>Only active and verified members appear here.</FieldDescription>
                    </FieldContent>
                  </Field>

                  {selectedMember ? (
                    <div className="rounded-2xl border border-border/80 bg-background/70 p-4">
                      <p className="text-sm font-semibold text-foreground">
                        {[selectedMember.first_name, selectedMember.last_name].filter(Boolean).join(" ") || selectedMember.email}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {selectedMember.role}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}

              <Field>
                <FieldLabel htmlFor="contribution-amount">Amount (TZS)</FieldLabel>
                <FieldContent>
                  <Input
                    id="contribution-amount"
                    inputMode="decimal"
                    min="0"
                    placeholder="25000"
                    value={form.amount}
                    onChange={(event) => handleInputChange("amount", event.target.value)}
                    required
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="contribution-reference">Payment reference</FieldLabel>
                <FieldContent>
                  <Input
                    id="contribution-reference"
                    placeholder="M-Pesa / cashbook / receipt number"
                    value={form.reference}
                    onChange={(event) => handleInputChange("reference", event.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="contribution-note">Note</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="contribution-note"
                    placeholder="Add context about this savings payment if needed."
                    value={form.note}
                    onChange={(event) => handleInputChange("note", event.target.value)}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={closeContributionModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || (modalMode === "OTHERS" && eligibleMembers.length === 0)}>
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {modalMode === "OWN" ? "Initiating payment..." : "Recording..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {modalMode === "OWN" ? "Initiate payment" : "Record contribution"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
