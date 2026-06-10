"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Settings } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { groupServices } from "@/api/services/group.service"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import type { Group, GroupMembership } from "@/store/group/group.types"

type GroupSettingsPanelProps = {
  groupId: string
  selectedGroup: Group
  selectedGroupMembers: GroupMembership[]
  userUuid?: string
  onRefresh: () => Promise<void>
}

function GroupSettingsPanel({
  groupId,
  selectedGroup,
  selectedGroupMembers,
  userUuid,
  onRefresh,
}: GroupSettingsPanelProps) {
  const [loanLimit, setLoanLimit] = useState(String(selectedGroup.max_concurrent_loans ?? 1))
  const [defaultLateFeeAmount, setDefaultLateFeeAmount] = useState(String(selectedGroup.default_late_fee_amount ?? "0"))
  const [isSaving, setIsSaving] = useState(false)

  const currentMembership = useMemo(
    () => selectedGroupMembers.find((member) => member.user_id === userUuid),
    [selectedGroupMembers, userUuid]
  )
  const isChairperson = currentMembership?.role === "CHAIRPERSON"

  const handleSave = async () => {
    const parsedLimit = Number(loanLimit)
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      toast.error("Please enter a loan limit of at least 1.")
      return
    }

    setIsSaving(true)
    try {
      const response = await groupServices.updateGroup(groupId, {
        max_concurrent_loans: parsedLimit,
        default_late_fee_amount: defaultLateFeeAmount.trim() || "0",
      })
      toast.success("Loan settings updated.")
    setLoanLimit(String(response.data.max_concurrent_loans))
    setDefaultLateFeeAmount(String(response.data.default_late_fee_amount ?? "0"))
    await onRefresh()
  } catch (error: unknown) {
      const errorData = (error as { response?: { data?: { detail?: string; max_concurrent_loans?: string[]; default_late_fee_amount?: string[] } } })?.response?.data
      toast.error(
        errorData?.detail ||
          errorData?.max_concurrent_loans?.[0] ||
          errorData?.default_late_fee_amount?.[0] ||
          "Failed to update the group loan setting."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-none bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-3xl">
          <Settings className="h-8 w-8" />
          Group Settings
        </CardTitle>
        <CardDescription>Manage {selectedGroup.name} settings and loan borrowing rules.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-w-xl space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="loan-limit">
            Maximum loans per member
          </label>
          <Input
            id="loan-limit"
            type="number"
            min="1"
            step="1"
            value={loanLimit}
            onChange={(event) => setLoanLimit(event.target.value)}
            disabled={!isChairperson || isSaving}
          />
          <p className="text-sm text-muted-foreground">
            Default is <span className="font-semibold text-foreground">1</span>. This controls how many loans a member can have at the same time while pending, approved, or active.
          </p>
        </div>

        <div className="max-w-xl space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="default-late-fee">
            Default late fee amount (TZS)
          </label>
          <Input
            id="default-late-fee"
            type="number"
            min="0"
            step="0.01"
            value={defaultLateFeeAmount}
            onChange={(event) => setDefaultLateFeeAmount(event.target.value)}
            disabled={!isChairperson || isSaving}
          />
          <p className="text-sm text-muted-foreground">
            This amount is used as the shared late-payment penalty for loan types that choose the group default.
            Set it to <span className="font-semibold text-foreground">0</span> if your group does not charge a shared late fee.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={!isChairperson || isSaving}>
            {isSaving ? "Saving..." : "Save settings"}
          </Button>
          {!isChairperson ? (
            <p className="text-sm text-muted-foreground">Only the chairperson can change this setting.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default function GroupSettingsPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId

  const { selectedGroup, selectedGroupMembers, fetchGroupById } = useGroupStore()
  const user = useAuthUserStore((state) => state.user)

  useEffect(() => {
    if (groupId && (!selectedGroup || selectedGroup.id !== groupId)) {
      void fetchGroupById(groupId)
    }
  }, [groupId, selectedGroup, fetchGroupById])

  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <Card className="border-none bg-card shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
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
        <GroupSettingsPanel
          key={selectedGroup.id}
          groupId={groupId || selectedGroup.id}
          selectedGroup={selectedGroup}
          selectedGroupMembers={selectedGroupMembers}
          userUuid={user?.uuid}
          onRefresh={async () => {
            await fetchGroupById(groupId || selectedGroup.id)
          }}
        />
      </div>
    </div>
  )
}
