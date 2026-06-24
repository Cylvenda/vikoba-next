"use client"
import { toast } from "react-toastify"
import { ConfirmModal } from "@/components/ui/confirm-modal"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowRightLeft,
  Layers3,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  WalletCards,
  BadgeInfo,
} from "lucide-react"
import {
  financeServices,
  type LoanInstallment,
  type Loan,
  type LoanProduct,
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

type LoanProductFormState = {
  name: string
  amount: string
  interest_rate: string
  use_group_default_late_fee: boolean
  late_fee_amount: string
  duration_type: "MONTHS" | "WEEKS" | "DAYS"
  duration_count: string
  description: string
}

type LoanRequestFormState = {
  loan_product_id: string
  purpose: string
}

const defaultProductFormState: LoanProductFormState = {
  name: "",
  amount: "",
  interest_rate: "",
  use_group_default_late_fee: true,
  late_fee_amount: "",
  duration_type: "MONTHS",
  duration_count: "",
  description: "",
}

const defaultRequestFormState: LoanRequestFormState = {
  loan_product_id: "",
  purpose: "",
}

const durationLabels: Record<LoanProduct["duration_type"], string> = {
  MONTHS: "Months",
  WEEKS: "Weeks",
  DAYS: "Days",
}

const loanStatusVariants: Record<
  Loan["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "outline",
  REJECTED: "destructive",
  ACTIVE: "default",
  PAID_OFF: "outline",
  OVERDUE: "destructive",
  COMPLETED: "outline",
  DEFAULTED: "destructive",
}

function parseTzsAmount(value: string | number) {
  return Number(value || 0)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-TZ", {
    dateStyle: "medium",
  }).format(new Date(value))
}

function getStatusLabel(status: Loan["status"]) {
  return status.toLowerCase().replaceAll("_", " ")
}

function getErrorMessage(error: unknown): string {
  const errorResponse = (error as {
    response?: {
      data?: {
        detail?: string
        non_field_errors?: string[]
        name?: string[]
        amount?: string[]
        interest_rate?: string[]
        duration_count?: string[]
        group_uuid?: string[]
        loan_product_id?: string[]
        purpose?: string[]
        use_group_default_late_fee?: string[]
        late_fee_amount?: string[]
      }
    }
  })?.response?.data

  return (
    errorResponse?.detail ||
    errorResponse?.non_field_errors?.[0] ||
    errorResponse?.loan_product_id?.[0] ||
    errorResponse?.interest_rate?.[0] ||
    errorResponse?.purpose?.[0] ||
    errorResponse?.name?.[0] ||
    errorResponse?.amount?.[0] ||
    errorResponse?.duration_count?.[0] ||
    errorResponse?.late_fee_amount?.[0] ||
    errorResponse?.group_uuid?.[0] ||
    (error instanceof Error ? error.message : "Something went wrong while saving this loan workflow.")
  )
}

export default function GroupLoansPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const { selectedGroup, selectedGroupMembers } = useGroupStore()
  const user = useAuthUserStore((state) => state.user)
  const router = useRouter()

  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [productSubmitting, setProductSubmitting] = useState(false)
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [actioningLoanUuid, setActioningLoanUuid] = useState<string | null>(null)
  const [disbursingLoanUuid, setDisbursingLoanUuid] = useState<string | null>(null)
  const [deletingProductUuid, setDeletingProductUuid] = useState<string | null>(null)
  const [editingProductUuid, setEditingProductUuid] = useState<string | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isProductDetailsModalOpen, setIsProductDetailsModalOpen] = useState(false)
  const [selectedViewProduct, setSelectedViewProduct] = useState<LoanProduct | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  })

  const [productForm, setProductForm] = useState<LoanProductFormState>(defaultProductFormState)
  const [requestForm, setRequestForm] = useState<LoanRequestFormState>(defaultRequestFormState)
  const [loanFilter, setLoanFilter] = useState<"ALL" | "MY_LOANS" | "ACCEPTED" | "PENDING" | "CANCELED">("ALL")

  const [activePaymentLoan, setActivePaymentLoan] = useState<Loan | null>(null)
  const [paymentChoiceMode, setPaymentChoiceMode] = useState<"FULL" | "INSTALLMENT" | "CUSTOM">("FULL")
  const [paymentChoiceAmount, setPaymentChoiceAmount] = useState("")
  const [selectedLoanInstallments, setSelectedLoanInstallments] = useState<LoanInstallment[]>([])
  const [loanLedgerLoading, setLoanLedgerLoading] = useState(false)

  const currentMembership = selectedGroupMembers.find((member) => member.user_id === user?.uuid)
  const isVerifiedMember = Boolean(currentMembership?.is_active && currentMembership?.is_verified)
  const isTreasurer = currentMembership?.role === "TREASURER"
  const canManageLoanProducts = Boolean(
    isVerifiedMember &&
      (currentMembership?.role === "CHAIRPERSON" || currentMembership?.role === "SECRETARY")
  )

  const selectedLoanProduct = loanProducts.find((product) => product.uuid === requestForm.loan_product_id)
  const activeLoanNextInstallment = useMemo(() => {
    return (
      selectedLoanInstallments.find((installment) => installment.status !== "PAID") ||
      selectedLoanInstallments[0] ||
      null
    )
  }, [selectedLoanInstallments])
  const paymentChoicePreviewAmount = useMemo(() => {
    if (!activePaymentLoan) return "0"

    if (paymentChoiceMode === "INSTALLMENT") {
      return activeLoanNextInstallment?.remaining_balance || "0"
    }

    if (paymentChoiceMode === "CUSTOM") {
      return paymentChoiceAmount || "0"
    }

    return activePaymentLoan.remaining_balance || activePaymentLoan.balance || "0"
  }, [activePaymentLoan, activeLoanNextInstallment, paymentChoiceAmount, paymentChoiceMode])

  const stats = useMemo(() => {
    const totalPrincipal = loans.reduce((sum, loan) => sum + parseTzsAmount(loan.principal_amount), 0)
    const totalOutstanding = loans.reduce((sum, loan) => sum + parseTzsAmount(loan.balance), 0)
    const activeLoans = loans.filter((loan) => ["ACTIVE", "OVERDUE"].includes(loan.status)).length
    const pendingRequests = loans.filter((loan) => loan.status === "PENDING").length

    return {
      totalPrincipal,
      totalOutstanding,
      activeLoans,
      pendingRequests,
    }
  }, [loans])

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (loanFilter === "ALL") return true
      
      const loanBorrower = selectedGroupMembers.find((m) => m.user_id === loan.borrower || m.membership_id === loan.borrower)
      const isCurrentUserLoan = loanBorrower?.user_id === user?.uuid

      if (loanFilter === "MY_LOANS") return isCurrentUserLoan
      if (loanFilter === "ACCEPTED") return ["APPROVED", "PAID_OFF", "COMPLETED"].includes(loan.status)
      if (loanFilter === "PENDING") return loan.status === "PENDING"
      if (loanFilter === "CANCELED") return loan.status === "REJECTED"
      return true
    })
  }, [loans, loanFilter, selectedGroupMembers, user?.uuid])

  useEffect(() => {
    if (!groupId) return

    let isCancelled = false

    const loadLoans = async () => {
      setLoading(true)

      try {
        const [productsResponse, loansResponse] = await Promise.all([
          financeServices.getLoanProducts(groupId),
          financeServices.getLoans(groupId),
        ])

        if (!isCancelled) {
          setLoanProducts(productsResponse.data)
          setLoans(loansResponse.data)
        }
      } catch (loadError: unknown) {
        if (!isCancelled) {
          toast.error(getErrorMessage(loadError))
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void loadLoans()

    return () => {
      isCancelled = true
    }
  }, [groupId])

  const resetProductForm = () => {
    setProductForm(defaultProductFormState)
    setEditingProductUuid(null)
  }

  const resetRequestForm = () => {
    setRequestForm(defaultRequestFormState)
  }

  const openProductDetailsModal = (product: LoanProduct) => {
    setSelectedViewProduct(product)
    setIsProductDetailsModalOpen(true)
  }

  const closeProductDetailsModal = () => {
    setSelectedViewProduct(null)
    setIsProductDetailsModalOpen(false)
  }

  const openLoanDetailsModal = (loan: Loan) => {
    router.push(`/group/${groupId}/loans/${loan.uuid}`)
  }

  const openLoanPaymentChoice = (loan: Loan) => {
    setActivePaymentLoan(loan)
    setPaymentChoiceMode("FULL")
    setPaymentChoiceAmount("")
    setSelectedLoanInstallments([])
    void loadLoanLedger(loan.uuid)
  }

  const closePaymentChoiceModal = () => {
    setActivePaymentLoan(null)
    setPaymentChoiceMode("FULL")
    setPaymentChoiceAmount("")
    setSelectedLoanInstallments([])
  }

  const loadLoanLedger = async (loanUuid: string) => {
    setLoanLedgerLoading(true)
    try {
      const installmentsResponse = await financeServices.getLoanInstallments(loanUuid)
      setSelectedLoanInstallments(installmentsResponse.data)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoanLedgerLoading(false)
    }
  }

  const openProductModal = (product?: LoanProduct) => {

    if (product) {
      setEditingProductUuid(product.uuid)
      setProductForm({
        name: product.name,
        amount: product.amount,
        interest_rate: product.interest_rate,
        use_group_default_late_fee: product.use_group_default_late_fee,
        late_fee_amount: product.late_fee_amount,
        duration_type: product.duration_type,
        duration_count: String(product.duration_count),
        description: product.description || "",
      })
    } else {
      resetProductForm()
    }

    setIsProductModalOpen(true)
  }

  const closeProductModal = () => {
    if (productSubmitting) return
    resetProductForm()
    setIsProductModalOpen(false)
  }

  const closeRequestModal = () => {
    if (requestSubmitting) return
    resetRequestForm()
    setIsRequestModalOpen(false)
  }

  const handleProductInputChange = (
    field: keyof LoanProductFormState,
    value: string | boolean,
  ) => {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleRequestInputChange = (field: keyof LoanRequestFormState, value: string) => {
    setRequestForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!groupId) {
      toast.error("Missing group context for this page.")
      return
    }

    setProductSubmitting(true)

    try {
      const payload = {
        name: productForm.name.trim(),
        amount: productForm.amount.trim(),
        interest_rate: productForm.interest_rate.trim(),
        use_group_default_late_fee: productForm.use_group_default_late_fee,
        late_fee_amount: productForm.use_group_default_late_fee
          ? String(selectedGroup?.default_late_fee_amount ?? "0")
          : productForm.late_fee_amount.trim(),
        duration_type: productForm.duration_type,
        duration_count: Number(productForm.duration_count),
        description: productForm.description.trim(),
      }

      if (editingProductUuid) {
        const response = await financeServices.updateLoanProduct(editingProductUuid, payload)
        setLoanProducts((current) =>
          current.map((item) => (item.uuid === editingProductUuid ? response.data : item))
        )
        toast.success("Loan type updated successfully.")
      } else {
        const response = await financeServices.createLoanProduct({
          ...payload,
          group_uuid: groupId,
        })
        setLoanProducts((current) => [response.data, ...current])
        toast.success("Loan type created successfully.")
      }

      resetProductForm()
      setIsProductModalOpen(false)
    } catch (submitError: unknown) {
      toast.error(getErrorMessage(submitError))
    } finally {
      setProductSubmitting(false)
    }
  }

  const handleLoanRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!groupId) {
      toast.error("Missing group context for this page.")
      return
    }

    if (!selectedLoanProduct) {
      toast.error("Please select a loan type before submitting a request.")
      return
    }

    setRequestSubmitting(true)

    try {
      const response = await financeServices.createLoan({
        group_id: groupId,
        loan_product_id: requestForm.loan_product_id,
        interest_rate: selectedLoanProduct.interest_rate,
        purpose: requestForm.purpose.trim(),
      })

      setLoans((current) => [response.data, ...current])
      toast.success("Loan request submitted successfully.")
      resetRequestForm()
      setIsRequestModalOpen(false)
    } catch (submitError: unknown) {
      toast.error(getErrorMessage(submitError))
    } finally {
      setRequestSubmitting(false)
    }
  }

  const handleDeleteProduct = (product: LoanProduct) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Loan Type",
      description: `Delete the "${product.name}" loan type for ${selectedGroup?.name || "this group"}?`,
      onConfirm: async () => {
        setDeletingProductUuid(product.uuid)
        try {
          await financeServices.deleteLoanProduct(product.uuid)
          setLoanProducts((current) => current.filter((item) => item.uuid !== product.uuid))
          if (editingProductUuid === product.uuid) {
            resetProductForm()
          }
          if (requestForm.loan_product_id === product.uuid) {
            resetRequestForm()
          }
          toast.success("Loan type removed.")
        } catch (deleteError: unknown) {
          toast.error(getErrorMessage(deleteError))
        } finally {
          setDeletingProductUuid(null)
        }
      }
    })
  }


  const updateLoan = (updatedLoan: Loan) => {
    setLoans((current) =>
      current.map((item) => (item.uuid === updatedLoan.uuid ? updatedLoan : item))
    )
  }

  const handleLoanAction = async (loanUuid: string, action: "approve" | "reject") => {
    setActioningLoanUuid(loanUuid)

    try {
      const response =
        action === "approve"
          ? await financeServices.approveLoan(loanUuid)
          : await financeServices.rejectLoan(loanUuid)

      updateLoan(response.data)
      toast.success(
        action === "approve"
          ? "Loan request approved. Awaiting treasurer disbursement."
          : "Loan request rejected."
      )
    } catch (actionError: unknown) {
      toast.error(getErrorMessage(actionError))
    } finally {
      setActioningLoanUuid(null)
    }
  }

  const handleLoanDisbursement = async (loanUuid: string) => {
    setDisbursingLoanUuid(loanUuid)

    try {
      const response = await financeServices.disburseLoan(loanUuid)
      updateLoan(response.data)
      toast.success("Loan payment approved and money marked as sent.")
    } catch (actionError: unknown) {
      toast.error(getErrorMessage(actionError))
    } finally {
      setDisbursingLoanUuid(null)
    }
  }

  const handlePaymentChoiceModeChange = (mode: "FULL" | "INSTALLMENT" | "CUSTOM") => {
    setPaymentChoiceMode(mode)

    if (!activePaymentLoan) return

    if (mode === "FULL") {
      return
    }

    if (mode === "INSTALLMENT") {
      return
    }

    setPaymentChoiceAmount("")
  }

  const continueToPaymentPage = () => {
    if (!activePaymentLoan) return

    const selectedAmount =
      paymentChoiceMode === "CUSTOM"
        ? parseFloat(paymentChoiceAmount || "0")
        : paymentChoiceMode === "INSTALLMENT"
          ? parseFloat(activeLoanNextInstallment?.remaining_balance || "0")
          : parseFloat(activePaymentLoan.remaining_balance || activePaymentLoan.balance)
    if (!Number.isFinite(selectedAmount) || selectedAmount <= 0) {
      toast.error("Please choose a valid repayment amount.")
      return
    }

    if (selectedAmount > parseFloat(activePaymentLoan.remaining_balance || activePaymentLoan.balance)) {
      toast.error("The repayment amount cannot exceed the remaining balance.")
      return
    }

    const installmentNumber = paymentChoiceMode === "INSTALLMENT" ? activeLoanNextInstallment?.installment_number : undefined
    const installmentUuid = paymentChoiceMode === "INSTALLMENT" ? activeLoanNextInstallment?.uuid : undefined
    const lateFeeAmount =
      paymentChoiceMode === "INSTALLMENT"
        ? parseFloat(activeLoanNextInstallment?.late_fee_balance || "0")
        : parseFloat(activePaymentLoan.accrued_late_fee_amount || "0")
    const overdueInstallments =
      paymentChoiceMode === "INSTALLMENT"
        ? parseFloat(activeLoanNextInstallment?.late_fee_balance || "0") > 0
          ? 1
          : 0
        : activePaymentLoan.overdue_installments_count || 0

    closePaymentChoiceModal()
    router.push(
      `/group/${groupId}/payment?type=loan&id=${activePaymentLoan.uuid}&amount=${selectedAmount}&mode=${paymentChoiceMode.toLowerCase()}${installmentUuid ? `&installment=${installmentUuid}` : ""}${installmentNumber ? `&installment_number=${installmentNumber}` : ""}&late_fee_amount=${lateFeeAmount}&overdue_installments=${overdueInstallments}`
    )
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
                  {canManageLoanProducts ? "Finance management" : "Member borrowing"}
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Loan types and requests
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {canManageLoanProducts
                  ? "Define loan types, review member requests, and keep repayment snapshots accurate for reporting."
                  : "Browse the available loan types, submit a request, and track your active loan balance in one place."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
              {isVerifiedMember ? (
                <Button onClick={() => setIsRequestModalOpen(true)} disabled={loanProducts.length === 0}>
                  <Plus className="h-4 w-4" />
                  Request loan
                </Button>
              ) : null}
              {canManageLoanProducts ? (
                <Button variant="outline" onClick={() => openProductModal()}>
                  <Plus className="h-4 w-4" />Add loan type</Button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-4">
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Loan types
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{loanProducts.length}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Distinct loan products your group offers (e.g. Emergency, Business).
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Total principal
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(stats.totalPrincipal)}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Total raw capital disbursed to borrowers, excluding interest &amp; fees.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Active loans
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{stats.activeLoans}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Loans currently approved, disbursed, and in the repayment phase.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Outstanding balance
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatTzs(stats.totalOutstanding)}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Total amount still owed across all active loans, including interest &amp; late fees.
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="types" className="space-y-4">
          <TabsList className={`grid w-full ${isTreasurer ? "grid-cols-4" : "grid-cols-3"} bg-card/70`}>
            <TabsTrigger value="types" className="gap-2">
              <Layers3 className="h-4 w-4" />Loan types</TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <ReceiptText className="h-4 w-4" />
              Loans
            </TabsTrigger>
            {isTreasurer ? (
              <TabsTrigger value="payments" className="gap-2">
                <WalletCards className="h-4 w-4" />
                Payment approval
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="repayments" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Repayments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types">
            <Card className="border-border/70 bg-card/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-chart-4">
                      Loan Catalog
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      Available loan types
                    </h2>
                  </div>
                  {canManageLoanProducts ? (
                    <Button variant="outline" onClick={() => openProductModal()}>
                      <Plus className="h-4 w-4" />New loan type</Button>
                  ) : null}
                </div>

                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading loan types...</div>
                ) : loanProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-4/10 text-chart-4">
                      <WalletCards className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-foreground">No loan types yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {canManageLoanProducts
                        ? "Create a product with a fixed amount, interest rate, and duration so members can request against it."
                        : "Your group leaders have not published any loan types yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loanProducts.map((product) => {
                      const principal = parseTzsAmount(product.amount)

                      return (
                        <div
                          key={product.uuid}
                          className="group flex flex-row items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-chart-4/15 text-chart-4 text-sm font-extrabold flex items-center justify-center shrink-0 border border-chart-4/20">
                            <Layers3 className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {product.name}
                              </span>
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0">
                                {product.duration_count} {durationLabels[product.duration_type]}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{product.interest_rate}% interest rate</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {product.use_group_default_late_fee
                                ? selectedGroup?.default_late_fee_amount
                                  ? `Uses group default penalty of TZS ${parseTzsAmount(selectedGroup.default_late_fee_amount).toLocaleString()}`
                                  : "Uses group default penalty"
                                : `Custom penalty: TZS ${parseTzsAmount(product.late_fee_amount).toLocaleString()} per overdue installment`}
                            </p>
                          </div>

                          <div className="hidden sm:flex flex-col items-end shrink-0">
                            <span className="text-sm font-bold text-foreground">
                              {formatTzs(principal)}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Principal
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <Button variant="ghost" size="sm" className="h-8 px-2 rounded-xl" onClick={() => openProductDetailsModal(product)}>
                              <BadgeInfo className="h-4 w-4 sm:mr-1" />
                              <span className="text-xs hidden sm:inline">View details</span>
                            </Button>
                            {canManageLoanProducts ? (
                              <>
                                <Button variant="ghost" size="sm" className="h-8 px-2 rounded-xl" onClick={() => openProductModal(product)}>
                                  <Pencil className="h-4 w-4 sm:mr-1" />
                                  <span className="text-xs hidden sm:inline">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => void handleDeleteProduct(product)}
                                  disabled={deletingProductUuid === product.uuid}
                                >
                                  <Trash2 className="h-4 w-4 sm:mr-1" />
                                  <span className="text-xs hidden sm:inline">{deletingProductUuid === product.uuid ? "..." : "Delete"}</span>
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="border-border/70 bg-card/80 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-chart-3">
                      Loan Register
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      Submitted loans
                    </h2>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1 bg-muted/40 p-1 rounded-xl w-max border border-border/40">
                    <Button
                      variant={loanFilter === "ALL" ? "secondary" : "ghost"}
                      size="sm"
                      className={`h-8 rounded-lg text-xs font-semibold ${loanFilter === "ALL" ? "bg-background shadow-sm border border-border/50" : ""}`}
                      onClick={() => setLoanFilter("ALL")}
                    >
                      All
                    </Button>
                    <Button
                      variant={loanFilter === "MY_LOANS" ? "secondary" : "ghost"}
                      size="sm"
                      className={`h-8 rounded-lg text-xs font-semibold ${loanFilter === "MY_LOANS" ? "bg-background shadow-sm border border-border/50 text-primary" : ""}`}
                      onClick={() => setLoanFilter("MY_LOANS")}
                    >
                      My loans
                    </Button>
                    <Button
                      variant={loanFilter === "ACCEPTED" ? "secondary" : "ghost"}
                      size="sm"
                      className={`h-8 rounded-lg text-xs font-semibold ${loanFilter === "ACCEPTED" ? "bg-background shadow-sm border border-border/50 text-chart-2" : ""}`}
                      onClick={() => setLoanFilter("ACCEPTED")}
                    >
                      Accepted
                    </Button>
                    <Button
                      variant={loanFilter === "PENDING" ? "secondary" : "ghost"}
                      size="sm"
                      className={`h-8 rounded-lg text-xs font-semibold ${loanFilter === "PENDING" ? "bg-background shadow-sm border border-border/50 text-chart-4" : ""}`}
                      onClick={() => setLoanFilter("PENDING")}
                    >
                      Pending
                    </Button>
                    <Button
                      variant={loanFilter === "CANCELED" ? "secondary" : "ghost"}
                      size="sm"
                      className={`h-8 rounded-lg text-xs font-semibold ${loanFilter === "CANCELED" ? "bg-background shadow-sm border border-border/50 text-destructive" : ""}`}
                      onClick={() => setLoanFilter("CANCELED")}
                    >
                      Canceled
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading loans...</div>
                ) : filteredLoans.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-3/10 text-chart-3">
                      <ReceiptText className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-foreground">
                      {loans.length === 0 ? "No loans recorded yet" : "No loans match this filter"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {loans.length === 0 
                        ? (isVerifiedMember ? "Loan requests will appear here after a member submits a request." : "Verified members can submit loan requests from this workspace.")
                        : "Try selecting a different filter above to see other loan requests."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLoans.map((loan) => {
                      const loanBorrower = selectedGroupMembers.find((m) => m.user_id === loan.borrower || m.membership_id === loan.borrower)
                      const displayBorrowerName = loanBorrower 
                        ? `${loanBorrower.first_name} ${loanBorrower.last_name}`.trim() || loanBorrower.email 
                        : loan.borrower_name || "Unnamed member"

                      const isCurrentUserLoan = loanBorrower?.user_id === user?.uuid

                      return (
                        <div
                          key={loan.uuid}
                          className={`group flex flex-row items-center gap-4 p-4 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all relative overflow-hidden ${isCurrentUserLoan ? "border-primary/50 shadow-primary/10" : "border-border/50"}`}
                        >
                          <div className="w-10 h-10 rounded-2xl bg-chart-3/15 text-chart-3 text-sm font-extrabold flex items-center justify-center shrink-0 border border-chart-3/20">
                            <ReceiptText className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {displayBorrowerName}
                              </span>
                            <Badge variant={loanStatusVariants[loan.status]} className="text-[10px] h-5 px-1.5 py-0 uppercase">
                              {getStatusLabel(loan.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{loan.loan_product_name}</p>
                        </div>

                        <div className="hidden sm:flex flex-col items-end shrink-0">
                          <span className="text-sm font-bold text-foreground">
                            {formatTzs(parseTzsAmount(loan.total_repayment_amount))}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Total repayment
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2 rounded-xl" onClick={() => openLoanDetailsModal(loan)}>
                            <BadgeInfo className="h-4 w-4 sm:mr-1" />
                            <span className="text-xs hidden sm:inline">View details</span>
                          </Button>
                          {canManageLoanProducts && loan.status === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                className="h-8 px-3 rounded-xl text-xs bg-chart-3/15 text-chart-3 hover:bg-chart-3/25 border border-chart-3/20 font-bold"
                                onClick={() => void handleLoanAction(loan.uuid, "approve")}
                                disabled={actioningLoanUuid === loan.uuid}
                              >
                                {actioningLoanUuid === loan.uuid ? "..." : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 rounded-xl text-xs text-destructive hover:bg-destructive/10 border-destructive/20 font-bold"
                                onClick={() => void handleLoanAction(loan.uuid, "reject")}
                                disabled={actioningLoanUuid === loan.uuid}
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isTreasurer ? (
            <TabsContent value="payments" className="space-y-6">
              <Card className="border-border/50 bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-foreground">Payment Approval</h2>
                      <p className="text-sm text-muted-foreground mt-1">Approve approved loans so the money can be sent to the borrower.</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-widest">
                      {loans.filter((loan) => loan.status === "APPROVED").length} waiting
                    </Badge>
                  </div>

                  {(() => {
                    const awaitingDisbursement = loans.filter((loan) => loan.status === "APPROVED")
                    if (awaitingDisbursement.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                            <WalletCards className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-base font-semibold text-foreground">No approved loans waiting for payment approval</p>
                          <p className="text-sm text-muted-foreground mt-1">Once a chairperson approves a loan request, it will appear here for treasurer disbursement.</p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-3">
                        {awaitingDisbursement.map((loan) => {
                          const loanBorrower = selectedGroupMembers.find((m) => m.user_id === loan.borrower || m.membership_id === loan.borrower)
                          const displayBorrowerName = loanBorrower
                            ? `${loanBorrower.first_name} ${loanBorrower.last_name}`.trim() || loanBorrower.email
                            : loan.borrower_name || "Unnamed member"

                          return (
                            <div
                              key={loan.uuid}
                              className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all"
                            >
                              <div className="w-10 h-10 rounded-2xl bg-chart-4/15 text-chart-4 flex items-center justify-center shrink-0">
                                <WalletCards className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm text-foreground">{displayBorrowerName}</span>
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0 text-chart-4 border-chart-4/30 uppercase">
                                    Awaiting send
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{loan.loan_product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Approved at {loan.approved_at ? formatDate(loan.approved_at) : "N/A"} • Amount {formatTzs(parseTzsAmount(loan.principal_amount))}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button variant="ghost" size="sm" className="h-8 px-2 rounded-xl" onClick={() => openLoanDetailsModal(loan)}>
                                  <BadgeInfo className="h-4 w-4 sm:mr-1" />
                                  <span className="text-xs hidden sm:inline">View details</span>
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 px-3 rounded-xl text-xs bg-chart-3/15 text-chart-3 hover:bg-chart-3/25 border border-chart-3/20 font-bold"
                                  onClick={() => void handleLoanDisbursement(loan.uuid)}
                                  disabled={disbursingLoanUuid === loan.uuid}
                                >
                                  {disbursingLoanUuid === loan.uuid ? "..." : "Approve payment"}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}

          <TabsContent value="repayments" className="space-y-6">
            <Card className="border-border/50 bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">My Active Loans</h2>
                    <p className="text-sm text-muted-foreground mt-1">Select a loan below to make a repayment.</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-widest">
                    {loans.filter((l) => ["ACTIVE", "OVERDUE"].includes(l.status) && (l.borrower === currentMembership?.membership_id || l.borrower_name === `${user?.firstName} ${user?.lastName}`)).length} active
                  </Badge>
                </div>

                {(() => {
                  const myActiveLoans = loans.filter(
                    (l) => ["ACTIVE", "OVERDUE"].includes(l.status) && (l.borrower === currentMembership?.membership_id || l.borrower_name === `${user?.firstName} ${user?.lastName}`)
                  )
                  if (myActiveLoans.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                          <WalletCards className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-base font-semibold text-foreground">No active loans</p>
                        <p className="text-sm text-muted-foreground mt-1">You have no active loans to repay right now.</p>
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-3">
                      {myActiveLoans.map((loan) => {
                        const progress = Math.min(
                          100,
                          Math.round((parseFloat(loan.total_paid) / parseFloat(loan.total_repayment_amount)) * 100)
                        )
                        return (
                          <div
                            key={loan.uuid}
                            className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all"
                          >
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <ReceiptText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-foreground">{loan.loan_product_name}</span>
                                {progress >= 100 ? (
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0 text-chart-3 border-chart-3/40">
                                    Fully Paid
                                  </Badge>
                                ) : loan.status === "OVERDUE" ? (
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0 text-destructive border-destructive/40">
                                    Overdue
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0 text-green-600 border-green-500/40">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>Principal: <strong className="text-foreground">{formatTzs(parseFloat(loan.principal_amount))}</strong></span>
                                <span>Paid: <strong className="text-chart-3">{formatTzs(parseFloat(loan.total_paid))}</strong></span>
                                <span>Balance: <strong className="text-destructive">{formatTzs(parseFloat(loan.balance))}</strong></span>
                                <span>Due: <strong className="text-foreground">{loan.due_date}</strong></span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-chart-3' : 'bg-primary'}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground">{progress}% repaid</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl gap-2"
                                onClick={() => openLoanDetailsModal(loan)}
                              >
                                <BadgeInfo className="w-4 h-4" />
                                Details
                              </Button>
                              {progress < 100 && (
                              <Button
                                size="sm"
                                className="rounded-xl gap-2"
                                onClick={() => openLoanPaymentChoice(loan)}
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                                Pay
                              </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Modal */}
      <Dialog
        open={!!activePaymentLoan}
        onOpenChange={(open) => {
          if (!open) closePaymentChoiceModal()
        }}
      >
        <DialogContent className="sm:max-w-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Choose repayment amount</DialogTitle>
            <DialogDescription>
              Pick whether to clear the full balance, pay the next installment, or enter a custom amount before we open the payment page.
            </DialogDescription>
          </DialogHeader>

          {activePaymentLoan ? (
            <div className="mt-4 space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handlePaymentChoiceModeChange("FULL")}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    paymentChoiceMode === "FULL"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/60 bg-card hover:border-primary/40"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Full balance
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-foreground">
                    {formatTzs(parseFloat(activePaymentLoan.remaining_balance || activePaymentLoan.balance))}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Settle everything that remains on the loan.</p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentChoiceModeChange("INSTALLMENT")}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    paymentChoiceMode === "INSTALLMENT"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/60 bg-card hover:border-primary/40"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Next installment
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-foreground">
                    {activeLoanNextInstallment
                      ? formatTzs(parseFloat(activeLoanNextInstallment.remaining_balance))
                      : "Loading..."}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pay the oldest unpaid installment first.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentChoiceModeChange("CUSTOM")}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    paymentChoiceMode === "CUSTOM"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/60 bg-card hover:border-primary/40"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Custom amount
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-foreground">You choose</p>
                  <p className="mt-1 text-xs text-muted-foreground">Enter any amount up to the remaining balance.</p>
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Selected amount
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">
                    {formatTzs(parseFloat(paymentChoicePreviewAmount))}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {paymentChoiceMode === "FULL"
                      ? "You will clear the remaining balance."
                      : paymentChoiceMode === "INSTALLMENT"
                        ? "You will pay the next unpaid installment."
                        : "Use any amount that works for you."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Loan summary
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Loan type</span>
                      <span className="font-semibold text-foreground">{activePaymentLoan.loan_product_name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Remaining balance</span>
                      <span className="font-semibold text-foreground">
                        {formatTzs(parseFloat(activePaymentLoan.remaining_balance || activePaymentLoan.balance))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Repayment mode</span>
                      <span className="font-semibold text-foreground capitalize">
                        {paymentChoiceMode.toLowerCase()}
                      </span>
                    </div>
                    {paymentChoiceMode === "INSTALLMENT" && activeLoanNextInstallment ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Installment</span>
                        <span className="font-semibold text-foreground">
                          #{activeLoanNextInstallment.installment_number} due {formatDate(activeLoanNextInstallment.due_date)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {paymentChoiceMode === "CUSTOM" ? (
                <Field>
                  <FieldLabel>Custom amount (TZS)</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      max={activePaymentLoan.remaining_balance || activePaymentLoan.balance}
                      placeholder={`Max: ${formatTzs(parseFloat(activePaymentLoan.remaining_balance || activePaymentLoan.balance))}`}
                      value={paymentChoiceAmount}
                      onChange={(event) => setPaymentChoiceAmount(event.target.value)}
                    />
                  </FieldContent>
                </Field>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={closePaymentChoiceModal}>
                  Cancel
                </Button>
                <Button type="button" onClick={continueToPaymentPage} disabled={loanLedgerLoading && paymentChoiceMode === "INSTALLMENT"}>
                  Continue to payment
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
        </Tabs>
      </div>

      <Dialog open={isRequestModalOpen} onOpenChange={(open) => { if (!open) closeRequestModal() }}>
        <DialogContent className="sm:max-w-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Request loan</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Choose a loan type and submit the request for review.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleLoanRequestSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Loan type</FieldLabel>
                <FieldContent>
                  <Select
                    value={requestForm.loan_product_id}
                    onValueChange={(value) => handleRequestInputChange("loan_product_id", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanProducts.map((product) => (
                        <SelectItem key={product.uuid} value={product.uuid}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    The selected loan type determines the principal amount, interest rate, and repayment window.
                  </FieldDescription>
                </FieldContent>
              </Field>

              {selectedLoanProduct ? (
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatTzs(parseTzsAmount(selectedLoanProduct.amount))}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {selectedLoanProduct.duration_count} {durationLabels[selectedLoanProduct.duration_type]}
                      </p>
                    </div>
                    <Badge variant="secondary" className="uppercase">
                      {selectedLoanProduct.interest_rate}% interest
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="uppercase">
                      {selectedLoanProduct.use_group_default_late_fee ? "Group default penalty" : "Custom penalty"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {selectedLoanProduct.use_group_default_late_fee
                        ? selectedGroup?.default_late_fee_amount
                          ? `TZS ${parseTzsAmount(selectedGroup.default_late_fee_amount).toLocaleString()} per overdue installment`
                          : "No group default penalty configured"
                        : `TZS ${parseTzsAmount(selectedLoanProduct.late_fee_amount).toLocaleString()} per overdue installment`}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {selectedLoanProduct.description || "No extra description added for this loan type."}
                  </p>
                </div>
              ) : null}

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
              <Button type="submit" disabled={requestSubmitting || loanProducts.length === 0}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {requestSubmitting ? "Submitting..." : "Submit request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductModalOpen} onOpenChange={(open) => { if (!open) closeProductModal() }}>
        <DialogContent className="sm:max-w-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">
              {editingProductUuid ? "Update loan type" : "Add loan type"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Define the principal amount, interest rate, and repayment window members can request.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleProductSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="loan-name">Loan type name</FieldLabel>
                <FieldContent>
                  <Input
                    id="loan-name"
                    placeholder="Emergency support"
                    value={productForm.name}
                    onChange={(event) => handleProductInputChange("name", event.target.value)}
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
                    value={productForm.amount}
                    onChange={(event) => handleProductInputChange("amount", event.target.value)}
                    required
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="loan-interest-rate">Interest rate (%)</FieldLabel>
                <FieldContent>
                  <Input
                    id="loan-interest-rate"
                    inputMode="decimal"
                    min="0"
                    placeholder="10"
                    value={productForm.interest_rate}
                    onChange={(event) => handleProductInputChange("interest_rate", event.target.value)}
                    required
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Late payment penalty</FieldLabel>
                <FieldContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleProductInputChange("use_group_default_late_fee", true)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        productForm.use_group_default_late_fee
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/60 bg-card hover:border-primary/40"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Use group default
                      </p>
                      <p className="mt-2 text-base font-extrabold text-foreground">
                        {selectedGroup?.default_late_fee_amount
                          ? formatTzs(parseTzsAmount(selectedGroup.default_late_fee_amount))
                          : "No default set"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Apply the shared late fee from group settings to this loan type.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleProductInputChange("use_group_default_late_fee", false)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        !productForm.use_group_default_late_fee
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/60 bg-card hover:border-primary/40"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Custom penalty
                      </p>
                      <p className="mt-2 text-base font-extrabold text-foreground">
                        Enter your own
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Set a specific late fee amount for this loan type.
                      </p>
                    </button>
                  </div>

                  {!productForm.use_group_default_late_fee ? (
                    <div className="mt-3">
                      <Input
                        id="loan-late-fee-amount"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="5000"
                        value={productForm.late_fee_amount}
                        onChange={(event) => handleProductInputChange("late_fee_amount", event.target.value)}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        This amount is charged per overdue installment.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      The loan type will inherit the group default late fee setting.
                    </p>
                  )}
                </FieldContent>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Duration unit</FieldLabel>
                  <FieldContent>
                    <Select
                      value={productForm.duration_type}
                      onValueChange={(value) =>
                        handleProductInputChange("duration_type", value as LoanProductFormState["duration_type"])
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
                      value={productForm.duration_count}
                      onChange={(event) =>
                        handleProductInputChange("duration_count", event.target.value)
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
                    value={productForm.description}
                    onChange={(event) => handleProductInputChange("description", event.target.value)}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={closeProductModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={productSubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                {productSubmitting
                  ? editingProductUuid
                    ? "Saving..."
                    : "Creating..."
                  : editingProductUuid
                    ? "Save changes"
                    : "Create loan type"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDetailsModalOpen} onOpenChange={(open) => { if (!open) closeProductDetailsModal() }}>
        <DialogContent className="sm:max-w-md p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Loan type details</DialogTitle>
          </DialogHeader>

          {selectedViewProduct ? (
            <div className="mt-4 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Loan type name</p>
                <p className="mt-1 font-semibold text-foreground">{selectedViewProduct.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Amount</p>
                  <p className="mt-1 font-semibold text-foreground">{formatTzs(parseTzsAmount(selectedViewProduct.amount))}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Interest rate</p>
                  <p className="mt-1 font-semibold text-foreground">{selectedViewProduct.interest_rate}%</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-border/70 bg-card/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Duration</p>
                  <p className="mt-1 font-semibold text-foreground">{selectedViewProduct.duration_count} {durationLabels[selectedViewProduct.duration_type]}</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-border/70 bg-card/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Late payment penalty</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="uppercase">
                      {selectedViewProduct.use_group_default_late_fee ? "Group default" : "Custom"}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {selectedViewProduct.use_group_default_late_fee
                        ? selectedGroup?.default_late_fee_amount
                          ? formatTzs(parseTzsAmount(selectedGroup.default_late_fee_amount))
                          : "No default configured"
                        : formatTzs(parseTzsAmount(selectedViewProduct.late_fee_amount))}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Charged per overdue installment.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Description</p>
                <p className="mt-1 text-sm text-foreground">{selectedViewProduct.description || "No description provided."}</p>
              </div>

              <div className="flex flex-wrap items-center justify-end border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={closeProductDetailsModal}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
      />
    </div>
  )
}
