"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getStoredLanguage, LANGUAGE_STORAGE_KEY, setDocumentLanguage, type LanguageCode } from "@/lib/i18n"

type LanguageContextValue = {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => getStoredLanguage())

  useEffect(() => {
    setDocumentLanguage(language)
  }, [language])

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage)
    setDocumentLanguage(nextLanguage)
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "sw" : "en"),
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }

  return context
}
