"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ShieldCheck,
  Users2,
  Coins,
  HandCoins,
  FileText,
  Play,
  Sparkles,
  Gavel,
} from "lucide-react";
import LanguageToggle from "@/components/language/language-toggle";
import { useLanguage } from "@/components/language/language-provider";
import { getTranslation } from "@/lib/i18n";
import ThemeToggle from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    titleKey: "landing.highlightSavingsTitle",
    descriptionKey: "landing.highlightSavingsBody",
    icon: Coins,
  },
  {
    titleKey: "landing.highlightLoanTitle",
    descriptionKey: "landing.highlightLoanBody",
    icon: HandCoins,
  },
  {
    titleKey: "landing.highlightRoleTitle",
    descriptionKey: "landing.highlightRoleBody",
    icon: ShieldCheck,
  },
];

const workflow = [
  {
    step: "01",
    titleKey: "landing.workflow01Title",
    descriptionKey: "landing.workflow01Body",
    icon: CalendarRange,
  },
  {
    step: "02",
    titleKey: "landing.workflow02Title",
    descriptionKey: "landing.workflow02Body",
    icon: Play,
  },
  {
    step: "03",
    titleKey: "landing.workflow03Title",
    descriptionKey: "landing.workflow03Body",
    icon: FileText,
  },
];

const metrics = [
  { label: "Village Banking Capital Pools", value: "TSh 4,850,000" },
  { label: "Active Loan Disbursement", value: "TSh 1,200,000" },
  { label: "Live Meeting Attendance", value: "96% Present" },
];

export default function Home() {
  const { language } = useLanguage()

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-chart-3/30 selection:text-chart-4">
      {/* Background Gradients */}
      <div className="relative isolate">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,var(--color-chart-1),transparent_35%)] opacity-30 dark:opacity-15" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_bottom_left,var(--color-chart-3),transparent_40%)] opacity-20 dark:opacity-10" />

        <section className="mx-auto max-w-8xl px-4 pb-14 pt-6 md:px-10 md:pb-24">
          {/* Header */}
          <header className="sticky top-4 z-30 rounded-full border border-border/80 bg-background/80 px-4 py-3 shadow-lg shadow-chart-3/5 backdrop-blur-md md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full shadow-inner overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="VICOBA Logo"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-chart-4">
                    Community Hub
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em]">
                    VICOBA Virtual Banking Platform
                  </p>
                </div>
                </div>

              <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
                <a
                  href="#features"
                  className="transition hover:text-foreground"
                >
                  {getTranslation(language, "landing.navFeatures")}
                </a>
                <a
                  href="#workflow"
                  className="transition hover:text-foreground"
                >
                  {getTranslation(language, "landing.navWorkflow")}
                </a>
                <Link
                  href="/guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-foreground"
                >
                  {getTranslation(language, "landing.navGuide")}
                </Link>
                <a
                  href="#transparency"
                  className="transition hover:text-foreground"
                >
                  {getTranslation(language, "landing.navTrust")}
                </a>
              </nav>

              <div className="flex shrink-0 items-center gap-2">
                <LanguageToggle compact />
                <ThemeToggle compact />
                <Button
                  asChild
                  variant="ghost"
                  className="hidden rounded-full px-4 font-medium sm:inline-flex"
                >
                  <Link href="/login">{getTranslation(language, "landing.signIn")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="hidden rounded-full px-4 font-medium md:inline-flex"
                >
                  <Link href="/guide" target="_blank" rel="noopener noreferrer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {getTranslation(language, "landing.navGuide")}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="hidden rounded-full bg-chart-3 px-5 text-primary-foreground font-semibold shadow-md transition-all duration-300 hover:bg-chart-2 hover:shadow-chart-3/20 sm:inline-flex"
                >
                  <Link href="/register">
                    {getTranslation(language, "landing.startPlatform")}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="icon"
                  className="rounded-full bg-chart-3 text-primary-foreground shadow-md transition-all duration-300 hover:bg-chart-2 hover:shadow-chart-3/20 sm:hidden"
                >
                  <Link
                    href="/register"
                    aria-label={getTranslation(language, "landing.startPlatform")}
                    title={getTranslation(language, "landing.startPlatform")}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <div className="grid items-center justify-center gap-10 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
            <div className="max-w-4xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-chart-3/20 bg-chart-3/10 px-4 py-2 text-xs md:text-sm font-semibold text-chart-4 shadow-sm backdrop-blur">
                <Sparkles size={14} className="animate-pulse" />
                {getTranslation(language, "landing.heroBadge")}
              </p>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.0] tracking-tight text-foreground md:text-7xl lg:text-8xl">
                {getTranslation(language, "landing.heroTitleStart")}{" "}
                <span className="bg-gradient-to-r from-chart-3 to-chart-1 bg-clip-text text-transparent">
                  {getTranslation(language, "landing.heroTitleHighlight")}
                </span>
                .
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                {getTranslation(language, "landing.heroLead")}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-chart-3 px-8 text-primary-foreground font-semibold hover:bg-chart-2 transition-all duration-300 shadow-lg shadow-chart-3/25"
                >
                  <Link href="/register">
                    {getTranslation(language, "landing.createGroup")}
                    <ArrowRight className="ml-1 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-border bg-card/70 px-8 font-medium hover:bg-accent backdrop-blur transition-all duration-300"
                >
                  <Link href="/login">{getTranslation(language, "landing.accessDashboard")}</Link>
                </Button>
              </div>

              {/* VICOBA Metric Cards */}
              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {metrics.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-chart-3/30 hover:shadow-md"
                  >
                    <p className="text-xl font-bold bg-gradient-to-r from-chart-4 to-chart-3 bg-clip-text text-transparent md:text-2xl">
                      {item.value}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive VICOBA Meeting Mockup */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-[2.1rem] bg-gradient-to-tr from-chart-3 to-chart-1 opacity-20 blur-xl dark:opacity-10" />
              <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/70 p-3 shadow-2xl shadow-chart-3/10 backdrop-blur-md">
                <div className="rounded-[1.6rem] border border-border/80 bg-background/80 p-4 shadow-inner">
                  {/* Mockup Session Header */}
                  <div className="flex items-center justify-between rounded-[1.4rem] bg-accent px-5 py-4 shadow-sm border border-border/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-3 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-chart-3"></span>
                        </span>
                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-chart-3">
                          Live Session #24
                        </p>
                      </div>
                      <h2 className="mt-1 text-lg font-bold text-foreground">
                        Upendo VICOBA Weekly Meeting
                      </h2>
                    </div>
                    <div className="rounded-full bg-chart-3/15 px-3 py-1 text-xs font-bold text-chart-4 border border-chart-3/25">
                      18 Joined
                    </div>
                  </div>

                  {/* Product View Mockup */}
                  <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-border/80 bg-card/50 shadow-md relative group">
                    <Image
                      src="/meet.png"
                      alt="Community Hub VICOBA Meeting Dashboard Preview"
                      width={1536}
                      height={1024}
                      className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-102"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                      <p className="text-xs text-white/90 font-medium flex items-center gap-2 drop-shadow-sm">
                        <Users2 size={12} className="text-chart-1" />
                        Live VICOBA video stream active
                      </p>
                    </div>
                  </div>

                  {/* Live Banking Actions Simulation */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.4rem] bg-muted/80 p-4 border border-border/40 hover:bg-muted transition-all">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Coins size={12} className="text-chart-3" />
                        Savings (Hisa)
                      </p>
                      <p className="mt-2 text-lg font-bold text-foreground">
                        TSh 840,000
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                        Recorded & Treasurer verified live
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] bg-chart-1/10 p-4 border border-chart-1/25 hover:bg-chart-1/15 transition-all">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-chart-4 flex items-center gap-1.5">
                        <HandCoins size={12} className="text-chart-4" />
                        Loans & Products
                      </p>
                      <p className="mt-2 text-lg font-bold text-chart-4">
                        3 Raised
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                        Awaiting digital approval tags
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] bg-chart-2/10 p-4 border border-chart-2/20 hover:bg-chart-2/15 transition-all">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-chart-3 flex items-center gap-1.5">
                        <Gavel size={12} className="text-chart-3" />
                        Fines & Payments
                      </p>
                      <p className="mt-2 text-lg font-bold text-chart-3">
                        2 Resolved
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                        Instant ledger adjustments
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Features Section */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-16 md:px-10 md:py-24"
        >
          <div className="flex max-w-3xl flex-col gap-4 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-chart-3">
              {language === "sw" ? "Imeundwa kwa vikundi vya fedha ndogo" : "Engineered for Micro-Finance Groups"}
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl leading-tight">
              {language === "sw"
                ? "Kuleta daftari lote la VICOBA moja kwa moja ndani ya nafasi yako ya mkutano wa mtandaoni."
                : "Moving the entire VICOBA book-keeping ledger directly into your virtual meeting workspace."}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed">
              {language === "sw"
                ? "Uhasibu wa jadi wa vikundi unategemea kila mtu kufika chumba kimoja ili kusawazisha fedha na vitabu vya karatasi. Community Hub inabadilisha utegemezi huu kwa kutumia njia imara za mikutano ya WebRTC zilizounganishwa na daftari la kidijitali la pamoja."
                : "Traditional micro-banking depends on everyone showing up in a room to reconcile cash boxes and paper books. Community Hub replaces this offline dependency with robust WebRTC conference channels mapped to a shared digital ledger."}
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {highlights.map(({ titleKey, descriptionKey, icon: Icon }) => (
              <article
                key={titleKey}
                className="group relative rounded-[2rem] border border-border/80 bg-card/60 p-8 shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-102 hover:border-chart-3/20 hover:shadow-xl"
              >
                <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-tr from-chart-3 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-10" />
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-3/15 text-chart-4 border border-chart-3/25 shadow-inner">
                  <Icon size={24} />
                </div>
                <h3 className="mt-6 text-xl font-bold text-foreground">
                  {getTranslation(language, titleKey)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {getTranslation(language, descriptionKey)}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* VICOBA Lifecycle / Meeting Flow */}
        <section id="workflow" className="mx-auto max-w-7xl px-4 py-8 md:px-10">
          <div className="rounded-[2.5rem] border border-border/70 bg-card/50 px-6 py-10 shadow-2xl shadow-chart-3/5 backdrop-blur-md md:px-12 md:py-16">
            <div className="flex max-w-3xl flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-chart-4">
                {language === "sw" ? "Mtiririko wa kikao uliopangwa" : "Structured Session Flow"}
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl leading-tight">
                {language === "sw"
                  ? "Kuanzia kupanga kikao hadi kufunga daftari."
                  : "From scheduling session start to signing off the ledger."}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
                {language === "sw"
                  ? "Tunaifanya usimamizi wa VICOBA uwe imara. Mpangilio wetu unahakikisha hakuna mwanachama anayekusanya akiba au kukopa nje ya kikao cha kikundi kilicho wazi, kinachorekodiwa, na cha kidemokrasia."
                  : "We make VICOBA management bulletproof. Our layout ensures that no member saves or borrows outside of a transparent, recordable, and democratic group session."}
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {workflow.map((item) => (
                <article
                  key={item.step}
                  className="group relative rounded-2xl border border-border/40 bg-background/50 p-6 shadow-sm hover:border-chart-3/20 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-extrabold tracking-widest text-chart-3/40 group-hover:text-chart-3 transition-colors">
                      {item.step}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-chart-3/10 text-chart-4 flex items-center justify-center border border-chart-3/20">
                      <item.icon size={16} />
                    </div>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-foreground">
                    {getTranslation(language, item.titleKey)}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {getTranslation(language, item.descriptionKey)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Transparency and Safety Proof */}
        <section
          id="transparency"
          className="mx-auto max-w-7xl px-4 py-16 md:px-10 md:py-24"
        >
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] items-center">
            <div className="rounded-[2rem] border border-border/80 bg-card/60 p-8 shadow-sm backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-chart-4">
                {language === "sw" ? "Uaminifu na uthabiti uliohakikishwa" : "Guaranteed Trust & Integrity"}
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                {language === "sw"
                  ? "Imeundwa kwa jamii zinazobeba uwajibikaji wa pamoja."
                  : "Designed for communities that carry mutual responsibility."}
              </h2>
              <p className="mt-4 text-sm leading-8 text-muted-foreground md:text-base">
                {language === "sw"
                  ? "Wakati maamuzi ya kifedha yanahusisha marafiki na jamii za eneo husika, usalama na uwazi kamili ni muhimu sana. Community Hub huondoa udhaifu wa kiutawala kwa kuunganisha mahudhurio yaliyothibitishwa kwa video na kumbukumbu zisizobadilika za kidijitali."
                  : "When financial decisions involve friends and local communities, security and absolute transparency are paramount. Community Hub removes administrative vulnerabilities by combining video-verified attendance with immutable digital logs."}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-border/80 bg-card/50 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-chart-3/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted border border-border/60 text-foreground">
                  <CheckCircle2 size={22} className="text-chart-4" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">
                  {language === "sw" ? "Daftari la uthibitisho" : "Verification Ledger"}
                </h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {language === "sw"
                    ? "Kila mchango wa akiba unahitaji nambari za marejeo ya malipo, ambazo lazima zilinganishwe na kuthibitishwa moja kwa moja na Mweka Hazina."
                    : "Every savings contribution requires payment reference keys, which must be cross-checked and verified live by the Treasurer."}
                </p>
              </article>
              <article className="rounded-2xl border border-border/80 bg-card/50 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-chart-3/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-chart-3/10 border border-chart-3/20 text-chart-4">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">
                  {language === "sw" ? "Mizani ya ufikiaji salama" : "Absolute Access Guards"}
                </h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {language === "sw"
                    ? "Uthibitisho mkali wa barua pepe, mitiririko ya video iliyosainiwa kwa njia ya kriptografia, na njia zilizolindwa hulinda kumbukumbu za mtaji wa kikundi."
                    : "Strict email confirmation, cryptographically signed video streams, and protected routes safeguard group capital logs."}
                </p>
              </article>
            </div>
          </div>

          {/* CTA Box */}
          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[2.5rem] border border-border/80 bg-card/80 px-6 py-8 shadow-xl backdrop-blur-md md:flex-row md:items-center md:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-chart-3">
                {language === "sw" ? "Anza benki salama ya kikundi" : "Start Secure Group Banking"}
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground md:text-3xl leading-snug">
                {language === "sw"
                  ? "Leta kikundi chako cha ushirika, VICOBA, au bodi kwenye nafasi salama ya mkutano."
                  : "Bring your next cooperative group, VICOBA, or board into a secure meeting workspace."}
              </h2>
            </div>

            <Button
              asChild
              size="lg"
              className="rounded-full bg-chart-3 px-8 text-primary-foreground font-semibold hover:bg-chart-2 transition-all duration-300 shadow-md"
            >
              <Link href="/register">
                {language === "sw" ? "Fungua Nafasi Yako" : "Open Your Space"}
                <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/80 bg-card/50 backdrop-blur-md">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.3fr_0.8fr_0.9fr] md:px-10">
            <div className="max-w-md">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full shadow-sm overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="VICOBA Logo"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-chart-4">
                  Community Hub
                </p>
              </div>
              <h2 className="mt-4 text-lg font-bold tracking-tight text-foreground">
                {language === "sw"
                  ? "Mikutano ya mtandaoni ya ushirikiano yenye mtiririko wazi wa benki ndogo."
                  : "Collaborative virtual meetings with a transparent micro-banking flow."}
              </h2>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                {language === "sw"
                  ? "Mfumo salama wa wavuti unaowawezesha Vikundi vya Akiba na mikutano ya ushirika iliyoandaliwa. Furahia benki iliyo wazi na mikutano isiyo na mshono ndani ya jukwaa moja maridadi."
                  : "The secure web-based system that powers Village Community Banking and structured cooperative groups. Experience transparent banking and seamless virtual meetings in one elegant platform."}
              </p>
            </div>

            <div className="md:ml-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                {language === "sw" ? "Urambazaji wa Haraka" : "Quick Navigation"}
              </p>
              <div className="mt-4 flex flex-col gap-2.5 text-xs text-muted-foreground">
                <a
                  href="#features"
                  className="transition hover:text-foreground"
                >
                  {getTranslation(language, "landing.navFeatures")}
                </a>
                <a
                  href="#workflow"
                  className="transition hover:text-foreground"
                >
                  {getTranslation(language, "landing.navWorkflow")}
                </a>
                <a
                  href="#transparency"
                  className="transition hover:text-foreground"
                >
                  {getTranslation(language, "landing.navTrust")}
                </a>
              </div>
            </div>

            <div className="md:ml-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                {language === "sw" ? "Lango la Mwanachama" : "Member Portal"}
              </p>
              <div className="mt-4 flex flex-col gap-2.5 text-xs text-muted-foreground">
                <Link
                  href="/register"
                  className="transition hover:text-foreground"
                >
                  {language === "sw" ? "Sajili Kikundi cha VICOBA" : "Register VICOBA Group"}
                </Link>
                <Link
                  href="/login"
                  className="transition hover:text-foreground"
                >
                  {language === "sw" ? "Ingia Kwenye Nafasi" : "Sign In to Space"}
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border/40 py-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
              <p>
                &copy; {new Date().getFullYear()} Community Hub.{" "}
                {language === "sw"
                  ? "Miamala yote ya benki ya ushirika huthibitishwa kwa wakati mmoja."
                  : "All cooperative banking transactions are verified synchronously."}
              </p>
              <p>
                {language === "sw" ? "Imeundwa na kutengenezwa na" : "Designed and Developed by"}{" "}
                <a
                  href="mailto:brayanmlawa0917@gmail.com"
                  className="hover:text-chart-3 font-medium transition-colors"
                >
                  Cylvenda & Brirod
                </a>
                .
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
