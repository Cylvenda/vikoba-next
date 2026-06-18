import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Coins } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center bg-background text-foreground font-sans p-4 md:p-8">
      {/* Ambient background glows */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--color-chart-1),transparent_45%)] opacity-25 dark:opacity-15" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,var(--color-chart-3),transparent_50%)] opacity-20 dark:opacity-10" />

      {/* Glassmorphic Auth Card Wrapper */}
      <Card className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[2rem] border border-border/80 bg-card/60 shadow-2xl shadow-chart-3/5 backdrop-blur-md">
        {/* LEFT COLUMN: Framing Product View Bento-Style */}
        <div className="hidden md:block relative p-4 pr-0 h-full min-h-[560px]">
          <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] border border-border/60 bg-muted/30 shadow-inner group">
            <Image
              src="/meet.png"
              alt="Community Hub VICOBA Meeting Dashboard"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-102"
              priority
            />
            {/* Soft overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          </div>
        </div>

        {/* RIGHT COLUMN: The Auth Form Side */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            {/* Integrated Branding Header Logo */}
            <div className="flex justify-center md:justify-start">
              <Link
                href="/"
                className="inline-flex flex-col gap-2 rounded-xl transition hover:opacity-85"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-3 text-primary-foreground shadow-inner">
                    <Coins size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-chart-4 leading-none">
                      Community Hub
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
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
