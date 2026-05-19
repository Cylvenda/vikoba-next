import type { Group, GroupMembership } from "@/store/group/group.types"

export type VikobaFinanceMetric = {
  label: string
  amount: number
  tone: "green" | "amber" | "blue" | "red"
  detail: string
}

export type VikobaFinanceActivity = {
  id: string
  title: string
  type: "contribution" | "loan" | "repayment" | "fine"
  amount: number
  status: "verified" | "pending" | "active" | "unpaid"
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
  metrics: VikobaFinanceMetric[]
  recentActivity: VikobaFinanceActivity[]
}

const statusDate = (offsetDays: number) => {
  const date = new Date()
  date.setDate(date.getDate() - offsetDays)
  return date.toISOString()
}

const toCurrencyAmount = (value: number) => Math.max(0, Math.round(value))

export function formatTzs(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function buildVikobaFinanceSnapshot(
  group: Group | null,
  members: GroupMembership[]
): VikobaFinanceSnapshot {
  const memberCount = members.length || 1
  const verifiedMembers = members.filter((member) => member.is_verified)
  const activeMembers = members.filter((member) => member.is_active)
  const pendingMembers = members.filter((member) => !member.is_verified)
  const treasurer = members.find((member) => member.role === "TREASURER")
  const secretary = members.find((member) => member.role === "SECRETARY")
  const chairperson = members.find((member) => member.role === "CHAIRPERSON")

  const totalSavings = toCurrencyAmount(verifiedMembers.length * 135000 + activeMembers.length * 25000)
  const pendingContributions = toCurrencyAmount(pendingMembers.length * 18000 + memberCount * 6000)
  const activeLoanBook = toCurrencyAmount(Math.max(1, Math.floor(activeMembers.length / 2)) * 95000)
  const expectedInterestReturn = toCurrencyAmount(activeLoanBook * 0.12)
  const unpaidFines = toCurrencyAmount(Math.max(1, pendingMembers.length) * 12000)
  const monthlyCollections = toCurrencyAmount(verifiedMembers.length * 28000 + activeMembers.length * 12000)
  const availableCash = toCurrencyAmount(totalSavings + unpaidFines + Math.round(expectedInterestReturn * 0.35) - activeLoanBook)

  const recentActors = [
    treasurer?.first_name || treasurer?.email || "Treasurer",
    secretary?.first_name || secretary?.email || "Secretary",
    chairperson?.first_name || chairperson?.email || "Chairperson",
    verifiedMembers[0]?.first_name || verifiedMembers[0]?.email || "Member",
  ]

  const recentActivity: VikobaFinanceActivity[] = [
    {
      id: `${group?.id || "group"}-contribution-preview`,
      title: "Weekly savings batch received",
      type: "contribution",
      amount: toCurrencyAmount(monthlyCollections * 0.34),
      status: "verified",
      actor: recentActors[0],
      happenedAt: statusDate(1),
    },
    {
      id: `${group?.id || "group"}-loan-preview`,
      title: "Emergency loan still active",
      type: "loan",
      amount: toCurrencyAmount(activeLoanBook * 0.42),
      status: "active",
      actor: recentActors[2],
      happenedAt: statusDate(3),
    },
    {
      id: `${group?.id || "group"}-repayment-preview`,
      title: "Loan repayment posted",
      type: "repayment",
      amount: toCurrencyAmount(expectedInterestReturn * 0.45),
      status: "verified",
      actor: recentActors[1],
      happenedAt: statusDate(5),
    },
    {
      id: `${group?.id || "group"}-fine-preview`,
      title: "Attendance fine remains unpaid",
      type: "fine",
      amount: toCurrencyAmount(unpaidFines * 0.5),
      status: "unpaid",
      actor: recentActors[3],
      happenedAt: statusDate(6),
    },
    {
      id: `${group?.id || "group"}-contribution-pending-preview`,
      title: "Contribution waiting verification",
      type: "contribution",
      amount: toCurrencyAmount(pendingContributions * 0.4),
      status: "pending",
      actor: recentActors[0],
      happenedAt: statusDate(8),
    },
  ]

  return {
    totalSavings,
    pendingContributions,
    activeLoanBook,
    expectedInterestReturn,
    unpaidFines,
    availableCash,
    monthlyCollections,
    metrics: [
      {
        label: "Savings Pool",
        amount: totalSavings,
        tone: "green",
        detail: "verified member savings currently tracked in the frontend preview",
      },
      {
        label: "Pending Contributions",
        amount: pendingContributions,
        tone: "amber",
        detail: "contributions still waiting for treasurer confirmation",
      },
      {
        label: "Active Loan Book",
        amount: activeLoanBook,
        tone: "blue",
        detail: "loan principal currently projected as outstanding",
      },
      {
        label: "Unpaid Fines",
        amount: unpaidFines,
        tone: "red",
        detail: "penalties that still need collection follow-up",
      },
    ],
    recentActivity,
  }
}
