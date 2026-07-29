"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useLanguage } from "@/components/language/language-provider"

function needsProfileCompletion(firstName?: string, lastName?: string) {
  return !firstName?.trim() || !lastName?.trim()
}

export function CompleteProfileModal() {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  const { user, loading, updateUserProfile } = useAuthUserStore()
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.lastName || "")
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({})

  if (!user || !needsProfileCompletion(user.firstName, user.lastName)) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const nextErrors: { firstName?: string; lastName?: string } = {}

    if (!trimmedFirstName) {
      nextErrors.firstName = tt("First name is required.", "Jina la kwanza linahitajika.")
    }

    if (!trimmedLastName) {
      nextErrors.lastName = tt("Last name is required.", "Jina la mwisho linahitajika.")
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    const result = await updateUserProfile({
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
    })

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success(tt("Your profile is now complete.", "Wasifu wako sasa umekamilika."))
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-3xl p-6 sm:p-8 [&>button]:hidden" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2">
            <p className="font-semibold uppercase tracking-[0.28em] text-chart-4 text-left">{tt("Complete Profile", "Kamilisha Wasifu")}</p>
            <DialogTitle className="mt-3 text-2xl font-semibold tracking-tight text-left">{tt("Finish setting up your account", "Kamilisha kuweka akaunti yako")}</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground text-left">
              {tt("Please add your first name and last name before continuing. This helps identify you correctly across groups and meetings.", "Tafadhali ongeza jina lako la kwanza na la mwisho kabla ya kuendelea. Hii husaidia kukutambua vizuri kwenye vikundi na mikutano.")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="complete-first-name" className="text-sm font-medium">
              {tt("First name", "Jina la kwanza")}
            </label>
            <Input
              id="complete-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder={tt("Enter your first name", "Weka jina lako la kwanza")}
              className="h-11"
            />
            {errors.firstName ? <p className="text-sm text-destructive">{errors.firstName}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="complete-last-name" className="text-sm font-medium">
              {tt("Last name", "Jina la mwisho")}
            </label>
            <Input
              id="complete-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder={tt("Enter your last name", "Weka jina lako la mwisho")}
              className="h-11"
            />
            {errors.lastName ? <p className="text-sm text-destructive">{errors.lastName}</p> : null}
          </div>

          <Button type="submit" className="mt-2 w-full bg-chart-3 text-primary-foreground hover:bg-chart-2" disabled={loading}>
            {loading ? tt("Saving...", "Inahifadhi...") : tt("Save and Continue", "Hifadhi na Uendelee")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
