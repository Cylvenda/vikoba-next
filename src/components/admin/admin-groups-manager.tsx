"use client"

import { useState } from "react"
import { Lock, Search, Users2 } from "lucide-react"
import { toast } from "react-toastify"
import { AdminService } from "@/api/services/admin.service"
import type { Group } from "@/store/group/group.types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatUTCDate } from "@/hooks/formatted-date"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language/language-provider"

export function AdminGroupsManager({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [query, setQuery] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en

  const updateGroup = async (groupId: string, data: Partial<Group>, successMessage: string) => {
    setLoadingId(groupId)
    try {
      const response = await AdminService.updateGroup(groupId, data)
      setGroups((current) =>
        current.map((group) => (group.id === response.data.id ? { ...group, ...response.data } : group))
      )
      toast.success(successMessage)
    } catch {
      toast.error(tt("Failed to update group.", "Imeshindikana kusasisha kikundi."))
    } finally {
      setLoadingId(null)
    }
  }

  const filteredGroups = groups.filter((group) => {
    const searchTarget = [group.name, group.description, group.created_by].filter(Boolean).join(" ").toLowerCase()
    return searchTarget.includes(query.toLowerCase())
  })

  return (
    <Card className="border-none bg-card shadow-sm">
      <CardHeader className="gap-4 border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>{tt("Groups", "Vikundi")}</CardTitle>
            <CardDescription>{tt("Review privacy, update descriptions, and moderate availability.", "Kagua faragha, sasisha maelezo, na dhibiti upatikanaji.")}</CardDescription>
          </div>

          <label className="relative block w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tt("Search by group name or owner", "Tafuta kwa jina la kikundi au mmiliki")}
              className="h-10 rounded-2xl pl-9"
            />
          </label>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {tt("No groups match your search.", "Hakuna vikundi vinavyolingana na utafutaji wako.")}
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isSaving = loadingId === group.id

            return (
              <div key={group.id} className="rounded-3xl border border-border bg-muted/30 p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-3">
                        <Users2 className="size-5" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{group.name}</p>
                        <p className="text-sm text-muted-foreground">{tt("Owned by", "Kinamilikiwa na")} {group.created_by}</p>
                      </div>
                    </div>

                    <Input
                      value={group.name}
                      onChange={(event) =>
                        setGroups((current) =>
                          current.map((entry) =>
                            entry.id === group.id ? { ...entry, name: event.target.value } : entry
                          )
                        )
                      }
                      placeholder={tt("Group name", "Jina la kikundi")}
                      className="h-10 rounded-2xl"
                    />

                    <textarea
                      value={group.description || ""}
                      onChange={(event) =>
                        setGroups((current) =>
                          current.map((entry) =>
                            entry.id === group.id ? { ...entry, description: event.target.value } : entry
                          )
                        )
                      }
                      placeholder={tt("Group description", "Maelezo ya kikundi")}
                      className="min-h-28 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>

                  <div className="min-w-full space-y-3 xl:min-w-70">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        {group.is_active ? tt("Active", "Hai") : tt("Inactive", "Kimesitishwa")}
                      </span>
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        {group.is_private ? tt("Private", "Faragha") : tt("Public", "Umma")}
                      </span>
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                        {group.members_count} {tt("members", "wanachama")}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-background p-4 text-sm text-muted-foreground ring-1 ring-border">
                      <p className="font-medium text-foreground">{tt("Group details", "Maelezo ya kikundi")}</p>
                      <p className="mt-2">{tt("Created:", "Kimeundwa:")} {formatUTCDate(group.created_at)}</p>
                      <p>{tt("Updated:", "Kimesasishwa:")} {formatUTCDate(group.updated_at)}</p>
                      <p className="mt-2 flex items-center gap-2">
                        <Lock className="size-4" />
                        {group.is_private ? tt("Hidden from public discovery", "Hakionekani kwa umma") : tt("Visible to public discovery", "Kinaonekana kwa umma")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={isSaving}
                        onClick={() =>
                          updateGroup(
                            group.id,
                            { name: group.name, description: group.description },
                            tt("Group details updated.", "Maelezo ya kikundi yamesasishwa.")
                          )
                        }
                      >
                        {tt("Save details", "Hifadhi maelezo")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() =>
                          updateGroup(group.id, { is_active: !group.is_active }, tt("Group availability updated.", "Upatikanaji wa kikundi umesasishwa."))
                        }
                      >
                        {group.is_active ? tt("Deactivate", "Sitisha") : tt("Activate", "Wezesha")}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isSaving}
                        onClick={() =>
                          updateGroup(group.id, { is_private: !group.is_private }, tt("Group privacy updated.", "Faragha ya kikundi imesasishwa."))
                        }
                      >
                        {group.is_private ? tt("Make public", "Weka umma") : tt("Make private", "Weka faragha")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
