"use client"

import { useParams } from "next/navigation"
import { useGroupStore } from "@/store/group/groupUser.store"
import { Card, CardContent } from "@/components/ui/card"
import { WalletCards } from "lucide-react"

export default function GroupLoansPage() {
  useParams<{ groupId: string }>()
  const { selectedGroup } = useGroupStore()

  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-screen-2xl">
        <Card className="border-none bg-card shadow-sm">
          <CardContent className="text-center py-8 text-muted-foreground">
            Loading group...
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-2xl">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <WalletCards className="h-6 w-6" />
        Loans - {selectedGroup.name}
      </h1>
      <Card className="p-6">
        <p className="text-muted-foreground">
          Group loan applications, repayments, and management will be displayed here.
        </p>
      </Card>
      </div>
    </div>
  )
}
