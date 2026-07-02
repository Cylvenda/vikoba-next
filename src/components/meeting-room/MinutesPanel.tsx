"use client"

import { useState } from "react"
import { PencilLine, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language/language-provider"

type MinutesPanelProps = {
  content?: string | null
  canEdit?: boolean
  isSaving?: boolean
  onSave?: (content: string) => Promise<void> | void
}

export function MinutesPanel({ content, canEdit = false, isSaving = false, onSave }: MinutesPanelProps) {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  const [draft, setDraft] = useState(() => content || "")

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          {canEdit ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <PencilLine className="size-4 text-primary" />
                {tt("Host-only minutes editor", "Kihariri cha kumbukumbu cha mwenyeji")}
              </div>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={tt("Capture decisions, action items, and follow-ups for the meeting.", "Rekodi maamuzi, hatua za utekelezaji, na ufuatiliaji wa kikao.")}
                className="min-h-64 w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {tt("Everyone can continue the meeting while you update the official notes here.", "Wengine wanaweza kuendelea na kikao unaposasisha kumbukumbu rasmi hapa.")}
                </p>
                <Button
                  type="button"
                  size="lg"
                  className="rounded-2xl px-4"
                  onClick={() => void onSave?.(draft)}
                  disabled={isSaving}
                >
                  <Save className="size-4" />
                  {isSaving ? tt("Saving...", "Inahifadhi...") : tt("Save minutes", "Hifadhi kumbukumbu")}
                </Button>
              </div>
            </div>
          ) : content ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-card-foreground/90">{content}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {tt("No minutes notes have been saved for this meeting yet.", "Bado hakuna kumbukumbu zilizohifadhiwa kwa kikao hiki.")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
