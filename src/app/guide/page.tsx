"use client"

import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
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
      { en: "Request to join with the group code, then wait for a leader to approve and activate your membership.", sw: "Omba kujiunga kwa msimbo wa kikundi, kisha subiri kiongozi aidhinishe na kuwezesha uanachama wako." },
      { en: "Attend meetings, submit your savings, and follow the group rules.", sw: "Hudhuria vikao, wasilisha akiba yako, na fuata kanuni za kikundi." },
      { en: "Review your member wallet to see savings, loans, fines, and your net position.", sw: "Kagua mkoba wako wa mwanachama kuona akiba, mikopo, faini, na salio lako halisi." },
      { en: "Retry only your own pending savings transaction and pay only obligations assigned to you.", sw: "Rudia muamala wako mwenyewe wa akiba unaosubiri na ulipe majukumu uliyopewa wewe pekee." },
    ],
  },
  {
    titleKey: "guide.sectionLeadership",
    icon: ShieldCheck,
    steps: [
      { en: "The chairperson manages membership, roles, activation, and meeting schedules.", sw: "Mwenyekiti husimamia uanachama, majukumu, uanzishaji, na ratiba za vikao." },
      { en: "The secretary reviews join requests and records attendance, minutes, and meeting actions.", sw: "Katibu hukagua maombi ya kujiunga na kurekodi mahudhurio, kumbukumbu, na hatua za kikao." },
      { en: "Authorized leaders record savings for members and monitor transaction status.", sw: "Viongozi wenye ruhusa hurekodi akiba za wanachama na kufuatilia hali ya miamala." },
      { en: "Leaders manage loans and fines, then use wallet and analytics reports for reconciliation.", sw: "Viongozi husimamia mikopo na faini, kisha hutumia ripoti za mkoba na uchambuzi kufanya usawazishaji." },
    ],
  },
  {
    titleKey: "guide.sectionFinance",
    icon: Landmark,
    steps: [
      { en: "Only completed or verified savings increase the group wallet.", sw: "Akiba zilizokamilika au kuthibitishwa pekee ndizo huongeza mkoba wa kikundi." },
      { en: "Loan disbursements reduce available group cash; repayments and paid fines return cash to it.", sw: "Utoaji wa mkopo hupunguza fedha za kikundi; marejesho na faini zilizolipwa hurudisha fedha humo." },
      { en: "Pending and failed transactions remain visible for review and do not count as completed cash movement.", sw: "Miamala inayosubiri na iliyoshindikana hubaki kuonekana kwa ukaguzi na haihesabiwi kama fedha iliyokamilika." },
      { en: "Analytics can be filtered by date and status, then exported with transaction details.", sw: "Uchambuzi unaweza kuchujwa kwa tarehe na hali, kisha kupakuliwa pamoja na maelezo ya miamala." },
    ],
  },
]

const processCards = [
  {
    titleKey: "guide.sectionSavings",
    id: "savings",
    icon: WalletCards,
    points: [
      { en: "Members can submit their own savings; authorized leaders can record savings for eligible members.", sw: "Wanachama wanaweza kuwasilisha akiba yao; viongozi wenye ruhusa wanaweza kurekodi akiba kwa wanachama wanaostahili." },
      { en: "Transactions show completed, pending, or failed status. Only the owner can retry their pending transaction.", sw: "Miamala huonyesha hali ya kukamilika, kusubiri, au kushindwa. Mmiliki pekee anaweza kurudia muamala wake unaosubiri." },
      { en: "Verified contributions increase the group wallet and appear in the member wallet and reports.", sw: "Michango iliyothibitishwa huongeza mkoba wa kikundi na kuonekana kwenye mkoba wa mwanachama na ripoti." },
    ],
  },
  {
    titleKey: "guide.sectionLoans",
    id: "loans",
    icon: HandCoins,
    points: [
      { en: "Active, verified members request loans inside their group.", sw: "Wanachama hai waliothibitishwa huomba mikopo ndani ya kikundi chao." },
      { en: "Leadership reviews the request against verified savings, terms, and available group cash.", sw: "Uongozi hukagua ombi kwa kuzingatia akiba iliyothibitishwa, masharti, na fedha zilizopo." },
      { en: "Approved disbursement reduces group cash, while repayments return cash and update reports.", sw: "Utoaji ulioidhinishwa hupunguza fedha za kikundi, huku marejesho yakirudisha fedha na kusasisha ripoti." },
    ],
  },
  {
    titleKey: "guide.sectionFines",
    id: "fines",
    icon: FileText,
    points: [
      { en: "Authorized leaders issue a fine to a specific active member with its reason and due information.", sw: "Viongozi wenye ruhusa hutoa faini kwa mwanachama hai maalum pamoja na sababu na taarifa za mwisho wa malipo." },
      { en: "A fine can only be paid by the member who owns it.", sw: "Faini inaweza kulipwa na mwanachama aliyepewa pekee." },
      { en: "Completed fine payments return money to the group wallet and appear in reports.", sw: "Malipo ya faini yaliyokamilika hurudisha fedha kwenye mkoba wa kikundi na kuonekana kwenye ripoti." },
    ],
  },
  {
    titleKey: "guide.sectionMeetings",
    id: "meetings",
    icon: Megaphone,
    points: [
      { en: "Leadership schedules the meeting and members open its details from the group workspace.", sw: "Uongozi hupanga kikao na wanachama hufungua maelezo yake kutoka nafasi ya kikundi." },
      { en: "The session workspace tracks attendance, agenda items, minutes, and actions.", sw: "Nafasi ya kikao hufuatilia mahudhurio, ajenda, kumbukumbu, na hatua." },
      { en: "Attendance records and meeting activity remain available after the session for review.", sw: "Rekodi za mahudhurio na shughuli za kikao hubaki kupatikana baada ya kikao kwa ukaguzi." },
    ],
  },
  {
    titleKey: "guide.sectionAnalytics",
    id: "analytics",
    icon: BarChart3,
    points: [
      { en: "Choose all dates, a month, or a custom date range.", sw: "Chagua tarehe zote, mwezi, au kipindi maalum cha tarehe." },
      { en: "Filter transactions by all, completed, pending, or failed status.", sw: "Chuja miamala kwa zote, iliyokamilika, inayosubiri, au iliyoshindikana." },
      { en: "Export decorated Excel, CSV, or Word reports containing summaries, categories, and transaction rows.", sw: "Pakua ripoti zilizopangwa za Excel, CSV, au Word zenye muhtasari, makundi, na mistari ya miamala." },
    ],
  },
]

const leadershipWorkflow = [
  { en: "Approve join requests, assign roles, and activate or deactivate access without removing roster history.", sw: "Idhinisha maombi ya kujiunga, gawa majukumu, na wezesha au sitisha ufikiaji bila kuondoa historia ya orodha." },
  { en: "Schedule meetings and manage attendance, agenda, minutes, and actions.", sw: "Panga vikao na simamia mahudhurio, ajenda, kumbukumbu, na hatua." },
  { en: "Review savings status and verify that completed transactions reached the wallet.", sw: "Kagua hali ya akiba na hakikisha miamala iliyokamilika imefika kwenye mkoba." },
  { en: "Review loans and fines against member records and available group cash.", sw: "Kagua mikopo na faini kwa kulinganisha na rekodi za mwanachama na fedha zilizopo." },
  { en: "Filter analytics and export a transaction-inclusive report for reconciliation.", sw: "Chuja uchambuzi na pakua ripoti yenye miamala kwa ajili ya usawazishaji." },
]

const quickLinks = [
  { key: "guide.quickLinkDashboard", href: "/home" },
  { key: "guide.quickLinkWallet", href: "/guide#wallet" },
  { key: "guide.quickLinkLoans", href: "/guide#loans" },
  { key: "guide.quickLinkFines", href: "/guide#fines" },
  { key: "guide.quickLinkMeetings", href: "/guide#meetings" },
  { key: "guide.quickLinkAnalytics", href: "/guide#analytics" },
]

export default function GuidePage() {
  const { language } = useLanguage()
  const isSwahili = language === "sw"

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--color-chart-3),transparent_30%)] opacity-25" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,var(--color-chart-1),transparent_35%)] opacity-20" />

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur sm:text-sm sm:px-4 sm:py-2">
              <BookOpen className="h-3.5 w-3.5 text-chart-3 sm:h-4 sm:w-4" />
              {isSwahili ? "Mwongozo wa Mfumo" : "System Guide"}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LanguageToggle compact />
              <Button asChild variant="outline" className="rounded-full text-xs sm:text-sm">
                <Link href="/login">{getTranslation(language, "actions.signIn")}</Link>
              </Button>
              <Button asChild className="rounded-full bg-chart-3 hover:bg-chart-2 text-xs sm:text-sm">
                <Link href="/register">
                  {isSwahili ? "Anza kutumia mfumo" : "Start using the system"}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <Badge className="rounded-full bg-chart-3/10 px-2.5 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-chart-4 hover:bg-chart-3/10">
                  {isSwahili ? "Ufikiaji wa umma na wanachama" : "Public and member access"}
                </Badge>
                <h1 className="max-w-4xl text-2xl font-black tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                  {getTranslation(language, "guide.title")}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 md:text-lg">
                  {getTranslation(language, "guide.lead")}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {quickLinks.map((item) => (
                  <Button key={item.href} asChild variant="outline" className="rounded-full text-xs sm:text-sm">
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
                    <li key={step.en} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-chart-3" />
                      <span>{step[language]}</span>
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
            <Card id={card.id} key={card.titleKey} className="scroll-mt-6 border-border/80 bg-card/60 shadow-sm backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-chart-1/10 p-3 text-chart-1">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold">{getTranslation(language, card.titleKey)}</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {card.points.map((point) => (
                    <li key={point.en} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-chart-1" />
                      <span>{point[language]}</span>
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
                    <div key={item.en} className="rounded-xl border border-border/70 p-4 text-sm text-muted-foreground">
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-chart-3/10 text-xs font-bold text-chart-3">
                        {index + 1}
                      </span>
                      {item[language]}
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
