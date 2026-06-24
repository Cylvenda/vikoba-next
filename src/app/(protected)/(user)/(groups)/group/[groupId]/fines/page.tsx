"use client"

import { toast } from "react-toastify"

import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  CalendarRange,
  Clock3,
  Coins,
  CreditCard,
  FileText,
  HandCoins,
  ReceiptText,
  WalletCards,
  PlusCircle,
  Settings2,
  Trash2,
  ListFilter,
  Edit2
} from "lucide-react"
import {
  financeServices,
  type Fine,
  type FinePayment,
  type FineCategory,
  type CreateFinePayload,
  type CreateFineCategoryPayload,
  type CreateFinePaymentPayload
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

type IssueFineFormState = Omit<CreateFinePayload, "group_uuid">
type CategoryFormState = Omit<CreateFineCategoryPayload, "group_uuid">

const defaultPaymentFormState: CreateFinePaymentPayload = {
  group_id: "",
  fine_id: "",
  amount: "",
  reference: "",
  note: "",
}

const defaultIssueFormState: IssueFineFormState = {
  membership_uuid: "",
  fine_category_uuid: "custom",
  reason: "",
  amount: "",
  due_date: "",
  note: "",
}

const defaultCategoryFormState: CategoryFormState = {
  name: "",
  description: "",
  default_amount: "",
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

function getErrorMessage(error: unknown): string {
  const errorResponse = (error as any)?.response?.data
  if (typeof errorResponse === 'object' && errorResponse !== null) {
      const values = Object.values(errorResponse)
      if (values.length > 0 && Array.isArray(values[0])) {
          return values[0][0] as string
      }
      if (errorResponse.detail) return errorResponse.detail
  }
  return error instanceof Error ? error.message : "An unexpected error occurred."
}

export default function GroupFinesPage() {
  const router = useRouter()
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const user = useAuthUserStore((state) => state.user)

  const [fines, setFines] = useState<Fine[]>([])
  const [payments, setPayments] = useState<FinePayment[]>([])
  const [categories, setCategories] = useState<FineCategory[]>([])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategoryUuid, setEditingCategoryUuid] = useState<string | null>(null)
  
  const [paymentForm, setPaymentForm] = useState<CreateFinePaymentPayload>(defaultPaymentFormState)
  const [issueForm, setIssueForm] = useState<IssueFineFormState>(defaultIssueFormState)
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(defaultCategoryFormState)

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

    return { totalAmount, outstandingBalance, unpaidCount, paidCount }
  }, [fines])

  useEffect(() => {
    if (!groupId) return
    let isCancelled = false
    const loadData = async () => {
      setLoading(true)
      try {
        const [finesRes, paymentsRes, categoriesRes] = await Promise.all([
          financeServices.getFines(groupId),
          financeServices.getFinePayments(groupId),
          financeServices.getFineCategories(groupId)
        ])
        if (!isCancelled) {
          setFines(finesRes.data)
          setPayments(paymentsRes.data)
          setCategories(categoriesRes.data)
        }
      } catch (err) {
        if (!isCancelled) toast.error(getErrorMessage(err))
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }
    void loadData()
    return () => { isCancelled = true }
  }, [groupId])

  // --- Modal Handlers ---
  
  const openPaymentModal = (fine?: Fine) => {
    setPaymentForm({
      group_id: groupId || "",
      fine_id: fine?.uuid || fines.find(f => f.status === 'UNPAID')?.uuid || "",
      amount: fine?.balance || fines.find(f => f.status === 'UNPAID')?.balance || "",
      reference: "",
      note: fine ? `Payment for ${fine.reason}` : "",
    })
    setIsPaymentModalOpen(true)
  }

  const openIssueModal = () => {
    setIssueForm(defaultIssueFormState)
    setIsIssueModalOpen(true)
  }

  const openCategoryModal = (category?: FineCategory) => {
    if (category) {
      setCategoryForm({
        name: category.name,
        description: category.description || "",
        default_amount: category.default_amount,
      })
      setEditingCategoryUuid(category.uuid)
    } else {
      setCategoryForm(defaultCategoryFormState)
      setEditingCategoryUuid(null)
    }
    setIsCategoryModalOpen(true)
  }

  // --- Submit Handlers ---

  const handlePaymentSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!groupId) return
    setSubmitting(true)
    try {
      const res = await financeServices.createFinePayment(paymentForm)
      setPayments([res.data, ...payments])
      setFines(fines.map((f) => {
        if (f.uuid === paymentForm.fine_id) {
            const newPaid = Number(f.total_paid) + Number(paymentForm.amount)
            const newBal = Math.max(0, Number(f.amount) - newPaid)
            return { ...f, total_paid: String(newPaid), balance: String(newBal), status: newBal <= 0 ? "PAID" : f.status }
        }
        return f
      }))
      toast.success("Fine payment recorded successfully.")
      setIsPaymentModalOpen(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleIssueSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!groupId) return
    setSubmitting(true)
    try {
      const payload: CreateFinePayload = {
        ...issueForm,
        group_uuid: groupId,
        fine_category_uuid: issueForm.fine_category_uuid === "custom" ? undefined : issueForm.fine_category_uuid
      }
      const res = await financeServices.createFine(payload)
      setFines([res.data, ...fines])
      toast.success("Fine issued successfully. An email notification has been sent to the member.")
      setIsIssueModalOpen(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCategorySubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!groupId) return
    setSubmitting(true)
    try {
      if (editingCategoryUuid) {
        const res = await financeServices.updateFineCategory(editingCategoryUuid, categoryForm)
        setCategories(categories.map((c) => (c.uuid === editingCategoryUuid ? res.data : c)))
        toast.success("Fine category updated successfully.")
      } else {
        const res = await financeServices.createFineCategory({ ...categoryForm, group_uuid: groupId })
        setCategories([...categories, res.data])
        toast.success("Fine category created successfully.")
      }
      setIsCategoryModalOpen(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCategory = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this fine category? Fines already issued will not be deleted.")) return
    try {
      await financeServices.deleteFineCategory(uuid)
      setCategories(categories.filter(c => c.uuid !== uuid))
      toast.success("Fine category deleted.")
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2 animate-pulse">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Workspace</p>
          <p className="text-muted-foreground text-sm">Loading group fines...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-screen-3xl flex-col gap-6">
        
        {/* Header Section */}
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
                Fines & Penalties
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {canManageFines
                  ? "Issue penalties, define fine categories, and track payments to ensure members follow group rules."
                  : "Review your group fines, balances, and payment history."}
              </p>
            </div>
            {canManageFines && (
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={openIssueModal} className="gap-2">
                  <PlusCircle className="h-4 w-4" /> Issue Fine
                </Button>
                <Button onClick={() => openPaymentModal()} disabled={stats.unpaidCount === 0} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
                  <HandCoins className="h-4 w-4" /> Record Payment
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total Fines Issued</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{fines.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Outstanding Balance</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(stats.outstandingBalance)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Unpaid Fines</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{stats.unpaidCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Payments Logged</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{payments.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="fines" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-card/70 max-w-8xl">
            <TabsTrigger value="fines" className="gap-2"><CalendarRange className="h-4 w-4" /> Fine Ledger</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2"><ReceiptText className="h-4 w-4" /> Payments</TabsTrigger>
            <TabsTrigger value="categories" className="gap-2"><Settings2 className="h-4 w-4" /> Categories</TabsTrigger>
          </TabsList>

          {/* Fines Tab */}
          <TabsContent value="fines">
            <Card className="border-border/70 bg-card/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Issued Fines</h2>
                    <p className="text-sm text-muted-foreground">List of all penalties issued to members.</p>
                  </div>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading fines...</div>
                ) : fines.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500"><Coins className="h-6 w-6" /></div>
                    <h3 className="mt-4 text-xl font-bold text-foreground">No fines recorded yet</h3>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fines.map((fine) => (
                      <Card key={fine.uuid} className="border-border/70 bg-background/70 shadow-none">
                        <CardContent className="p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-foreground">{fine.reason}</h3>
                              {fine.fine_category_name && <Badge variant="outline" className="text-xs">{fine.fine_category_name}</Badge>}
                              <Badge variant={fineStatusVariants[fine.status]}>{fine.status}</Badge>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-xl border border-border/70 bg-card/60 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Amount</p>
                                <p className="mt-1 text-sm font-bold">{formatTzs(Number(fine.amount))}</p>
                              </div>
                              <div className="rounded-xl border border-border/70 bg-card/60 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Paid</p>
                                <p className="mt-1 text-sm font-bold">{formatTzs(Number(fine.total_paid))}</p>
                              </div>
                              <div className="rounded-xl border border-border/70 bg-card/60 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Balance</p>
                                <p className="mt-1 text-sm font-bold text-orange-600 dark:text-orange-400">{formatTzs(Number(fine.balance))}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{fine.member_name}</span>
                              <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Due {formatDate(fine.due_date)}</span>
                              <span>Issued {formatDate(fine.issued_at)} {fine.issued_by_name ? `by ${fine.issued_by_name}` : ''}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {fine.member === currentMembership?.membership_id && Number(fine.balance) > 0 && (
                              <Button 
                                variant="default" 
                                onClick={() => router.push(`/group/${groupId}/payment?type=fine&id=${fine.uuid}&amount=${fine.balance}`)} 
                                className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white"
                              >
                                <CreditCard className="h-4 w-4 mr-2" /> Pay Online
                              </Button>
                            )}
                            {canManageFines && Number(fine.balance) > 0 && (
                              <Button variant="outline" onClick={() => openPaymentModal(fine)} className="shrink-0 text-orange-600 border-orange-200 hover:bg-orange-50">
                                <HandCoins className="h-4 w-4 mr-2" /> Record Cash
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card className="border-border/70 bg-card/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Payment History</h2>
                  <p className="text-sm text-muted-foreground">Log of all collected fine payments.</p>
                </div>
                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading payments...</div>
                ) : payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ReceiptText className="h-6 w-6" /></div>
                    <h3 className="mt-4 text-xl font-bold text-foreground">No payments logged yet</h3>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div key={p.uuid} className="flex flex-col sm:flex-row justify-between p-4 rounded-xl border border-border/70 bg-background/70 gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-foreground">{formatTzs(Number(p.amount))}</span>
                            <Badge variant="secondary" className="text-[10px]">Payment</Badge>
                          </div>
                          <p className="text-sm text-foreground font-medium">{p.fine_reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">Ref: {p.reference || "None"} • Received by {p.received_by_name}</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {formatDateTime(p.paid_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card className="border-border/70 bg-card/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Fine Categories</h2>
                    <p className="text-sm text-muted-foreground">Define standard penalties for common violations.</p>
                  </div>
                  {canManageFines && (
                    <Button variant="outline" onClick={() => openCategoryModal()} className="gap-2">
                      <ListFilter className="h-4 w-4" /> Add Category
                    </Button>
                  )}
                </div>
                
                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading categories...</div>
                ) : categories.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><Settings2 className="h-6 w-6 text-muted-foreground" /></div>
                    <h3 className="mt-4 text-lg font-bold text-foreground">No categories defined</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Create templates for common fines like "Late to meeting" or "Missed contribution".</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((c) => (
                      <div key={c.uuid} className="p-4 rounded-xl border border-border/70 bg-background/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">{c.name}</h3>
                          {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 shrink-0">
                          <p className="text-xl font-extrabold text-orange-600 dark:text-orange-400 text-right">{formatTzs(Number(c.default_amount))}</p>
                          {canManageFines && (
                            <div className="flex items-center gap-2 sm:border-l sm:border-border/50 sm:pl-6">
                              <Button variant="ghost" size="sm" onClick={() => openCategoryModal(c)} className="text-foreground hover:bg-muted h-8 px-2">
                                <Edit2 className="h-4 w-4 mr-1.5" /> Edit
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(c.uuid)} className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2">
                                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* --- Modals --- */}
      
      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={(o) => { if (!o && !submitting) setIsPaymentModalOpen(false) }}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Record Fine Payment</DialogTitle>
            <DialogDescription>Log a payment received for an outstanding fine.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Select Fine</FieldLabel>
                <FieldContent>
                  <Select value={paymentForm.fine_id} onValueChange={(val) => {
                    const f = fines.find(x => x.uuid === val)
                    setPaymentForm({ ...paymentForm, fine_id: val, amount: f ? f.balance : "" })
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select fine" /></SelectTrigger>
                    <SelectContent>
                      {fines.filter(f => f.status === 'UNPAID').map(f => (
                        <SelectItem key={f.uuid} value={f.uuid}>{f.member_name} - {f.reason} ({formatTzs(Number(f.balance))})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Amount (TZS)</FieldLabel>
                <FieldContent>
                  <Input type="number" min="1" step="0.01" required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Reference (Optional)</FieldLabel>
                <FieldContent>
                  <Input placeholder="Receipt #" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
                </FieldContent>
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Record Payment"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Fine Modal */}
      <Dialog open={isIssueModalOpen} onOpenChange={(o) => { if (!o && !submitting) setIsIssueModalOpen(false) }}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle>Issue Penalty</DialogTitle>
            <DialogDescription>Assign a fine to a group member. They will be notified via email.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleIssueSubmit} className="space-y-4 mt-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Member</FieldLabel>
                <FieldContent>
                  <Select value={issueForm.membership_uuid} onValueChange={(val) => setIssueForm({...issueForm, membership_uuid: val})}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {selectedGroupMembers.filter(m => m.is_active).map(m => (
                        <SelectItem key={m.membership_id} value={m.membership_id}>{m.first_name} {m.last_name} ({m.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Fine Category</FieldLabel>
                <FieldContent>
                  <Select value={issueForm.fine_category_uuid} onValueChange={(val) => {
                    const cat = categories.find(c => c.uuid === val)
                    setIssueForm({
                      ...issueForm, 
                      fine_category_uuid: val, 
                      reason: cat ? cat.name : "", 
                      amount: cat ? cat.default_amount : "" 
                    })
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Fine (No category)</SelectItem>
                      {categories.map(c => <SelectItem key={c.uuid} value={c.uuid}>{c.name} - {formatTzs(Number(c.default_amount))}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Reason</FieldLabel>
                <FieldContent>
                  <Input required placeholder="E.g. Late for meeting" value={issueForm.reason} onChange={e => setIssueForm({...issueForm, reason: e.target.value})} disabled={issueForm.fine_category_uuid !== 'custom'} />
                </FieldContent>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Amount (TZS)</FieldLabel>
                  <FieldContent>
                    <Input required type="number" min="1" step="0.01" value={issueForm.amount} onChange={e => setIssueForm({...issueForm, amount: e.target.value})} />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Due Date</FieldLabel>
                  <FieldContent>
                    <Input required type="date" value={issueForm.due_date} onChange={e => setIssueForm({...issueForm, due_date: e.target.value})} />
                  </FieldContent>
                </Field>
              </div>
            </FieldGroup>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || !issueForm.membership_uuid}>{submitting ? "Issuing..." : "Issue Fine"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={(o) => { if (!o && !submitting) setIsCategoryModalOpen(false) }}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle>{editingCategoryUuid ? "Edit Fine Category" : "New Fine Category"}</DialogTitle>
            <DialogDescription>{editingCategoryUuid ? "Update the details for this penalty." : "Create a reusable fine template for your group."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4 mt-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Category Name</FieldLabel>
                <FieldContent>
                  <Input required placeholder="E.g. Absence without notice" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Default Amount (TZS)</FieldLabel>
                <FieldContent>
                  <Input required type="number" min="1" step="0.01" placeholder="5000" value={categoryForm.default_amount} onChange={e => setCategoryForm({...categoryForm, default_amount: e.target.value})} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Description (Optional)</FieldLabel>
                <FieldContent>
                  <Textarea placeholder="Explain when this fine applies" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} />
                </FieldContent>
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : editingCategoryUuid ? "Update Category" : "Create Category"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
