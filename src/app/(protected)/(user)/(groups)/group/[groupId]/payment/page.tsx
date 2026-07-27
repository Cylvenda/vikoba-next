"use client"

import React, { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useGroupStore } from "@/store/group/groupUser.store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatTzs } from "@/lib/vikoba-finance"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Loader2,
  XCircle,
  CircleAlert,
} from "lucide-react"
import { toast } from "react-toastify"
import Link from "next/link"
import { financeServices, type Loan } from "@/api/services/finance.service"
import { paymentServices } from "@/api/services/payment.service"
import { useLanguage } from "@/components/language/language-provider"

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const groupId = params.groupId as string
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  
  const type = searchParams.get("type") || "unknown"
  const loanId = searchParams.get("id") || ""
  const amountStr = searchParams.get("amount") || "0"
  const paymentMode = searchParams.get("mode") || "full"
  const installmentNumber = searchParams.get("installment_number") || ""
  const lateFeeAmount = parseFloat(searchParams.get("late_fee_amount") || "0")
  const overdueInstallments = parseInt(searchParams.get("overdue_installments") || "0", 10)
  const amount = parseFloat(amountStr)
  const principalAndInterestAmount = Math.max(0, amount - lateFeeAmount)
  const hasLateFee = lateFeeAmount > 0

  const paymentModeLabel =
    type === "saving" 
      ? tt("Savings Deposit", "Amana ya Akiba")
      : type === "fine"
        ? tt("Penalty Settlement", "Malipo ya Adhabu")
        : paymentMode === "installment"
          ? tt("Installment payment", "Malipo ya awamu")
          : paymentMode === "custom"
            ? tt("Custom amount", "Kiasi maalum")
            : tt("Full balance payment", "Malipo ya salio lote")
  
  const { selectedGroup, fetchGroupById } = useGroupStore()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [failMessage, setFailMessage] = useState("")
  const [paymentError, setPaymentError] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("mobile") // 'mobile' or 'card'
  const [loanContext, setLoanContext] = useState<Loan | null>(null)
  const [loanContextLoading, setLoanContextLoading] = useState(type === "loan")

  // Mobile Money State
  const [phoneNumber, setPhoneNumber] = useState("")
  
  // Card State
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [nameOnCard, setNameOnCard] = useState("")

  useEffect(() => {
    if (groupId && !selectedGroup) {
      fetchGroupById(groupId)
    }
  }, [groupId, selectedGroup, fetchGroupById])

  useEffect(() => {
    let cancelled = false

    const loadLoanContext = async () => {
      if (type !== "loan") {
        setLoanContext(null)
        setLoanContextLoading(false)
        return
      }

      if (!groupId || !loanId) {
        setLoanContext(null)
        setLoanContextLoading(false)
        return
      }

      setLoanContextLoading(true)

      try {
        const loansResponse = await financeServices.getLoans(groupId)
        if (cancelled) return

        const foundLoan = loansResponse.data.find((item) => item.uuid === loanId) || null
        setLoanContext(foundLoan)
      } catch (error: unknown) {
        if (!cancelled) {
          toast.error(
            (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
              (error instanceof Error ? error.message : (language === "sw" ? "Imeshindikana kupakia maelezo ya mkopo." : "Unable to load loan details."))
          )
          setLoanContext(null)
        }
      } finally {
        if (!cancelled) {
          setLoanContextLoading(false)
        }
      }
    }

    void loadLoanContext()

    return () => {
      cancelled = true
    }
  }, [groupId, language, loanId, type])

  const isLoanRepayable = Boolean(
    loanContext && ["ACTIVE", "OVERDUE"].includes(loanContext.status)
  )

  const getPaymentContextInfo = () => {
    switch (type) {
      case "loan":
        return {
          title: tt("Loan Repayment", "Marejesho ya Mkopo"),
          description: tt("Make a payment towards your active or overdue loan balance.", "Lipa salio la mkopo wako unaoendelea au uliochelewa."),
          backLink: `/group/${groupId}/loans`,
          backLabel: tt("Back to Loans", "Rudi kwenye Mikopo")
        }
      case "saving":
        return {
          title: tt("Savings Deposit", "Amana ya Akiba"),
          description: tt("Add funds to your group savings account.", "Ongeza fedha kwenye akiba yako ya kikundi."),
          backLink: `/group/${groupId}/savings`,
          backLabel: tt("Back to Savings", "Rudi kwenye Akiba")
        }
      case "fine":
        return {
          title: tt("Fine Payment", "Malipo ya Faini"),
          description: tt("Settle an outstanding fine.", "Lipa faini ambayo haijalipwa."),
          backLink: `/group/${groupId}/fines`, // Assuming this exists or will exist
          backLabel: tt("Back to Fines", "Rudi kwenye Faini")
        }
      default:
        return {
          title: tt("Secure Payment", "Malipo Salama"),
          description: tt("Complete your transaction.", "Kamilisha muamala wako."),
          backLink: `/group/${groupId}`,
          backLabel: tt("Back to Group", "Rudi kwenye Kikundi")
        }
    }
  }

  const contextInfo = getPaymentContextInfo()

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (paymentMethod === "mobile") {
      if (!phoneNumber.trim()) {
        newErrors.phone = tt("Phone number is required", "Namba ya simu inahitajika")
      } else if (phoneNumber.replace(/\D/g, '').length < 10) {
        newErrors.phone = tt("Enter a valid phone number", "Ingiza namba sahihi ya simu")
      }
    } else {
      if (!cardNumber.trim()) {
        newErrors.cardNumber = tt("Card number is required", "Namba ya kadi inahitajika")
      } else if (cardNumber.replace(/\D/g, '').length < 15) {
        newErrors.cardNumber = tt("Enter a valid card number", "Ingiza namba sahihi ya kadi")
      }
      
      if (!expiry.trim()) {
        newErrors.expiry = tt("Required", "Inahitajika")
      } else if (expiry.length < 5) {
        newErrors.expiry = tt("Use MM/YY", "Tumia MM/YY")
      }
      
      if (!cvc.trim()) {
        newErrors.cvc = tt("Required", "Inahitajika")
      } else if (cvc.length < 3) {
        newErrors.cvc = tt("Invalid CVC", "CVC si sahihi")
      }
      
      if (!nameOnCard.trim()) {
        newErrors.nameOnCard = tt("Name is required", "Jina linahitajika")
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (type === "loan" && (!loanContext || !isLoanRepayable)) {
      toast.error(
        loanContext?.status === "PENDING"
          ? tt("This loan is still pending approval.", "Mkopo huu bado unasubiri idhini.")
          : loanContext?.status === "APPROVED"
            ? tt("This loan has not been disbursed yet.", "Mkopo huu bado haujatolewa.")
            : tt("Repayments are only allowed for active or overdue loans.", "Marejesho yanaruhusiwa kwa mikopo inayoendelea au iliyochelewa pekee.")
      )
      return
    }
    
    setIsProcessing(true)
    setPaymentError("")

    try {
      if (type === "loan") {
        if (!loanId) throw new Error(tt("Loan ID is missing.", "Kitambulisho cha mkopo kinakosekana."))
        
        const backendMethod = paymentMethod === "mobile" ? "MOBILE_MONEY" : "CREDIT_CARD"
        const reference = paymentMethod === "mobile" ? phoneNumber : cardNumber.replace(/\s/g, "")
        
        if (paymentMethod === "mobile") {
          const res = await paymentServices.initiateCollection({
            phone: phoneNumber,
            amount: amount.toString(),
            purpose: "LOAN_REPAYMENT",
            target_uuid: loanId,
          })
          setIsPolling(true)
          pollTransactionStatus(res.data.transaction_uuid)
          return
        } else {
          await financeServices.repayLoan(loanId, {
            amount: amount.toString(),
            payment_method: backendMethod,
            reference: reference,
          })
        }
      } else if (type === "saving") {
        if (!loanId) throw new Error(tt("Contribution ID is missing.", "Kitambulisho cha mchango kinakosekana."))

        if (paymentMethod === "mobile") {
          const res = await paymentServices.initiateCollection({
            phone: phoneNumber,
            amount: amount.toString(),
            purpose: "CONTRIBUTION",
            target_uuid: loanId,
          })
          setIsPolling(true)
          pollTransactionStatus(res.data.transaction_uuid)
          return
        } else {
          throw new Error(tt("Credit Card payments for savings are coming soon. Please use Mobile Money.", "Malipo ya akiba kwa kadi yanakuja hivi karibuni. Tafadhali tumia fedha za simu."))
        }
      } else if (type === "fine") {
        if (!loanId) throw new Error(tt("Fine ID is missing.", "Kitambulisho cha faini kinakosekana."))

        if (paymentMethod === "mobile") {
          const res = await paymentServices.initiateCollection({
            phone: phoneNumber,
            amount: amount.toString(),
            purpose: "PENALTY_PAYMENT",
            target_uuid: loanId,
          })
          setIsPolling(true)
          pollTransactionStatus(res.data.transaction_uuid)
          return
        } else {
          throw new Error(tt("Credit Card payments for fines are coming soon. Please use Mobile Money.", "Malipo ya faini kwa kadi yanakuja hivi karibuni. Tafadhali tumia fedha za simu."))
        }
      }

      setIsSuccess(true)
      toast.success(tt("Payment processed successfully!", "Malipo yamekamilika kwa mafanikio!"))

      // Redirect back after short delay showing success state
      setTimeout(() => {
        router.push(contextInfo.backLink)
        router.refresh()
      }, 2000)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err instanceof Error ? err.message : tt("Payment failed. Please try again.", "Malipo yameshindikana. Tafadhali jaribu tena."))
      setPaymentError(message)
      setIsProcessing(false)
      setIsPolling(false)
      toast.error(message)
    }
  }

  const pollTransactionStatus = (uuid: string) => {
    let attempts = 0
    const maxAttempts = 30 // 5 minutes max (every 10 seconds)
    
    const interval = setInterval(async () => {
      try {
        attempts++
        const res = await paymentServices.getTransactionStatus(uuid)
        const status = res.data.status

        if (status === "SUCCESS") {
          clearInterval(interval)
          setIsPolling(false)
          setIsSuccess(true)
          toast.success(tt("Payment processed successfully!", "Malipo yamekamilika kwa mafanikio!"))
          setTimeout(() => {
            router.push(contextInfo.backLink)
            router.refresh()
          }, 2000)
        } else if (status === "FAILED") {
          clearInterval(interval)
          setIsPolling(false)
          setIsProcessing(false)
          setIsFailed(true)
          setFailMessage(tt("Payment failed or was rejected. Please try again.", "Malipo yameshindikana au yamekataliwa. Tafadhali jaribu tena."))
        } else if (status === "EXPIRED") {
          clearInterval(interval)
          setIsPolling(false)
          setIsProcessing(false)
          setIsFailed(true)
          setFailMessage(tt("Payment prompt expired. Please try again.", "Ombi la malipo limepitwa na muda. Tafadhali jaribu tena."))
        } else if (status === "CANCELLED") {
          clearInterval(interval)
          setIsPolling(false)
          setIsProcessing(false)
          setIsFailed(true)
          setFailMessage(tt("Payment was cancelled.", "Malipo yameghairiwa."))
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(interval)
          setIsPolling(false)
          setIsProcessing(false)
          setIsFailed(true)
          setFailMessage(tt("We couldn't verify the payment status in time. Please check your group dashboard later.", "Hatukuweza kuthibitisha malipo kwa wakati. Tafadhali kagua dashibodi ya kikundi baadaye."))
        }
      } catch (err) {
        clearInterval(interval)
        setIsPolling(false)
        setIsProcessing(false)
        const message =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          (err instanceof Error ? err.message : tt("We couldn't verify the payment status. Please try again later.", "Hatukuweza kuthibitisha malipo. Tafadhali jaribu tena baadaye."))
        setPaymentError(message)
        setFailMessage(message)
        setIsFailed(true)
        console.error("Polling error", err)
      }
    }, 10000)
  }

  // Formatting helpers for card inputs
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 16) value = value.slice(0, 16)
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim()
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 4) value = value.slice(0, 4)
    if (value.length >= 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`
    }
    setExpiry(value)
  }

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 3) value = value.slice(0, 3)
    setCvc(value)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-8xl">
        
        {/* Top Navigation */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href={contextInfo.backLink}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {contextInfo.backLabel}
            </Link>
          </Button>
        </div>

        {loanContextLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-muted/30 p-4">
              <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">{tt("Loading payment details", "Inapakia maelezo ya malipo")}</h2>
            <p className="max-w-md text-muted-foreground">
              {tt("We are checking the loan status before allowing repayment.", "Tunakagua hali ya mkopo kabla ya kuruhusu marejesho.")}
            </p>
          </div>
        ) : paymentError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-destructive/20 p-4">
              <CircleAlert className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">{tt("Payment Unavailable", "Malipo Hayapatikani")}</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              {paymentError}
            </p>
            <div className="flex gap-4">
              <Button onClick={() => { setPaymentError(""); setIsProcessing(false); setIsPolling(false) }} variant="outline">
                {tt("Try Again", "Jaribu Tena")}
              </Button>
              <Button onClick={() => router.push(`/group/${groupId}`)}>
                {tt("Back to Dashboard", "Rudi kwenye Dashibodi")}
              </Button>
            </div>
          </div>
        ) : type === "loan" && !isLoanRepayable ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-amber-500/20 p-4">
              <Lock className="h-16 w-16 text-amber-600" />
            </div>
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">
              {tt("Loan not ready for repayment", "Mkopo hauko tayari kurejeshwa")}
            </h2>
            <p className="max-w-md text-muted-foreground">
              {loanContext?.status === "PENDING"
                ? tt("This is only a loan request. Members must approve it first before the treasurer can disburse funds and repayments can begin.", "Hili ni ombi la mkopo tu. Lazima liidhinishwe kabla ya mweka hazina kutoa fedha na marejesho kuanza.")
                : loanContext?.status === "APPROVED"
                  ? tt("This loan has been approved, but it has not been disbursed yet. Repayment starts only after disbursement.", "Mkopo umeidhinishwa lakini bado haujatolewa. Marejesho huanza baada ya kutolewa.")
                  : tt("Only active or overdue loans can be repaid.", "Mikopo inayoendelea au iliyochelewa pekee inaweza kulipwa.")}
            </p>
            <div className="mt-8 flex gap-4">
              <Button onClick={() => router.push(`/group/${groupId}/loans`)}>
                {tt("Back to Loans", "Rudi kwenye Mikopo")}
              </Button>
              <Button variant="outline" onClick={() => router.push(`/group/${groupId}`)}>
                {tt("Back to Dashboard", "Rudi kwenye Dashibodi")}
              </Button>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-green-500/20 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">{tt("Payment Successful", "Malipo Yamefanikiwa")}</h2>
            <p className="text-muted-foreground max-w-md">
              {tt("Your transaction of", "Muamala wako wa")} <span className="font-bold text-foreground">{formatTzs(amount)}</span> {tt("has been processed successfully. Redirecting you back...", "umekamilika kwa mafanikio. Unarudishwa...")}
            </p>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-destructive/20 p-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">{tt("Payment Failed", "Malipo Yameshindikana")}</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              {failMessage}
            </p>
            <div className="flex gap-4">
              <Button onClick={() => { setIsFailed(false); setIsProcessing(false) }} variant="outline">
                {tt("Try Again", "Jaribu Tena")}
              </Button>
              <Button onClick={() => router.push(`/group/${groupId}`)}>
                {tt("Back to Dashboard", "Rudi kwenye Dashibodi")}
              </Button>
            </div>
          </div>
        ) : isPolling ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-chart-3/20 animate-ping" />
              <div className="relative rounded-full bg-chart-3/10 p-5">
                <Smartphone className="h-12 w-12 text-chart-3 animate-pulse" />
              </div>
            </div>
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">{tt("Payment Initiated Successfully", "Malipo Yameanzishwa")}</h2>
            <p className="text-muted-foreground max-w-md mb-2">
              {tt("Please check your phone for the Mobile Money prompt and enter your PIN to complete the transaction.", "Angalia simu yako kwa ombi la malipo na uingize PIN kukamilisha muamala.")}
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-chart-4 mb-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tt("Waiting for confirmation...", "Inasubiri uthibitisho...")}
            </div>
            <Button variant="ghost" onClick={() => router.push(`/group/${groupId}`)} className="text-muted-foreground">
              {tt("Taking too long? Return to Dashboard", "Inachukua muda? Rudi kwenye Dashibodi")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            
            {/* Left Panel: Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg">
                <div className="bg-chart-3/10 p-8 pb-12">
                  <Badge variant="outline" className="mb-4 bg-background/50 backdrop-blur-sm border-chart-3/30 text-chart-3">
                    {selectedGroup?.name || tt("Group Payment", "Malipo ya Kikundi")}
                  </Badge>
                  <h1 className="text-2xl font-bold text-foreground">{contextInfo.title}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">{contextInfo.description}</p>
                  {type === "loan" && loanContext ? (
                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                      {tt("Loan status:", "Hali ya mkopo:")}{" "}
                      <span className="font-semibold text-foreground">
                        {loanContext.status.toLowerCase().replaceAll("_", " ")}
                      </span>
                    </p>
                  ) : null}
                </div>
                
                <div className="-mt-6 rounded-t-3xl bg-card p-8 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)]">
                  <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-6">
                    <span className="text-muted-foreground font-medium">{tt("Total due", "Jumla inayodaiwa")}</span>
                    <span className="text-2xl font-extrabold text-foreground tracking-tight">
                      {formatTzs(amount)}
                    </span>
                  </div>

                  {hasLateFee ? (
                    <div className="mb-6 rounded-2xl border border-chart-3/20 bg-chart-3/5 p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">{tt("Principal and interest", "Mtaji na riba")}</span>
                          <span className="font-semibold text-foreground">{formatTzs(principalAndInterestAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">{tt("Late fee penalty", "Adhabu ya kuchelewa")}</span>
                          <span className="font-semibold text-chart-3">{formatTzs(lateFeeAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {type === "saving" ? tt("Contribution Plan", "Mpango wa Mchango") : type === "fine" ? tt("Penalty Plan", "Mpango wa Adhabu") : tt("Repayment plan", "Mpango wa Marejesho")}
                      </span>
                      <Badge variant="secondary" className="uppercase">
                        {paymentModeLabel}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {type === "saving"
                        ? tt("You are adding funds to your group savings account.", "Unaongeza fedha kwenye akiba yako ya kikundi.")
                        : type === "fine"
                          ? tt("You are settling an outstanding group penalty.", "Unalipa adhabu ya kikundi ambayo haijalipwa.")
                          : paymentMode === "installment"
                            ? installmentNumber
                              ? `${tt("You selected installment", "Umechagua awamu")} #${installmentNumber} ${tt("for this loan.", "kwa mkopo huu.")}`
                              : tt("You selected the next installment for this loan.", "Umechagua awamu inayofuata ya mkopo huu.")
                            : paymentMode === "custom"
                              ? tt("You chose a custom repayment amount.", "Umechagua kiasi maalum cha marejesho.")
                              : tt("You chose to clear the remaining balance on this loan.", "Umechagua kulipa salio lote la mkopo huu.")}
                    </p>
                    {hasLateFee ? (
                      <p className="mt-2 text-sm font-medium text-chart-3">
                        {tt("This amount includes", "Kiasi hiki kinajumuisha")} {formatTzs(lateFeeAmount)} {tt("in late fees across", "ya ada za kuchelewa kwa")} {overdueInstallments || 1} {tt("overdue installment(s).", "awamu zilizochelewa.")}
                      </p>
                    ) : null}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-4 border border-border/40">
                      <ShieldCheck className="h-5 w-5 text-chart-2 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{tt("Secure checkout", "Malipo salama")}</p>
                        <p className="text-xs text-muted-foreground">{tt("End-to-end encrypted processing.", "Uchakataji uliosimbwa kwa usalama.")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Payment Form */}
            <div className="lg:col-span-3">
              <Card className="border-border/60 shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                  <CardTitle className="text-xl">{tt("Select Payment Method", "Chagua Njia ya Malipo")}</CardTitle>
                  <CardDescription>{tt("Choose how you want to pay", "Chagua jinsi unavyotaka kulipa")}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handlePayment}>
                    <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-xl bg-muted/50 p-1">
                        <TabsTrigger 
                          value="mobile" 
                          className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium transition-all"
                        >
                          <Smartphone className="mr-2 h-4 w-4" />
                          {tt("Mobile Money", "Fedha za Simu")}
                        </TabsTrigger>
                        <TabsTrigger 
                          value="card"
                          className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium transition-all"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {tt("Credit Card", "Kadi ya Malipo")}
                        </TabsTrigger>
                      </TabsList>

                      <div className="min-h-[280px]">
                        {/* Mobile Money Form */}
                        <TabsContent value="mobile" className="space-y-6 mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="provider">{tt("Network Provider", "Mtandao wa Simu")}</Label>
                              <div className="grid grid-cols-3 gap-3">
                                {["M-Pesa", "Tigo Pesa", "Airtel"].map((provider) => (
                                  <div 
                                    key={provider}
                                    className="flex cursor-pointer items-center justify-center rounded-xl border border-border/60 bg-background py-3 text-sm font-medium hover:bg-muted/40 hover:border-chart-3/50 transition-colors"
                                  >
                                    {provider}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="space-y-2 pt-2">
                              <Label htmlFor="phone">{tt("Phone Number", "Namba ya Simu")}</Label>
                              <Input 
                                id="phone" 
                                placeholder="e.g. 0700 000 000" 
                                className={cn(
                                  "h-12 rounded-xl border-border/60 bg-muted/20 text-lg tracking-wide focus-visible:ring-chart-3/30",
                                  errors.phone && "border-destructive focus-visible:ring-destructive"
                                )}
                                value={phoneNumber}
                                onChange={(e) => {
                                  setPhoneNumber(e.target.value)
                                  if (errors.phone) setErrors({ ...errors, phone: "" })
                                }}
                                autoComplete="tel"
                              />
                              {errors.phone ? (
                                <p className="text-xs text-destructive mt-1 font-medium">{errors.phone}</p>
                              ) : (
                                <p className="text-xs text-muted-foreground mt-1 text-right">
                                  {tt("You will receive a prompt on your phone to enter your PIN.", "Utapokea ombi kwenye simu yako la kuingiza PIN.")}
                                </p>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        {/* Credit Card Form (Stripe-like) */}
                        <TabsContent value="card" className="space-y-6 mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                          <div className="space-y-5">
                            <div className="space-y-2">
                              <Label htmlFor="cardNumber">{tt("Card Number", "Namba ya Kadi")}</Label>
                              <div className="relative">
                                <Input 
                                  id="cardNumber" 
                                  placeholder="0000 0000 0000 0000" 
                                  className={cn(
                                    "h-12 rounded-xl border-border/60 bg-muted/20 pl-12 text-lg tracking-widest font-mono focus-visible:ring-chart-3/30",
                                    errors.cardNumber && "border-destructive focus-visible:ring-destructive"
                                  )}
                                  value={cardNumber}
                                  onChange={(e) => {
                                    handleCardNumberChange(e)
                                    if (errors.cardNumber) setErrors({ ...errors, cardNumber: "" })
                                  }}
                                  autoComplete="cc-number"
                                />
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              </div>
                              {errors.cardNumber && <p className="text-xs text-destructive font-medium">{errors.cardNumber}</p>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <Label htmlFor="expiry">{tt("Expiration Date", "Tarehe ya Kuisha")}</Label>
                                <Input 
                                  id="expiry" 
                                  placeholder="MM/YY" 
                                  className={cn(
                                    "h-12 rounded-xl border-border/60 bg-muted/20 text-lg tracking-widest font-mono text-center focus-visible:ring-chart-3/30",
                                    errors.expiry && "border-destructive focus-visible:ring-destructive"
                                  )}
                                  value={expiry}
                                  onChange={(e) => {
                                    handleExpiryChange(e)
                                    if (errors.expiry) setErrors({ ...errors, expiry: "" })
                                  }}
                                  autoComplete="cc-exp"
                                />
                                {errors.expiry && <p className="text-xs text-destructive mt-1 font-medium">{errors.expiry}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="cvc">{tt("CVC", "CVC")}</Label>
                                <div className="relative">
                                  <Input 
                                    id="cvc" 
                                    placeholder="123" 
                                    maxLength={3}
                                    type="password"
                                    className={cn(
                                      "h-12 rounded-xl border-border/60 bg-muted/20 text-lg tracking-widest font-mono text-center focus-visible:ring-chart-3/30",
                                      errors.cvc && "border-destructive focus-visible:ring-destructive"
                                    )}
                                    value={cvc}
                                    onChange={(e) => {
                                      handleCvcChange(e)
                                      if (errors.cvc) setErrors({ ...errors, cvc: "" })
                                    }}
                                    autoComplete="cc-csc"
                                  />
                                </div>
                                {errors.cvc && <p className="text-xs text-destructive mt-1 font-medium">{errors.cvc}</p>}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="nameOnCard">{tt("Name on Card", "Jina kwenye Kadi")}</Label>
                              <Input 
                                id="nameOnCard" 
                                placeholder="JANE DOE" 
                                className={cn(
                                  "h-12 rounded-xl border-border/60 bg-muted/20 text-base uppercase focus-visible:ring-chart-3/30",
                                  errors.nameOnCard && "border-destructive focus-visible:ring-destructive"
                                )}
                                value={nameOnCard}
                                onChange={(e) => {
                                  setNameOnCard(e.target.value)
                                  if (errors.nameOnCard) setErrors({ ...errors, nameOnCard: "" })
                                }}
                                autoComplete="cc-name"
                              />
                              {errors.nameOnCard && <p className="text-xs text-destructive mt-1 font-medium">{errors.nameOnCard}</p>}
                            </div>
                          </div>
                        </TabsContent>
                      </div>

                      <div className="mt-8 pt-6 border-t border-border/40">
                        <Button 
                          type="submit" 
                          className="w-full h-14 rounded-xl text-lg font-bold shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all relative overflow-hidden"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              {tt("Processing Securely...", "Inachakata kwa usalama...")}
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-5 w-5 opacity-70" />
                              {tt("Pay", "Lipa")} {formatTzs(amount)}
                            </>
                          )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {tt("Payments are secure and encrypted", "Malipo ni salama na yamesimbwa")}
                        </p>
                      </div>
                    </Tabs>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
