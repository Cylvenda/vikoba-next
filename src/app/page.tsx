import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  MenuSquare,
  ShieldCheck,
  Users2,
} from "lucide-react";
import ThemeToggle from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    title: "Member-only spaces",
    description: "Run private groups with invitations, approvals, and role-aware access from day one.",
    icon: Users2,
  },
  {
    title: "Meetings with structure",
    description: "Move from scheduling to live attendance, minutes, and wrap-up without scattered tools.",
    icon: CalendarRange,
  },
  {
    title: "Security built in",
    description: "Email activation, authenticated sessions, and protected routes keep participation controlled.",
    icon: ShieldCheck,
  },
];

const workflow = [
  {
    step: "01",
    title: "Create the room around the team",
    description: "Set up a group, invite members, and keep access limited to the people who should be in the conversation.",
  },
  {
    step: "02",
    title: "Run the meeting while it is happening",
    description: "Track attendance, watch live participation, and keep agenda items visible instead of buried in chat.",
  },
  {
    step: "03",
    title: "Leave with clear follow-through",
    description: "Capture minutes, action points, and the meeting record so the next step is obvious after everyone leaves.",
  },
];

const metrics = [
  { label: "From invite to live session", value: "One flow" },
  { label: "Agenda, attendance, and notes", value: "In one place" },
  { label: "Built for admins and members", value: "Role-aware" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-20 " />
        <div className="absolute inset-x-0 top-0 -z-10 h-144  " />

        <section className="mx-auto  max-w-8xl px-6 pb-14 pt-6 md:px-10 md:pb-24">

          <header className="sticky top-4 z-30 rounded-full border border-border/70 bg-background/75 px-4 py-3 shadow-lg shadow-chart-2/10 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-chart-4">Meeting Hub</p>
                <p className="text-sm text-muted-foreground">Secure Virtual Private Meeting</p>
              </div>

              <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
                <a href="#features" className="transition hover:text-foreground">
                  Features
                </a>
                <a href="#workflow" className="transition hover:text-foreground">
                  Workflow
                </a>
                <a href="#proof" className="transition hover:text-foreground">
                  Why it works
                </a>
              </nav>

              <div className="flex items-center gap-2">
                <ThemeToggle compact />
                <Button asChild variant="ghost" className="hidden rounded-full px-4 sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="lg" className="rounded-full bg-chart-3 px-5 text-primary-foreground hover:bg-chart-2">
                  <Link href="/register">
                    Start free
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          <div className="grid items-center justify-center gap-5 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:pt-20">
            <div className="max-w-4xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-chart-4 shadow-sm backdrop-blur">
                <CheckCircle2 size={16} />
                Built for private groups, councils, teams, and internal ops
              </p>

              <h1 className="mt-6 text-5xl font-bold leading-[0.95] tracking-tight md:text-8xl">
                 Meetings that need order, not chaos.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Meeting Hub combines access control, scheduling, live participation, and follow-up so your group can move through every meeting in one calm system.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-chart-3 px-6 text-primary-foreground hover:bg-chart-2">
                  <Link href="/register">
                    Create account
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-border bg-card/75 px-6 hover:bg-accent">
                  <Link href="/login">Explore your dashboard</Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur">
                    <p className="text-2xl font-semibold text-card-foreground">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">

              <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 p-3 shadow-2xl shadow-chart-2/10 backdrop-blur">
                <div className="rounded-[1.6rem] border border-border/80 bg-background/75 p-4">
                  <div className="flex items-center justify-between rounded-[1.4rem] bg-accent px-5 py-4 ">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-chart-3">Live workspace</p>
                      <h2 className="mt-2 text-2xl font-semibold">Wednesday operations review</h2>
                    </div>
                    <div className="rounded-full bg-chart-3 px-3 py-1 text-sm font-medium text-muted">
                      13 joined
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-border bg-card">
                    <Image
                      src="/meet.png"
                      alt="Meeting Hub product preview"
                      width={1536}
                      height={1024}
                      className="h-auto w-full object-cover"
                      priority
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.4rem] bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Attendance</p>
                      <p className="mt-2 text-2xl font-semibold">94%</p>
                      <p className="mt-1 text-sm text-muted-foreground">Verified members recorded live</p>
                    </div>
                    <div className="rounded-[1.4rem] bg-chart-1/20 p-4">
                      <p className="text-sm text-muted-foreground">Minutes</p>
                      <p className="mt-2 text-2xl font-semibold">Ready</p>
                      <p className="mt-1 text-sm text-muted-foreground">Action points captured during session</p>
                    </div>
                    <div className="rounded-[1.4rem] bg-chart-2/10 p-4">
                      <p className="text-sm text-muted-foreground">Next step</p>
                      <p className="mt-2 text-2xl font-semibold">Assigned</p>
                      <p className="mt-1 text-sm text-muted-foreground">Owners leave with clear follow-up</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-6 md:px-10 md:py-10">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-chart-4">What the product covers</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Built around the full meeting lifecycle instead of a single video screen.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {highlights.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-[2rem] border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-4">
                  <Icon size={24} />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
          <div className="rounded-[2.25rem] border border-border/70 bg-card/80 px-6 py-8  shadow-2xl shadow-chart-5/10 md:px-10 md:py-12">
            <div className="flex max-w-2xl flex-col gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-chart-1">Workflow</p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                From setup to follow-up, every step stays visible.
              </h2>
              <p className="">
                The product works best for teams that need more than a meeting link. It gives shape to who joins, what gets discussed, and what happens next.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {workflow.map((item) => (
                <article key={item.step} className="rounded-[1.8rem] border border-bg-card  p-6">
                  <p className="text-sm font-semibold tracking-[0.24em] text-chart-1">{item.step}</p>
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 ">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="proof" className="mx-auto max-w-7xl px-6 pb-16 md:px-10 md:pb-24">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[2rem] border border-border/80 bg-card/80 p-7 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-chart-4">Why it works</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Designed for meetings that carry responsibility.</h2>
              <p className="mt-4 leading-8 text-muted-foreground">
                When decisions matter, the system around the conversation matters too. Meeting Hub gives admins control and gives members a clearer, lighter experience.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[2rem] border border-border/80 bg-card/75 p-6 shadow-sm backdrop-blur">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
                  <MenuSquare size={22} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Less tool switching</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Planning, attendance, and records live together, which reduces the friction around every recurring meeting.
                </p>
              </article>
              <article className="rounded-[2rem] border border-border/80 bg-card/75 p-6 shadow-sm backdrop-blur">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-chart-2/12 text-chart-4">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Access with guardrails</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Invitations, activation, and protected views help keep sensitive group spaces private and intentional.
                </p>
              </article>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-border/80 bg-card/80 px-6 py-7 shadow-sm backdrop-blur md:flex-row md:items-center md:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-chart-4">Ready to launch</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                Bring your next team, board, or working group into one meeting home.
              </h2>
            </div>

            <Button asChild size="lg" className="rounded-full bg-chart-3 px-6 text-primary-foreground hover:bg-chart-2">
              <Link href="/register">
                Open your workspace
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-border/80 bg-card/70 backdrop-blur">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-10">
            <div className="max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-chart-4">Meeting Hub</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Secure meetings with a clearer flow from invite to follow-up.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Built for teams, boards, councils, and working groups that need structure, privacy, and a calmer meeting experience.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Navigation</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <a href="#features" className="transition hover:text-foreground">
                  Features
                </a>
                <a href="#workflow" className="transition hover:text-foreground">
                  Workflow
                </a>
                <a href="#proof" className="transition hover:text-foreground">
                  Why it works
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Get started</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <Link href="/register" className="transition hover:text-foreground">
                  Create account
                </Link>
                <Link href="/login" className="transition hover:text-foreground">
                  Sign in
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border/70">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
              <p>Meeting Hub keeps your team meetings organized and secure.</p>
              <p>Designed and Developeed by <a href="mailto:brayanmlawa0917@gmail.com">Cylvenda</a> .</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
