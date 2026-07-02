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
import { getTranslation } from "@/lib/i18n"
import { useLanguage } from "@/components/language/language-provider"
import LanguageToggle from "@/components/language/language-toggle"

const userSections = [
  {
    titleKey: "guide.sectionMembers",
    icon: Users,
    steps: [
      "Join your group and verify your membership.",
      "Attend meetings, record savings, and follow group rules.",
      "Review your wallet page to see savings, loans, and fines.",
      "Pay only your own fines or loan obligations.",
    ],
  },
  {
    titleKey: "guide.sectionLeadership",
    icon: ShieldCheck,
    steps: [
      "Chairperson schedules meetings and reviews approvals.",
      "Secretary records minutes and keeps meeting notes clean.",
      "Treasurer verifies savings, loan movements, and payments.",
      "Leaders issue fines, manage loan requests, and watch wallet health.",
    ],
  },
  {
    titleKey: "guide.sectionFinance",
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
    titleKey: "guide.sectionSavings",
    icon: WalletCards,
    points: [
      "Enter savings during a meeting or through the savings screen.",
      "Verified contributions increase the group wallet balance.",
      "Each member receives a personal wallet summary for reporting.",
    ],
  },
  {
    titleKey: "guide.sectionLoans",
    icon: HandCoins,
    points: [
      "Members request loans from their group.",
      "The system checks verified savings and available group cash.",
      "Once approved, disbursement reduces group wallet cash.",
    ],
  },
  {
    titleKey: "guide.sectionFines",
    icon: FileText,
    points: [
      "Leaders issue fines to specific members.",
      "Fine payments can only be made by the member who owns the fine.",
      "Paid fines move back into the group wallet and reports.",
    ],
  },
  {
    titleKey: "guide.sectionMeetings",
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
  { key: "guide.quickLinkDashboard", href: "/home" },
  { key: "guide.quickLinkWallet", href: "/guide#wallet" },
  { key: "guide.quickLinkLoans", href: "/guide#loans" },
  { key: "guide.quickLinkFines", href: "/guide#fines" },
  { key: "guide.quickLinkMeetings", href: "/guide#meetings" },
]

export default function GuidePage() {
  const { language } = useLanguage()
  const isSwahili = language === "sw"

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--color-chart-3),transparent_30%)] opacity-25" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,var(--color-chart-1),transparent_35%)] opacity-20" />

        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur">
              <BookOpen className="h-4 w-4 text-chart-3" />
              {isSwahili ? "Mwongozo wa Mfumo" : "System Guide"}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LanguageToggle compact />
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/login">{getTranslation(language, "actions.signIn")}</Link>
              </Button>
              <Button asChild className="rounded-full bg-chart-3 hover:bg-chart-2">
                <Link href="/register">
                  {isSwahili ? "Anza kutumia mfumo" : "Start using the system"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge className="rounded-full bg-chart-3/10 px-3 py-1 text-chart-4 hover:bg-chart-3/10">
                  {isSwahili ? "Ufikiaji wa umma na wanachama" : "Public and member access"}
                </Badge>
                <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                  {getTranslation(language, "guide.title")}
                </h1>
                <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                  {getTranslation(language, "guide.lead")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickLinks.map((item) => (
                  <Button key={item.href} asChild variant="outline" className="rounded-full">
                    <Link href={item.href}>{getTranslation(language, item.key)}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <Card className="border-border/80 bg-card/70 shadow-sm backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-chart-3" />
                  <h2 className="text-xl font-bold">{getTranslation(language, "guide.quickStartTitle")}</h2>
                </div>
                <ol className="mt-5 space-y-4">
                  <li className="rounded-2xl border border-border bg-background p-4">
                    <p className="font-semibold">{getTranslation(language, "guide.step1Title")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getTranslation(language, "guide.step1Body")}
                    </p>
                  </li>
                  <li className="rounded-2xl border border-border bg-background p-4">
                    <p className="font-semibold">{getTranslation(language, "guide.step2Title")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getTranslation(language, "guide.step2Body")}
                    </p>
                  </li>
                  <li className="rounded-2xl border border-border bg-background p-4">
                    <p className="font-semibold">{getTranslation(language, "guide.step3Title")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getTranslation(language, "guide.step3Body")}
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
            <Card key={section.titleKey} className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-chart-3/10 p-3 text-chart-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold">{getTranslation(language, section.titleKey)}</h2>
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
              <h2 className="text-2xl font-black tracking-tight">{getTranslation(language, "guide.walletTitle")}</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-5">
                <p className="font-semibold">{getTranslation(language, "guide.walletGroupTitle")}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {getTranslation(language, "guide.walletGroupBody")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-5">
                <p className="font-semibold">{getTranslation(language, "guide.walletMemberTitle")}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {getTranslation(language, "guide.walletMemberBody")}
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
            <Card key={card.titleKey} className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-chart-1/10 p-3 text-chart-1">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold">{getTranslation(language, card.titleKey)}</h2>
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
              <h2 className="text-2xl font-black tracking-tight">{getTranslation(language, "guide.leadershipTitle")}</h2>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-border bg-background p-5">
                <p className="font-semibold">{getTranslation(language, "guide.leadershipChecklistTitle")}</p>
                <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                  {[
                    "guide.leadershipChecklist1",
                    "guide.leadershipChecklist2",
                    "guide.leadershipChecklist3",
                    "guide.leadershipChecklist4",
                  ].map((key, index) => (
                    <li key={key} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chart-3/10 text-xs font-bold text-chart-3">
                        {index + 1}
                      </span>
                      <span>{getTranslation(language, key)}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <p className="font-semibold">
                  {isSwahili ? "Uongozi hufanya nini" : "What leaders do"}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {leadershipWorkflow.map((item, index) => (
                    <div key={item} className="rounded-xl border border-border/70 p-4 text-sm text-muted-foreground">
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-chart-3/10 text-xs font-bold text-chart-3">
                        {index + 1}
                      </span>
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
              <h2 className="text-2xl font-black tracking-tight">{getTranslation(language, "guide.loansTitle")}</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              {getTranslation(language, "guide.loansBody")}
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="fines" className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-chart-3" />
              <h2 className="text-2xl font-black tracking-tight">{getTranslation(language, "guide.finesTitle")}</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              {getTranslation(language, "guide.finesBody")}
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="meetings" className="mx-auto max-w-7xl px-4 py-6 pb-12 md:px-8">
        <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-chart-3" />
              <h2 className="text-2xl font-black tracking-tight">{getTranslation(language, "guide.meetingsTitle")}</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              {getTranslation(language, "guide.meetingsBody")}
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-chart-3" />
            <h3 className="text-lg font-bold">{getTranslation(language, "guide.helpTitle")}</h3>
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {getTranslation(language, "guide.helpBody")}
          </p>
        </div>
      </section>
    </main>
  )
}
