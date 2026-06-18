export type VikobaFinanceMetric = {
  label: string
  amount: number
  tone: "green" | "amber" | "blue" | "red"
  detail: string
}

export type VikobaFinanceActivity = {
  id: string
  title: string
  type: string
  amount: number
  status: string
  actor: string
  happenedAt: string
}

export type VikobaFinanceSnapshot = {
  totalSavings: number
  pendingContributions: number
  activeLoanBook: number
  expectedInterestReturn: number
  unpaidFines: number
  availableCash: number
  monthlyCollections: number
  recentActivity: VikobaFinanceActivity[]
}

export function formatTzs(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function buildMetricsFromSnapshot(snapshot: VikobaFinanceSnapshot): VikobaFinanceMetric[] {
  return [
    {
      label: "Savings Pool",
      amount: snapshot.totalSavings,
      tone: "green",
      detail: "verified member savings currently tracked in the ledger",
    },
    {
      label: "Pending Contributions",
      amount: snapshot.pendingContributions,
      tone: "amber",
      detail: "contributions still waiting for treasurer confirmation",
    },
    {
      label: "Active Loan Book",
      amount: snapshot.activeLoanBook,
      tone: "blue",
      detail: "loan principal currently projected as outstanding",
    },
    {
      label: "Unpaid Fines",
      amount: snapshot.unpaidFines,
      tone: "red",
      detail: "penalties that still need collection follow-up",
    },
  ]
}
