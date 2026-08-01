"use client"

import { toast } from "react-toastify"

import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  CalendarRange,
  Clock3,
  Coins,
  CreditCard,
  FileText,
  HandCoins,
  ReceiptText,
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DatePicker, formatDateToString, parseDateString } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { formatTzs } from "@/lib/vikoba-finance"
import { useLanguage } from "@/components/language/language-provider"

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
  const errorResponse = (error as { response?: { data?: unknown } })?.response?.data
  if (typeof errorResponse === 'object' && errorResponse !== null) {
    const typedError = errorResponse as { detail?: string; [key: string]: unknown }
    const values = Object.values(typedError)
    if (values.length > 0 && Array.isArray(values[0])) {
      return values[0][0] as string
    }
    if (typedError.detail) return typedError.detail
  }
  return error instanceof Error ? error.message : "An unexpected error occurred."
}

export default function GroupFinesPage() {
  const router = useRouter()
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const user = useAuthUserStore((state) => state.user)
  const { language } = useLanguage()
  const isSwahili = language === "sw"
  const tt = (en: string, sw: string) => (isSwahili ? sw : en)

  const [fines, setFines] = useState<Fine[]>([])
  const [payments, setPayments] = useState<FinePayment[]>([])
  const [categories, setCategories] = useState<FineCategory[]>([])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategoryUuid, setEditingCategoryUuid] = useState<string | null>(null)
  const [fineScope, setFineScope] = useState<"all" | "mine">("all")
  
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

  const myFineIds = useMemo(() => {
    return new Set(
      fines.filter((fine) => fine.member_user_id === user?.uuid || fine.member === currentMembership?.membership_id).map((fine) => fine.uuid),
    )
  }, [currentMembership?.membership_id, fines, user?.uuid])

  const effectiveFineScope = canManageFines ? fineScope : "mine"

  const visibleFines = useMemo(() => {
    if (effectiveFineScope === "mine") {
      return fines.filter((fine) => myFineIds.has(fine.uuid))
    }

    return fines
  }, [effectiveFineScope, fines, myFineIds])

  const payableFines = useMemo(() => {
    return fines.filter((fine) => myFineIds.has(fine.uuid) && fine.status === "UNPAID")
  }, [fines, myFineIds])

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
    const fallbackFine = fine ?? payableFines[0]
    setPaymentForm({
      group_id: groupId || "",
      fine_id: fallbackFine?.uuid || "",
      amount: fallbackFine?.balance || "",
      reference: "",
      note: fallbackFine ? `Payment for ${fallbackFine.reason}` : "",
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
      toast.success(tt("Fine payment recorded successfully.", "Malipo ya faini yamehifadhiwa kwa mafanikio."))
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
      toast.success(tt("Fine issued successfully. An email notification has been sent to the member.", "Faini imetolewa kwa mafanikio. Taarifa ya barua pepe imetumwa kwa mwanachama."))
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
        toast.success(tt("Fine category updated successfully.", "Aina ya faini imesasishwa kwa mafanikio."))
      } else {
        const res = await financeServices.createFineCategory({ ...categoryForm, group_uuid: groupId })
        setCategories([...categories, res.data])
        toast.success(tt("Fine category created successfully.", "Aina ya faini imeundwa kwa mafanikio."))
      }
      setIsCategoryModalOpen(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCategory = async (uuid: string) => {
    if (!confirm(tt("Are you sure you want to delete this fine category? Fines already issued will not be deleted.", "Una uhakika unataka kufuta aina hii ya faini? Faini ambazo tayari zimetolewa hazitafutwa."))) return
    try {
      await financeServices.deleteFineCategory(uuid)
      setCategories(categories.filter(c => c.uuid !== uuid))
      toast.success(tt("Fine category deleted.", "Aina ya faini imefutwa."))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2 animate-pulse">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{tt("Workspace", "Nafasi ya Kazi")}</p>
          <p className="text-muted-foreground text-sm">{tt("Loading group fines...", "Inapakia faini za kikundi...")}</p>
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
                  {canManageFines ? tt("Finance operations", "Shughuli za fedha") : tt("Member view", "Mwonekano wa mwanachama")}
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {tt("Fines & Penalties", "Faini na Adhabu")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {canManageFines
                  ? tt("Issue penalties, define fine categories, and track payments to ensure members follow group rules.", "Toa adhabu, bainisha aina za faini, na fuatilia malipo ili wanachama wafuate sheria za kikundi.")
                  : tt("Review your group fines, balances, and payment history.", "Kagua faini zako za kikundi, salio, na historia ya malipo.")}
              </p>
            </div>
            {(canManageFines || payableFines.length > 0) && (
              <div className="flex items-center gap-3">
                {canManageFines ? (
                  <Button variant="outline" onClick={openIssueModal} className="gap-2">
                    <PlusCircle className="h-4 w-4" /> {tt("Issue Fine", "Toa Faini")}
                  </Button>
                ) : null}
                <Button
                  onClick={() => openPaymentModal()}
                  disabled={payableFines.length === 0}
                  className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <HandCoins className="h-4 w-4" /> {tt("Pay My Fine", "Lipa Faini Yangu")}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{tt("Total Fines Issued", "Jumla ya Faini Zilizotolewa")}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{fines.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{tt("Outstanding Balance", "Salio Lililosalia")}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(stats.outstandingBalance)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{tt("Unpaid Fines", "Faini Zisizolipwa")}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{stats.unpaidCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{tt("Payments Logged", "Malipo Yaliyorekodiwa")}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{payments.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="fines" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-card/70 max-w-8xl">
            <TabsTrigger value="fines" className="gap-2"><CalendarRange className="h-4 w-4" /> {tt("Fine Ledger", "Daftari la Faini")}</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2"><ReceiptText className="h-4 w-4" /> {tt("Payments", "Malipo")}</TabsTrigger>
            <TabsTrigger value="categories" className="gap-2"><Settings2 className="h-4 w-4" /> {tt("Categories", "Aina")}</TabsTrigger>
          </TabsList>

          {/* Fines Tab */}
          <TabsContent value="fines">
            <Card className="border-border/70 bg-card/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">{tt("Fine Ledger", "Daftari la Faini")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {tt("Review penalties, who issued them, and who they belong to.", "Kagua adhabu, nani alizitoa, na zinamhusu nani.")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant={fineScope === "all" ? "default" : "outline"}
                      onClick={() => setFineScope("all")}
                      className="rounded-full"
                    >
                      {tt("All fines", "Faini zote")}
                    </Button>
                    <Button
                      type="button"
                      variant={fineScope === "mine" ? "default" : "outline"}
                      onClick={() => setFineScope("mine")}
                      className="rounded-full"
                    >
                      {tt("My fines", "Faini zangu")}
                    </Button>
                    <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {visibleFines.length} shown
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">{tt("Loading fines...", "Inapakia faini...")}</div>
                ) : visibleFines.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                      <Coins className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-foreground">{tt("No fines in this view", "Hakuna faini katika mwonekano huu")}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tt("Switch between all fines and your own fines to see what is available.", "Badilisha kati ya faini zote na faini zako mwenyewe ili kuona kilichopo.")}
                    </p>
                  </div>
                ) : (
                   <div className="overflow-x-auto rounded-2xl border border-border/70">
                     <table className="min-w-full divide-y divide-border">
                       <thead className="bg-background/80">
                         <tr className="text-left text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                           <th className="px-3 py-2.5 sm:px-4 sm:py-3">{tt("Member", "Mwanachama")}</th>
                           <th className="px-3 py-2.5 sm:px-4 sm:py-3 hidden sm:table-cell">{tt("Issued By", "Iliyotolewa na")}</th>
                           <th className="px-3 py-2.5 sm:px-4 sm:py-3">{tt("Reason", "Sababu")}</th>
                           <th className="px-3 py-2.5 sm:px-4 sm:py-3 hidden sm:table-cell">{tt("Amount", "Kiasi")}</th>
                           <th className="px-3 py-2.5 sm:px-4 sm:py-3 hidden sm:table-cell">{tt("Paid", "Kilicholipwa")}</th>
                           <th className="px-3 py-2.5 sm:px-4 sm:py-3">{tt("Balance", "Salio")}</th>
                           <th className="px-3 py-2.5 sm:px-4 sm:py-3 hidden sm:table-cell">{tt("Due", "Lazima ilipwe")}</th>
                           <th className="px-3 py-2.5 sm:px-4 sm:py-3">{tt("Status", "Hali")}</th>
                           <th className="px-3 py-2.5 sm:px-4 sm:py-3">{tt("Action", "Kitendo")}</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-border bg-card/40">
                         {visibleFines.map((fine) => {
                           const isMine = fine.member === currentMembership?.membership_id || fine.member_user_id === user?.uuid
                           const isUnpaid = fine.status === "UNPAID"
                           return (
                             <tr key={fine.uuid} className="align-top">
                               <td className="px-3 py-3 sm:px-4 sm:py-4">
                                 <p className="font-semibold text-foreground text-xs sm:text-sm">{fine.member_name}</p>
                                 <p className="text-[10px] sm:text-[11px] text-muted-foreground">{fine.member_email}</p>
                               </td>
                               <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                                 {fine.issued_by_name || tt("System", "Mfumo")}
                               </td>
                               <td className="px-3 py-3 sm:px-4 sm:py-4">
                                 <div className="space-y-1">
                                   <p className="font-semibold text-foreground text-xs sm:text-sm">{fine.reason}</p>
                                   {fine.fine_category_name ? (
                                     <Badge variant="outline" className="text-[9px] sm:text-[10px]">
                                       {fine.fine_category_name}
                                     </Badge>
                                   ) : null}
                                 </div>
                               </td>
                               <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm font-semibold hidden sm:table-cell">{formatTzs(Number(fine.amount))}</td>
                               <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm hidden sm:table-cell">{formatTzs(Number(fine.total_paid))}</td>
                               <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400">
                                 {formatTzs(Number(fine.balance))}
                               </td>
                               <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                                 <div className="flex items-center gap-1.5">
                                   <Clock3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                   {formatDate(fine.due_date)}
                                 </div>
                               </td>
                               <td className="px-3 py-3 sm:px-4 sm:py-4">
                                 <Badge variant={fineStatusVariants[fine.status]} className="text-[9px] sm:text-[10px]">{fine.status}</Badge>
                               </td>
                               <td className="px-3 py-3 sm:px-4 sm:py-4">
                                 {isUnpaid && isMine ? (
                                   <Button
                                     variant="default"
                                     onClick={() => router.push(`/group/${groupId}/payment?type=fine&id=${fine.uuid}&amount=${fine.balance}`)}
                                     className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                                   >
                                     <CreditCard className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                     {tt("Pay Fine", "Lipa Faini")}
                                   </Button>
                                 ) : (
                                   <span className="text-[10px] sm:text-xs text-muted-foreground">
                                     {isMine ? tt("Already paid", "Tayari imelipwa") : tt("Owner only", "Mmiliki pekee")}
                                   </span>
                                 )}
                               </td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
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
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{tt("Payment History", "Historia ya Malipo")}</h2>
                  <p className="text-sm text-muted-foreground">{tt("Log of all collected fine payments.", "Rekodi ya malipo yote ya faini yaliyokusanywa.")}</p>
                </div>
                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">{tt("Loading payments...", "Inapakia malipo...")}</div>
                ) : payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ReceiptText className="h-6 w-6" /></div>
                    <h3 className="mt-4 text-xl font-bold text-foreground">{tt("No payments logged yet", "Bado hakuna malipo yaliyorekodiwa")}</h3>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div key={p.uuid} className="flex flex-col sm:flex-row justify-between p-4 rounded-xl border border-border/70 bg-background/70 gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-foreground">{formatTzs(Number(p.amount))}</span>
                            <Badge variant="secondary" className="text-[10px]">{tt("Payment", "Malipo")}</Badge>
                          </div>
                          <p className="text-sm text-foreground font-medium">{p.fine_reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">{tt("Ref:", "Rejea:")} {p.reference || tt("None", "Hakuna")} • {tt("Received by", "Imepokelewa na")} {p.received_by_name}</p>
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
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{tt("Fine Categories", "Aina za Faini")}</h2>
                  <p className="text-sm text-muted-foreground">{tt("Define standard penalties for common violations.", "Bainisha adhabu za kawaida kwa makosa yanayojirudia.")}</p>
                  </div>
                  {canManageFines && (
                    <Button variant="outline" onClick={() => openCategoryModal()} className="gap-2">
                      <ListFilter className="h-4 w-4" /> {tt("Add Category", "Ongeza Aina")}
                    </Button>
                  )}
                </div>
                
                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">{tt("Loading categories...", "Inapakia aina...")}</div>
                ) : categories.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><Settings2 className="h-6 w-6 text-muted-foreground" /></div>
                    <h3 className="mt-4 text-lg font-bold text-foreground">{tt("No categories defined", "Hakuna aina zilizofafanuliwa")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tt('Create templates for common fines like "Late to meeting" or "Missed contribution".', 'Unda violezo vya faini za kawaida kama "Kuchelewa kikaoni" au "Kukosa mchango".')}
                    </p>
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
                                <Edit2 className="h-4 w-4 mr-1.5" /> {tt("Edit", "Hariri")}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(c.uuid)} className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2">
                                <Trash2 className="h-4 w-4 mr-1.5" /> {tt("Delete", "Futa")}
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
            <DialogTitle>{tt("Record Fine Payment", "Rekodi Malipo ya Faini")}</DialogTitle>
            <DialogDescription>{tt("Log a payment received for an outstanding fine.", "Rekodi malipo yaliyopokelewa kwa faini iliyosalia.")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
            <FieldGroup>
              <Field>
                <FieldLabel>{tt("Select Fine", "Chagua Faini")}</FieldLabel>
                <FieldContent>
                  <Select value={paymentForm.fine_id} onValueChange={(val) => {
                    const f = payableFines.find(x => x.uuid === val)
                    setPaymentForm({ ...paymentForm, fine_id: val, amount: f ? f.balance : "" })
                  }}>
                    <SelectTrigger><SelectValue placeholder={tt("Select fine", "Chagua faini")} /></SelectTrigger>
                    <SelectContent>
                      {payableFines.map(f => (
                        <SelectItem key={f.uuid} value={f.uuid}>{f.reason} ({formatTzs(Number(f.balance))})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>{tt("Amount (TZS)", "Kiasi (TZS)")}</FieldLabel>
                <FieldContent>
                  <Input type="number" min="1" step="0.01" required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>{tt("Reference (Optional)", "Rejea (Si lazima)")}</FieldLabel>
                <FieldContent>
                <Input placeholder={tt("Receipt #", "Namba ya risiti")} value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
                </FieldContent>
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>{tt("Cancel", "Ghairi")}</Button>
              <Button type="submit" disabled={submitting}>{submitting ? tt("Saving...", "Inahifadhi...") : tt("Record Payment", "Rekodi Malipo")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Fine Modal */}
      <Dialog open={isIssueModalOpen} onOpenChange={(o) => { if (!o && !submitting) setIsIssueModalOpen(false) }}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle>{tt("Issue Penalty", "Toa Adhabu")}</DialogTitle>
            <DialogDescription>{tt("Assign a fine to a group member. They will be notified via email.", "Mpe mwanachama wa kikundi faini. Atajulishwa kupitia barua pepe.")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleIssueSubmit} className="space-y-4 mt-4">
            <FieldGroup>
              <Field>
                <FieldLabel>{tt("Member", "Mwanachama")}</FieldLabel>
                <FieldContent>
                  <Select value={issueForm.membership_uuid} onValueChange={(val) => setIssueForm({...issueForm, membership_uuid: val})}>
                    <SelectTrigger><SelectValue placeholder={tt("Select member", "Chagua mwanachama")} /></SelectTrigger>
                    <SelectContent>
                      {selectedGroupMembers.filter(m => m.is_active).map(m => (
                        <SelectItem key={m.membership_id} value={m.membership_id}>{m.first_name} {m.last_name} ({m.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>{tt("Fine Category", "Aina ya Faini")}</FieldLabel>
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
                    <SelectTrigger><SelectValue placeholder={tt("Select category", "Chagua aina")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">{tt("Custom Fine (No category)", "Faini ya kawaida (hakuna aina)")}</SelectItem>
                      {categories.map(c => <SelectItem key={c.uuid} value={c.uuid}>{c.name} - {formatTzs(Number(c.default_amount))}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>{tt("Reason", "Sababu")}</FieldLabel>
                <FieldContent>
                  <Input required placeholder={tt("E.g. Late for meeting", "Mfano: kuchelewa kikaoni")} value={issueForm.reason} onChange={e => setIssueForm({...issueForm, reason: e.target.value})} disabled={issueForm.fine_category_uuid !== 'custom'} />
                </FieldContent>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>{tt("Amount (TZS)", "Kiasi (TZS)")}</FieldLabel>
                  <FieldContent>
                    <Input required type="number" min="1" step="0.01" value={issueForm.amount} onChange={e => setIssueForm({...issueForm, amount: e.target.value})} />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>{tt("Due Date", "Tarehe ya Malipo")}</FieldLabel>
                  <FieldContent>
                    <DatePicker
                      value={parseDateString(issueForm.due_date)}
                      onChange={(date) => setIssueForm({ ...issueForm, due_date: formatDateToString(date) })}
                      placeholder={tt("Select due date", "Chagua tarehe ya malipo")}
                    />
                  </FieldContent>
                </Field>
              </div>
            </FieldGroup>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsIssueModalOpen(false)}>{tt("Cancel", "Ghairi")}</Button>
              <Button type="submit" disabled={submitting || !issueForm.membership_uuid || !issueForm.due_date}>{submitting ? tt("Issuing...", "Inatoa...") : tt("Issue Fine", "Toa Faini")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={(o) => { if (!o && !submitting) setIsCategoryModalOpen(false) }}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle>{editingCategoryUuid ? tt("Edit Fine Category", "Hariri Aina ya Faini") : tt("New Fine Category", "Aina Mpya ya Faini")}</DialogTitle>
            <DialogDescription>{editingCategoryUuid ? tt("Update the details for this penalty.", "Sasisha maelezo ya adhabu hii.") : tt("Create a reusable fine template for your group.", "Unda kiolezo cha faini kinachoweza kutumika tena kwa kikundi chako.")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4 mt-4">
            <FieldGroup>
              <Field>
                <FieldLabel>{tt("Category Name", "Jina la Aina")}</FieldLabel>
                <FieldContent>
                  <Input required placeholder={tt("E.g. Absence without notice", "Mfano: kutohudhuria bila taarifa")} value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>{tt("Default Amount (TZS)", "Kiasi cha Kawaida (TZS)")}</FieldLabel>
                <FieldContent>
                  <Input required type="number" min="1" step="0.01" placeholder="5000" value={categoryForm.default_amount} onChange={e => setCategoryForm({...categoryForm, default_amount: e.target.value})} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>{tt("Description (Optional)", "Maelezo (Si Lazima)")}</FieldLabel>
                <FieldContent>
                  <Textarea placeholder={tt("Explain when this fine applies", "Eleza wakati faini hii inatumika")} value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} />
                </FieldContent>
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>{tt("Cancel", "Ghairi")}</Button>
              <Button type="submit" disabled={submitting}>{submitting ? tt("Saving...", "Inahifadhi...") : editingCategoryUuid ? tt("Update Category", "Sasisha Aina") : tt("Create Category", "Unda Aina")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
