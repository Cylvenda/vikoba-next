import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import LanguageToggle from "@/components/language/language-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-background p-2 pt-16 font-sans text-foreground sm:p-4 sm:pt-16 md:p-8">
      {/* Ambient background glows */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--color-chart-1),transparent_45%)] opacity-25 dark:opacity-15" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,var(--color-chart-3),transparent_50%)] opacity-20 dark:opacity-10" />

      <div className="absolute right-4 top-4 z-20 md:right-8 md:top-8">
        <LanguageToggle compact />
      </div>

      {/* Glassmorphic Auth Card Wrapper */}
      <Card className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-md border border-border/80 bg-card/60 shadow-2xl shadow-chart-3/5 backdrop-blur-md md:grid-cols-2">
        {/* LEFT COLUMN: Framing Product View Bento-Style */}
        <div className="hidden md:block relative p-4 pr-0 h-full min-h-[560px]">
          <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] border border-border/60 bg-muted/30 shadow-inner group">
            <Image
              src="/meet.png"
              alt="Community Hub VICOBA Meeting Dashboard"
              fill
              sizes="(min-width: 768px) 50vw, 0px"
              className="object-cover transition-transform duration-700 group-hover:scale-102"
              priority
            />
            {/* Soft overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          </div>
        </div>

        {/* RIGHT COLUMN: The Auth Form Side */}
        <div className="flex min-w-0 items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            {/* Integrated Branding Header Logo */}
            <div className="flex justify-center md:justify-start">
              <Link
                href="/"
                className="inline-flex flex-col gap-2 rounded-xl transition hover:opacity-85"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full shadow-inner overflow-hidden">
                    <Image src="/logo.png" alt="VICOBA Logo" width={40} height={40} className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-chart-4 leading-none sm:text-sm sm:tracking-[0.25em]">
                      Community Hub
                    </p>
                    <p className="mt-1 text-[8px] font-bold uppercase leading-tight tracking-wider text-muted-foreground sm:text-[9px] sm:tracking-widest">
                      VICOBA Virtual Banking Platform
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Render Nested Page Form (children) */}
            <div className="pt-2 bg-inherit!">{children}</div>
          </div>
        </div>
      </Card>
    </main>
  );
}
