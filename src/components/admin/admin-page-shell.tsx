"use client"

import { Card,  CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type AdminPageShellProps = {
  title: string
  description: string
  currentPath?: string
  children: React.ReactNode
}


export function AdminPageShell({
  title,
  description,
  children,
}: AdminPageShellProps) {
  return (
    <div className="w-full max-w-8xl p-5 md:p-10">
      <div className="space-y-6">
        <Card className="border-none  shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl">{title}</CardTitle>
            <CardDescription className="max-w-5xl text-sm">{description}</CardDescription>
          </CardHeader>
        </Card>
        {children}
      </div>
    </div>
  )
}
