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
  Clock
} from "lucide-react"
import { toast } from "react-toastify"
import Link from "next/link"
import { financeServices } from "@/api/services/finance.service"
import { paymentServices } from "@/api/services/payment.service"

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const groupId = params.groupId as string
  
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
      ? "Savings Deposit"
      : type === "fine"
        ? "Penalty Settlement"
        : paymentMode === "installment"
          ? "Installment payment"
          : paymentMode === "custom"
            ? "Custom amount"
            : "Full balance payment"
  
  const { selectedGroup, fetchGroupById } = useGroupStore()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [failMessage, setFailMessage] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("mobile") // 'mobile' or 'card'

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

  const getPaymentContextInfo = () => {
    switch (type) {
      case "loan":
        return {
          title: "Loan Repayment",
          description: "Make a payment towards your active or overdue loan balance.",
          backLink: `/group/${groupId}/loans`,
          backLabel: "Back to Loans"
        }
      case "saving":
        return {
          title: "Savings Deposit",
          description: "Add funds to your group savings account.",
          backLink: `/group/${groupId}/savings`,
          backLabel: "Back to Savings"
        }
      case "fine":
        return {
          title: "Fine Payment",
          description: "Settle an outstanding fine.",
          backLink: `/group/${groupId}/fines`, // Assuming this exists or will exist
          backLabel: "Back to Fines"
        }
      default:
        return {
          title: "Secure Payment",
          description: "Complete your transaction.",
          backLink: `/group/${groupId}`,
          backLabel: "Back to Group"
        }
    }
  }

  const contextInfo = getPaymentContextInfo()

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (paymentMethod === "mobile") {
      if (!phoneNumber.trim()) {
        newErrors.phone = "Phone number is required"
      } else if (phoneNumber.replace(/\D/g, '').length < 10) {
        newErrors.phone = "Enter a valid phone number"
      }
    } else {
      if (!cardNumber.trim()) {
        newErrors.cardNumber = "Card number is required"
      } else if (cardNumber.replace(/\D/g, '').length < 15) {
        newErrors.cardNumber = "Enter a valid card number"
      }
      
      if (!expiry.trim()) {
        newErrors.expiry = "Required"
      } else if (expiry.length < 5) {
        newErrors.expiry = "Use MM/YY"
      }
      
      if (!cvc.trim()) {
        newErrors.cvc = "Required"
      } else if (cvc.length < 3) {
        newErrors.cvc = "Invalid CVC"
      }
      
      if (!nameOnCard.trim()) {
        newErrors.nameOnCard = "Name is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsProcessing(true)

    try {
      if (type === "loan") {
        if (!loanId) throw new Error("Loan ID is missing.")
        
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
        if (!loanId) throw new Error("Contribution ID is missing.")

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
          throw new Error("Credit Card payments for savings are coming soon. Please use Mobile Money.")
        }
      } else if (type === "fine") {
        if (!loanId) throw new Error("Fine ID is missing.")

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
          throw new Error("Credit Card payments for fines are coming soon. Please use Mobile Money.")
        }
      }

      setIsSuccess(true)
      toast.success("Payment processed successfully!")

      // Redirect back after short delay showing success state
      setTimeout(() => {
        router.push(contextInfo.backLink)
        router.refresh()
      }, 2000)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err instanceof Error ? err.message : "Payment failed. Please try again.")
      toast.error(message)
      setIsProcessing(false)
    }
  }

  const pollTransactionStatus = (uuid: string) => {
    let attempts = 0
    const maxAttempts = 60 // 2 minutes max (every 2 seconds)
    
    const interval = setInterval(async () => {
      try {
        attempts++
        const res = await paymentServices.getTransactionStatus(uuid)
        const status = res.data.status

        if (status === "COMPLETED") {
          clearInterval(interval)
          setIsPolling(false)
          setIsSuccess(true)
          toast.success("Payment processed successfully!")
          setTimeout(() => {
            router.push(contextInfo.backLink)
            router.refresh()
          }, 2000)
        } else if (status === "FAILED") {
          clearInterval(interval)
          setIsPolling(false)
          setIsProcessing(false)
          setIsFailed(true)
          setFailMessage("Payment failed or was rejected. Please try again.")
        } else if (status === "EXPIRED") {
          clearInterval(interval)
          setIsPolling(false)
          setIsProcessing(false)
          setIsFailed(true)
          setFailMessage("Payment prompt expired. Please try again.")
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(interval)
          setIsPolling(false)
          setIsProcessing(false)
          setIsFailed(true)
          setFailMessage("We couldn't verify the payment status in time. Please check your group dashboard later.")
        }
      } catch (err) {
        console.error("Polling error", err)
      }
    }, 2000)
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

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-green-500/20 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">Payment Successful</h2>
            <p className="text-muted-foreground max-w-md">
              Your transaction of <span className="font-bold text-foreground">{formatTzs(amount)}</span> has been processed successfully. 
              Redirecting you back...
            </p>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-destructive/20 p-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">Payment Failed</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              {failMessage}
            </p>
            <div className="flex gap-4">
              <Button onClick={() => { setIsFailed(false); setIsProcessing(false) }} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.push(`/group/${groupId}`)}>
                Back to Dashboard
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
            <h2 className="mb-2 text-3xl font-extrabold text-foreground">Payment Initiated Successfully</h2>
            <p className="text-muted-foreground max-w-md mb-2">
              Please check your phone for the Mobile Money prompt and enter your PIN to complete the transaction.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-chart-4 mb-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for confirmation...
            </div>
            <Button variant="ghost" onClick={() => router.push(`/group/${groupId}`)} className="text-muted-foreground">
              Taking too long? Return to Dashboard
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            
            {/* Left Panel: Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg">
                <div className="bg-chart-3/10 p-8 pb-12">
                  <Badge variant="outline" className="mb-4 bg-background/50 backdrop-blur-sm border-chart-3/30 text-chart-3">
                    {selectedGroup?.name || "Group Payment"}
                  </Badge>
                  <h1 className="text-2xl font-bold text-foreground">{contextInfo.title}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">{contextInfo.description}</p>
                </div>
                
                <div className="-mt-6 rounded-t-3xl bg-card p-8 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)]">
                  <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-6">
                    <span className="text-muted-foreground font-medium">Total due</span>
                    <span className="text-2xl font-extrabold text-foreground tracking-tight">
                      {formatTzs(amount)}
                    </span>
                  </div>

                  {hasLateFee ? (
                    <div className="mb-6 rounded-2xl border border-chart-3/20 bg-chart-3/5 p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Principal and interest</span>
                          <span className="font-semibold text-foreground">{formatTzs(principalAndInterestAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Late fee penalty</span>
                          <span className="font-semibold text-chart-3">{formatTzs(lateFeeAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {type === "saving" ? "Contribution Plan" : type === "fine" ? "Penalty Plan" : "Repayment plan"}
                      </span>
                      <Badge variant="secondary" className="uppercase">
                        {paymentModeLabel}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {type === "saving"
                        ? "You are adding funds to your group savings account."
                        : type === "fine"
                          ? "You are settling an outstanding group penalty."
                          : paymentMode === "installment"
                            ? installmentNumber
                              ? `You selected installment #${installmentNumber} for this loan.`
                              : "You selected the next installment for this loan."
                            : paymentMode === "custom"
                              ? "You chose a custom repayment amount."
                              : "You chose to clear the remaining balance on this loan."}
                    </p>
                    {hasLateFee ? (
                      <p className="mt-2 text-sm font-medium text-chart-3">
                        This amount includes {formatTzs(lateFeeAmount)} in late fees
                        across {overdueInstallments || 1} overdue installment
                        {(overdueInstallments || 1) === 1 ? "" : "s"}.
                      </p>
                    ) : null}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-4 border border-border/40">
                      <ShieldCheck className="h-5 w-5 text-chart-2 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Secure checkout</p>
                        <p className="text-xs text-muted-foreground">End-to-end encrypted processing.</p>
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
                  <CardTitle className="text-xl">Select Payment Method</CardTitle>
                  <CardDescription>Choose how you want to pay</CardDescription>
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
                          Mobile Money
                        </TabsTrigger>
                        <TabsTrigger 
                          value="card"
                          className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium transition-all"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Credit Card
                        </TabsTrigger>
                      </TabsList>

                      <div className="min-h-[280px]">
                        {/* Mobile Money Form */}
                        <TabsContent value="mobile" className="space-y-6 mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="provider">Network Provider</Label>
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
                              <Label htmlFor="phone">Phone Number</Label>
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
                                  You will receive a prompt on your phone to enter your PIN.
                                </p>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        {/* Credit Card Form (Stripe-like) */}
                        <TabsContent value="card" className="space-y-6 mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                          <div className="space-y-5">
                            <div className="space-y-2">
                              <Label htmlFor="cardNumber">Card Number</Label>
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
                                <Label htmlFor="expiry">Expiration Date</Label>
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
                                <Label htmlFor="cvc">CVC</Label>
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
                              <Label htmlFor="nameOnCard">Name on Card</Label>
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
                              Processing Securely...
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-5 w-5 opacity-70" />
                              Pay {formatTzs(amount)}
                            </>
                          )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Payments are secure and encrypted
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
