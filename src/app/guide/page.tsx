"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Building2,
  CircleDollarSign,
  FileText,
  HandCoins,
  Landmark,
  LifeBuoy,
  Megaphone,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const userSections = [
  {
    title: "Members",
    icon: Users,
    steps: [
      "Join your group and verify your membership.",
      "Attend meetings, record savings, and follow group rules.",
      "Review your wallet page to see savings, loans, and fines.",
      "Pay only your own fines or loan obligations.",
    ],
  },
  {
    title: "Leadership",
    icon: ShieldCheck,
    steps: [
      "Chairperson schedules meetings and reviews approvals.",
      "Secretary records minutes and keeps meeting notes clean.",
      "Treasurer verifies savings, loan movements, and payments.",
      "Leaders issue fines, manage loan requests, and watch wallet health.",
    ],
  },
  {
    title: "Finance Flow",
    icon: Landmark,
    steps: [
      "Verified savings go into the group wallet.",
      "Loans are disbursed from the group wallet only.",
      "Loan repayments and fines flow back into the group wallet.",
      "Member wallet reports are used for analysis and balances.",
    ],
  },
]

const processCards = [
  {
    title: "Savings Process",
    icon: WalletCards,
    points: [
      "Enter savings during a meeting or through the savings screen.",
      "Verified contributions increase the group wallet balance.",
      "Each member receives a personal wallet summary for reporting.",
    ],
  },
  {
    title: "Loan Process",
    icon: HandCoins,
    points: [
      "Members request loans from their group.",
      "The system checks verified savings and available group cash.",
      "Once approved, disbursement reduces group wallet cash.",
    ],
  },
  {
    title: "Fine Process",
    icon: FileText,
    points: [
      "Leaders issue fines to specific members.",
      "Fine payments can only be made by the member who owns the fine.",
      "Paid fines move back into the group wallet and reports.",
    ],
  },
  {
    title: "Meetings",
    icon: Megaphone,
    points: [
      "Meetings are scheduled by leadership and shared with members.",
      "Attendance, minutes, and actions are tracked in one workspace.",
      "Meeting activity feeds into the group audit trail.",
    ],
  },
]

const leadershipWorkflow = [
  "Schedule meetings and open the session agenda.",
  "Verify savings and confirm transactions during the meeting.",
  "Review loan requests against verified savings and group cash.",
  "Issue fines when rules are broken and track due dates.",
  "Reconcile the wallet report after each financial action.",
]

const quickLinks = [
  { label: "Dashboard", href: "/home" },
  { label: "Wallet", href: "/guide#wallet" },
  { label: "Loans", href: "/guide#loans" },
  { label: "Fines", href: "/guide#fines" },
  { label: "Meetings", href: "/guide#meetings" },
]

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--color-chart-3),transparent_30%)] opacity-25" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,var(--color-chart-1),transparent_35%)] opacity-20" />

        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur">
              <BookOpen className="h-4 w-4 text-chart-3" />
              System Guide
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full bg-chart-3 hover:bg-chart-2">
                <Link href="/register">
                  Start using the system
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge className="rounded-full bg-chart-3/10 px-3 py-1 text-chart-4 hover:bg-chart-3/10">
                  Public and member access
                </Badge>
                <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                  How to use the VICOBA system, from first login to leadership workflows.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                  This guide explains what members, leaders, and finance roles should do in the
                  system, how money moves through the group wallet, and how to keep records clean
                  for reporting and accountability.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickLinks.map((item) => (
                  <Button key={item.href} asChild variant="outline" className="rounded-full">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <Card className="border-border/80 bg-card/70 shadow-sm backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-chart-3" />
                  <h2 className="text-xl font-bold">Quick Start</h2>
                </div>
                <ol className="mt-5 space-y-4">
                  <li className="rounded-2xl border border-border bg-background p-4">
                    <p className="font-semibold">1. Join or sign in</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Members sign in, while new users register and request to join a group.
                    </p>
                  </li>
                  <li className="rounded-2xl border border-border bg-background p-4">
                    <p className="font-semibold">2. Open your workspace</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Use the dashboard for group activities, wallet reports, loans, fines, and meetings.
                    </p>
                  </li>
                  <li className="rounded-2xl border border-border bg-background p-4">
                    <p className="font-semibold">3. Follow the process</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Savings, loans, and fines should flow through the correct finance process so reports stay accurate.
                    </p>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-4 md:px-8 md:grid-cols-3">
        {userSections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-chart-3/10 p-3 text-chart-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold">{section.title}</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {section.steps.map((step) => (
                    <li key={step} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-chart-3" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section id="wallet" className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Card className="border-border/80 bg-card/70 shadow-sm backdrop-blur-md">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <CircleDollarSign className="h-6 w-6 text-chart-3" />
              <h2 className="text-2xl font-black tracking-tight">Wallet and reporting rules</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-5">
                <p className="font-semibold">Group wallet</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  This is the real cash position of the group. Verified savings, loan repayments, and fine payments increase it. Loan disbursements reduce it.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-5">
                <p className="font-semibold">Member wallet</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Every member also has a wallet summary for reporting and analysis. It shows savings, loan exposure, fine exposure, and net balance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:px-8 lg:grid-cols-2">
        {processCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-chart-1/10 p-3 text-chart-1">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold">{card.title}</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {card.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-chart-1" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section id="leadership" className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Card className="border-border/80 bg-card/70 shadow-sm backdrop-blur-md">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-chart-3" />
              <h2 className="text-2xl font-black tracking-tight">Leadership process</h2>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-border bg-background p-5">
                <p className="font-semibold">What leaders do</p>
                <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                  {leadershipWorkflow.map((item, index) => (
                    <li key={item} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chart-3/10 text-xs font-bold text-chart-3">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <p className="font-semibold">Leadership checklist</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    "Confirm member identity before issuing fines or approving requests.",
                    "Use the wallet report to verify cash before lending.",
                    "Review outstanding member balances before each session ends.",
                    "Keep meeting minutes and actions aligned with financial records.",
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-border/70 p-4 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="loans" className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <HandCoins className="h-6 w-6 text-chart-3" />
              <h2 className="text-2xl font-black tracking-tight">Loans</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Loan requests should come from members inside a group. The system checks verified savings and the current group wallet balance before disbursement. Only the group wallet funds the loan, and repayments return cash back to that wallet.
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="fines" className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-chart-3" />
              <h2 className="text-2xl font-black tracking-tight">Fines and penalties</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Leadership can issue fines to a specific member. The member can pay only their own fine, and once paid the money is recorded back into the group wallet and reflected in reports.
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="meetings" className="mx-auto max-w-7xl px-4 py-6 pb-12 md:px-8">
        <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-chart-3" />
              <h2 className="text-2xl font-black tracking-tight">Meetings</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Meetings are where leadership runs the group session, reviews financial activity, records minutes, and keeps the group aligned. Members can use meeting actions as the main place to participate in live group processes.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-chart-3" />
            <h3 className="text-lg font-bold">Need help?</h3>
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Start with the dashboard, then move into your group workspace. If you are a leader, focus on the wallet, loans, fines, and meetings pages. If you are a member, use your group dashboard and wallet pages to understand your balances and actions.
          </p>
        </div>
      </section>
    </main>
  )
}
