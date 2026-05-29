"use client"

import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertCircle,
  CalendarRange,
  Clock3,
  Pencil,
  Plus,
  ReceiptText,
  ShieldCheck,
  Trash2,
  WalletCards,
  X,
} from "lucide-react"
import {
  financeServices,
  type LoanCategory,
  type LoanRequest,
} from "@/api/services/finance.service"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

type LoanCategoryFormState = {
  name: string
  amount: string
  duration_type: "MONTHS" | "WEEKS" | "DAYS"
  duration_count: string
  description: string
}

type LoanRequestFormState = {
  loan_request_category_id: string
  interest_rate: string
  purpose: string
}

const defaultCategoryFormState: LoanCategoryFormState = {
  name: "",
  amount: "",
  duration_type: "MONTHS",
  duration_count: "",
  description: "",
}

const defaultRequestFormState: LoanRequestFormState = {
  loan_request_category_id: "",
  interest_rate: "",
  purpose: "",
}

const durationLabels: Record<LoanCategory["duration_type"], string> = {
  MONTHS: "Months",
  WEEKS: "Weeks",
  DAYS: "Days",
}

const requestStatusVariants: Record<
  LoanRequest["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "outline",
  REJECTED: "destructive",
  ACTIVE: "default",
  COMPLETED: "outline",
  DEFAULTED: "destructive",
}

function getErrorMessage(error: unknown): string {
  const errorResponse = (error as {
    response?: {
      data?: {
        detail?: string
        non_field_errors?: string[]
        name?: string[]
        amount?: string[]
        duration_count?: string[]
        group_uuid?: string[]
        loan_request_category_id?: string[]
        interest_rate?: string[]
        purpose?: string[]
      }
    }
  })?.response?.data

  return (
    errorResponse?.detail ||
    errorResponse?.non_field_errors?.[0] ||
    errorResponse?.loan_request_category_id?.[0] ||
    errorResponse?.interest_rate?.[0] ||
    errorResponse?.purpose?.[0] ||
    errorResponse?.name?.[0] ||
    errorResponse?.amount?.[0] ||
    errorResponse?.duration_count?.[0] ||
    errorResponse?.group_uuid?.[0] ||
    (error instanceof Error ? error.message : "Something went wrong while saving this loan workflow.")
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-TZ", {
    dateStyle: "medium",
  }).format(new Date(value))
}

function getLoanStatusLabel(status: LoanRequest["status"]) {
  return status.toLowerCase().replace("_", " ")
}

export default function GroupLoansPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const user = useAuthUserStore((state) => state.user)

  const [categories, setCategories] = useState<LoanCategory[]>([])
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [categorySubmitting, setCategorySubmitting] = useState(false)
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [actioningLoanUuid, setActioningLoanUuid] = useState<string | null>(null)
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [categoryForm, setCategoryForm] = useState<LoanCategoryFormState>(defaultCategoryFormState)
  const [requestForm, setRequestForm] = useState<LoanRequestFormState>(defaultRequestFormState)

  const currentMembership = selectedGroupMembers.find((member) => member.user_id === user?.uuid)
  const isVerifiedMember = Boolean(currentMembership?.is_active && currentMembership?.is_verified)
  const canManageLoans = Boolean(
    isVerifiedMember &&
      (currentMembership?.role === "CHAIRPERSON" || currentMembership?.role === "SECRETARY")
  )
  const selectedCategory = categories.find(
    (category) => category.uuid === requestForm.loan_request_category_id
  )

  useEffect(() => {
    if (!groupId) return

    let isCancelled = false

    const loadLoanData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [categoriesResponse, requestsResponse] = await Promise.all([
          financeServices.getLoanCategories(groupId),
          financeServices.getLoanRequests(groupId),
        ])

        if (!isCancelled) {
          setCategories(categoriesResponse.data)
          setLoanRequests(requestsResponse.data)
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

    void loadLoanData()

    return () => {
      isCancelled = true
    }
  }, [groupId])

  const resetCategoryForm = () => {
    setCategoryForm(defaultCategoryFormState)
    setEditingUuid(null)
  }

  const resetRequestForm = () => {
    setRequestForm(defaultRequestFormState)
  }

  const openCategoryModal = (category?: LoanCategory) => {
    setFeedback(null)
    setError(null)

    if (category) {
      setEditingUuid(category.uuid)
      setCategoryForm({
        name: category.name,
        amount: category.amount,
        duration_type: category.duration_type,
        duration_count: String(category.duration_count),
        description: category.description || "",
      })
    } else {
      resetCategoryForm()
    }

    setIsCategoryModalOpen(true)
  }

  const closeCategoryModal = () => {
    if (categorySubmitting) return
    resetCategoryForm()
    setIsCategoryModalOpen(false)
  }

  const closeRequestModal = () => {
    if (requestSubmitting) return
    resetRequestForm()
    setIsRequestModalOpen(false)
  }

  const handleCategoryInputChange = (
    field: keyof LoanCategoryFormState,
    value: string
  ) => {
    setCategoryForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleRequestInputChange = (
    field: keyof LoanRequestFormState,
    value: string
  ) => {
    setRequestForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!groupId) {
      setError("Missing group context for this page.")
      return
    }

    setCategorySubmitting(true)
    setFeedback(null)
    setError(null)

    try {
      const payload = {
        name: categoryForm.name.trim(),
        amount: categoryForm.amount.trim(),
        duration_type: categoryForm.duration_type,
        duration_count: Number(categoryForm.duration_count),
        description: categoryForm.description.trim(),
      }

      if (editingUuid) {
        const response = await financeServices.updateLoanCategory(editingUuid, payload)
        setCategories((current) =>
          current.map((item) => (item.uuid === editingUuid ? response.data : item))
        )
        setFeedback("Loan category updated successfully.")
      } else {
        const response = await financeServices.createLoanCategory({
          ...payload,
          group_uuid: groupId,
        })
        setCategories((current) => [response.data, ...current])
        setFeedback("Loan category created successfully.")
      }

      resetCategoryForm()
      setIsCategoryModalOpen(false)
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError))
    } finally {
      setCategorySubmitting(false)
    }
  }

  const handleLoanRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!groupId) {
      setError("Missing group context for this page.")
      return
    }

    setRequestSubmitting(true)
    setFeedback(null)
    setError(null)

    try {
      const response = await financeServices.createLoanRequest({
        group_id: groupId,
        loan_request_category_id: requestForm.loan_request_category_id,
        interest_rate: requestForm.interest_rate.trim(),
        purpose: requestForm.purpose.trim(),
      })

      setLoanRequests((current) => [response.data, ...current])
      setFeedback("Loan request submitted successfully.")
      resetRequestForm()
      setIsRequestModalOpen(false)
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError))
    } finally {
      setRequestSubmitting(false)
    }
  }

  const handleDelete = async (category: LoanCategory) => {
    const shouldDelete = window.confirm(
      `Delete the "${category.name}" loan category for ${selectedGroup?.name || "this group"}?`
    )

    if (!shouldDelete) return

    setDeletingUuid(category.uuid)
    setFeedback(null)
    setError(null)

    try {
      await financeServices.deleteLoanCategory(category.uuid)
      setCategories((current) => current.filter((item) => item.uuid !== category.uuid))
      if (editingUuid === category.uuid) {
        resetCategoryForm()
      }
      if (requestForm.loan_request_category_id === category.uuid) {
        resetRequestForm()
      }
      setFeedback("Loan category removed.")
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError))
    } finally {
      setDeletingUuid(null)
    }
  }

  const updateLoanRequest = (updatedLoanRequest: LoanRequest) => {
    setLoanRequests((current) =>
      current.map((item) => (item.uuid === updatedLoanRequest.uuid ? updatedLoanRequest : item))
    )
  }

  const handleLoanAction = async (
    loanUuid: string,
    action: "approve" | "reject"
  ) => {
    setActioningLoanUuid(loanUuid)
    setFeedback(null)
    setError(null)

    try {
      const response =
        action === "approve"
          ? await financeServices.approveLoanRequest(loanUuid)
          : await financeServices.rejectLoanRequest(loanUuid)

      updateLoanRequest(response.data)
      setFeedback(
        action === "approve"
          ? "Loan request approved and disbursed successfully."
          : "Loan request rejected."
      )
    } catch (actionError: unknown) {
      setError(getErrorMessage(actionError))
    } finally {
      setActioningLoanUuid(null)
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-chart-3/15 text-chart-3 shadow-sm">
                  <WalletCards className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 uppercase tracking-[0.18em]">
                  {canManageLoans ? "Leader review" : "Member borrowing"}
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Group borrowing workspace
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {canManageLoans
                  ? "Manage loan products, review pending requests, and approve or reject member borrowing."
                  : "Review available loan products and track your own borrowing requests."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
              {isVerifiedMember ? (
                <Button onClick={() => setIsRequestModalOpen(true)} disabled={categories.length === 0}>
                  <Plus className="h-4 w-4" />
                  Request loan
                </Button>
              ) : null}
              {canManageLoans ? (
                <Button variant="outline" onClick={() => openCategoryModal()}>
                  <Plus className="h-4 w-4" />
                  Add category
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Active templates
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{categories.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {canManageLoans ? "Requests logged" : "My requests"}
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{loanRequests.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Pending review
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {loanRequests.filter((request) => request.status === "PENDING").length}
              </p>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className="border-border/70 bg-card/80 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-chart-4">
                    Loan Catalog
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    Available loan categories
                  </h2>
                </div>
              </div>

              {loading ? (
                <div className="py-10 text-center text-muted-foreground">Loading loan categories...</div>
              ) : categories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-4/10 text-chart-4">
                    <CalendarRange className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-foreground">No loan categories yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {canManageLoans
                      ? "Add the first loan product so members can request against defined terms."
                      : "Your group leaders have not published any loan templates yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <Card key={category.uuid} className="border-border/70 bg-background/70 shadow-none">
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-bold tracking-tight text-foreground">
                                {category.name}
                              </h3>
                              <Badge variant="outline">
                                {category.duration_count} {durationLabels[category.duration_type]}
                              </Badge>
                            </div>

                            <p className="text-2xl font-extrabold text-foreground">
                              {formatTzs(Number(category.amount))}
                            </p>

                            <p className="max-w-2xl text-sm text-muted-foreground">
                              {category.description || "No description added for this loan category yet."}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                              <span className="inline-flex items-center gap-2">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Available to verified members
                              </span>
                              <span>Created {formatDate(category.created_at)}</span>
                            </div>
                          </div>

                          {canManageLoans ? (
                            <div className="flex items-center gap-2">
                              <Button variant="outline" onClick={() => openCategoryModal(category)}>
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => void handleDelete(category)}
                                disabled={deletingUuid === category.uuid}
                              >
                                <Trash2 className="h-4 w-4" />
                                {deletingUuid === category.uuid ? "Removing..." : "Delete"}
                              </Button>
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

          <Card className="border-border/70 bg-card/80 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-chart-3">
                  Request History
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {canManageLoans ? "Submitted loan requests" : "My loan requests"}
                </h2>
              </div>

              {loading ? (
                <div className="py-10 text-center text-muted-foreground">Loading loan requests...</div>
              ) : loanRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-3/10 text-chart-3">
                    <ReceiptText className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-foreground">No requests submitted yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isVerifiedMember
                      ? "Request history will appear here after a member submits a loan."
                      : "Verified members can submit loan requests from this workspace."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loanRequests.map((loanRequest) => (
                    <Card key={loanRequest.uuid} className="border-border/70 bg-background/70 shadow-none">
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold tracking-tight text-foreground">
                                {loanRequest.loan_request_category_name}
                              </h3>
                              <Badge variant={requestStatusVariants[loanRequest.status]} className="uppercase">
                                {getLoanStatusLabel(loanRequest.status)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">
                                {formatTzs(Number(loanRequest.requested_amount))}
                              </span>
                              <span>{loanRequest.borrower_name || "Unnamed member"}</span>
                              <span>{loanRequest.interest_rate}% interest</span>
                            </div>

                            <p className="text-sm text-muted-foreground">
                              {loanRequest.purpose || "No purpose was added for this request."}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                              <span className="inline-flex items-center gap-2">
                                <Clock3 className="h-3.5 w-3.5" />
                                Due {formatDate(loanRequest.due_date)}
                              </span>
                              <span>Submitted {formatDate(loanRequest.created_at)}</span>
                              <span>
                                {loanRequest.duration_count} {durationLabels[loanRequest.duration_type]}
                              </span>
                            </div>
                          </div>

                          {canManageLoans && loanRequest.status === "PENDING" ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                onClick={() => void handleLoanAction(loanRequest.uuid, "approve")}
                                disabled={actioningLoanUuid === loanRequest.uuid}
                              >
                                {actioningLoanUuid === loanRequest.uuid ? "Working..." : "Approve"}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => void handleLoanAction(loanRequest.uuid, "reject")}
                                disabled={actioningLoanUuid === loanRequest.uuid}
                              >
                                Reject
                              </Button>
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
        </div>
      </div>

      <Dialog open={isRequestModalOpen} onOpenChange={(open) => { if (!open) closeRequestModal() }}>
        <DialogContent className="sm:max-w-xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Request loan</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Choose a category and submit the request for review.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleLoanRequestSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Loan category</FieldLabel>
                <FieldContent>
                  <Select
                    value={requestForm.loan_request_category_id}
                    onValueChange={(value) =>
                      handleRequestInputChange("loan_request_category_id", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a loan category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.uuid} value={category.uuid}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    The selected category determines the principal amount and duration.
                  </FieldDescription>
                </FieldContent>
              </Field>

              {selectedCategory ? (
                <div className="rounded-md border border-border bg-background/70 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {formatTzs(Number(selectedCategory.amount))}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {selectedCategory.duration_count} {durationLabels[selectedCategory.duration_type]}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedCategory.description || "No extra description added for this category."}
                  </p>
                </div>
              ) : null}

              <Field>
                <FieldLabel htmlFor="loan-interest-rate">Interest rate (%)</FieldLabel>
                <FieldContent>
                  <Input
                    id="loan-interest-rate"
                    inputMode="decimal"
                    min="0"
                    placeholder="10"
                    value={requestForm.interest_rate}
                    onChange={(event) =>
                      handleRequestInputChange("interest_rate", event.target.value)
                    }
                    required
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="loan-purpose">Purpose</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="loan-purpose"
                    placeholder="Describe what the loan will support and how repayment will stay on track."
                    value={requestForm.purpose}
                    onChange={(event) => handleRequestInputChange("purpose", event.target.value)}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={closeRequestModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={requestSubmitting || categories.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                {requestSubmitting ? "Submitting..." : "Submit request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryModalOpen} onOpenChange={(open) => { if (!open) closeCategoryModal() }}>
        <DialogContent className="sm:max-w-xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">
              {editingUuid ? "Update loan category" : "Add loan category"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Define the amount and repayment window members can request.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleCategorySubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="loan-name">Category name</FieldLabel>
                <FieldContent>
                  <Input
                    id="loan-name"
                    placeholder="Emergency support"
                    value={categoryForm.name}
                    onChange={(event) => handleCategoryInputChange("name", event.target.value)}
                    required
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="loan-amount">Amount (TZS)</FieldLabel>
                <FieldContent>
                  <Input
                    id="loan-amount"
                    inputMode="decimal"
                    min="0"
                    placeholder="150000"
                    value={categoryForm.amount}
                    onChange={(event) => handleCategoryInputChange("amount", event.target.value)}
                    required
                  />
                </FieldContent>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Duration unit</FieldLabel>
                  <FieldContent>
                    <Select
                      value={categoryForm.duration_type}
                      onValueChange={(value) =>
                        handleCategoryInputChange(
                          "duration_type",
                          value as LoanCategoryFormState["duration_type"]
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a duration unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHS">Months</SelectItem>
                        <SelectItem value="WEEKS">Weeks</SelectItem>
                        <SelectItem value="DAYS">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="loan-duration-count">Duration count</FieldLabel>
                  <FieldContent>
                    <Input
                      id="loan-duration-count"
                      type="number"
                      min="1"
                      placeholder="3"
                      value={categoryForm.duration_count}
                      onChange={(event) =>
                        handleCategoryInputChange("duration_count", event.target.value)
                      }
                      required
                    />
                  </FieldContent>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="loan-description">Description</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="loan-description"
                    placeholder="Explain when members should use this option and any repayment expectations."
                    value={categoryForm.description}
                    onChange={(event) => handleCategoryInputChange("description", event.target.value)}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={closeCategoryModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={categorySubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                {categorySubmitting
                  ? editingUuid
                    ? "Saving..."
                    : "Creating..."
                  : editingUuid
                    ? "Save changes"
                    : "Create category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
