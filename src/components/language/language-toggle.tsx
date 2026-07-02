"use client"

import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "./language-provider"
import { getTranslation } from "@/lib/i18n"

type LanguageToggleProps = {
  className?: string
  compact?: boolean
  showLabel?: boolean
}

export default function LanguageToggle({ className, compact = false, showLabel = false }: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage()
  const isSwahili = language === "sw"

  return (
    <Button
      variant="outline"
      size={compact ? "icon" : "lg"}
      className={cn(
        "shrink-0 rounded-md border-border/70 bg-background/75 text-foreground shadow-sm backdrop-blur hover:bg-accent hover:text-accent-foreground",
        compact ? "px-0" : "px-4",
        className,
      )}
      onClick={toggleLanguage}
      aria-label={getTranslation(language, "actions.language")}
      title={isSwahili ? getTranslation(language, "actions.english") : getTranslation(language, "actions.swahili")}
    >
      <Languages className="h-4 w-4" />
      {showLabel ? <span>{isSwahili ? "SW" : "EN"}</span> : null}
    </Button>
  )
}
