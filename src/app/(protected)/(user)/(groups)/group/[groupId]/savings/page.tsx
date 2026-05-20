"use client"

import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  PiggyBank,
  Plus,
  Receipt,
  Users,
  X,
} from "lucide-react"
import { financeServices, type Contribution } from "@/api/services/finance.service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
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
  paid_at_date: Date | undefined
  paid_at_time: string
  reference: string
  note: string
}

const defaultContributionFormState: ContributionFormState = {
  membership_id: "",
  amount: "",
  paid_at_date: undefined,
  paid_at_time: "",
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
        paid_at?: string[]
        reference?: string[]
      }
    }
  })?.response?.data

  return (
    errorResponse?.detail ||
    errorResponse?.non_field_errors?.[0] ||
    errorResponse?.membership_id?.[0] ||
    errorResponse?.amount?.[0] ||
    errorResponse?.paid_at?.[0] ||
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

export default function GroupSavingsPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const user = useAuthUserStore((state) => state.user)

  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false)
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

  const totalSavings = contributions.reduce(
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
    setIsContributionModalOpen(false)
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
      const response = await financeServices.createContribution({
        group_id: groupId,
        membership_id: form.membership_id,
        amount: form.amount.trim(),
        paid_at: (() => {
          const d = form.paid_at_date ? new Date(form.paid_at_date) : new Date()
          if (form.paid_at_time) {
            const [h, m] = form.paid_at_time.split(":")
            d.setHours(Number(h), Number(m), 0, 0)
          }
          return d.toISOString()
        })(),
        reference: form.reference.trim(),
        note: form.note.trim(),
      })

      setContributions((current) => [response.data, ...current])
      setFeedback("Contribution recorded successfully.")
      resetForm()
      setIsContributionModalOpen(false)
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
                <Button onClick={() => setIsContributionModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add saving
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {canRecordContribution ? "Total saved" : "My savings"}
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(totalSavings)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Verified members
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{eligibleMembers.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Entries visible
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{contributions.length}</p>
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
            ) : contributions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-4/10 text-chart-4">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-foreground">No contributions recorded yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {canRecordContribution
                    ? "Add the first savings entry when a member deposit is verified."
                    : "Your recorded savings entries will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contributions.map((contribution) => (
                  <Card key={contribution.uuid} className="border-border/70 bg-background/70 shadow-none">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold tracking-tight text-foreground">
                              {contribution.member_name || "Unnamed member"}
                            </h3>
                            <Badge variant="outline" className="uppercase">
                              {contribution.status.toLowerCase()}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {formatTzs(Number(contribution.amount))}
                            </span>
                            <span>Received by {contribution.received_by_name || "group finance manager"}</span>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {contribution.note || "No extra note added for this contribution."}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Paid {formatDateLabel(contribution.paid_at)}
                            </span>
                            <span>Logged {formatDateLabel(contribution.created_at)}</span>
                            {contribution.reference ? <span>Ref {contribution.reference}</span> : null}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isContributionModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Record saving</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a verified contribution to the group ledger.
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeContributionModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form className="space-y-4 p-5" onSubmit={handleSubmit}>
              <FieldGroup>
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
                  <FieldLabel>Paid at</FieldLabel>
                  <FieldContent>
                    <div className="flex flex-col gap-2">
                      <DatePicker
                        value={form.paid_at_date}
                        onChange={(date) =>
                          setForm((current) => ({ ...current, paid_at_date: date }))
                        }
                        placeholder="Select date"
                      />
                      <Input
                        type="time"
                        value={form.paid_at_time}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, paid_at_time: event.target.value }))
                        }
                        className="rounded-md"
                        aria-label="Time"
                      />
                    </div>
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
                <Button type="submit" disabled={submitting || eligibleMembers.length === 0}>
                  <Plus className="h-4 w-4" />
                  {submitting ? "Recording..." : "Record contribution"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
