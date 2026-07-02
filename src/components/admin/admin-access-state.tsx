"use client"

import { ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLanguage } from "@/components/language/language-provider"

type AdminAccessStateProps = {
  title?: string
  description?: string
}

export function AdminAccessState({
  title,
  description,
}: AdminAccessStateProps) {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  const resolvedTitle = title || tt("Administrator access required", "Ufikiaji wa msimamizi unahitajika")
  const resolvedDescription = description || tt("This area is only available to administrator accounts.", "Eneo hili linapatikana kwa akaunti za wasimamizi pekee.")
  return (
    <div className="w-full p-5 md:p-10">
      <Card className="mx-auto max-w-3xl border-none bg-muted/80">
        <CardHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-3">
            <ShieldAlert className="size-6" />
          </div>
          <CardTitle className="text-2xl">{resolvedTitle}</CardTitle>
          <CardDescription>{resolvedDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/home">{tt("Back to Home", "Rudi Nyumbani")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
