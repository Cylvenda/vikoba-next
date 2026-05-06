"use client"

import { ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type AdminAccessStateProps = {
  title?: string
  description?: string
}

export function AdminAccessState({
  title = "Administrator access required",
  description = "This area is only available to administrator accounts.",
}: AdminAccessStateProps) {
  return (
    <div className="w-full p-5 md:p-10">
      <Card className="mx-auto max-w-3xl border-none bg-muted/80">
        <CardHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-3">
            <ShieldAlert className="size-6" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
