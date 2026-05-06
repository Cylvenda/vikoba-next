"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuthUserStore } from "@/store/auth/userAuth.store"

function needsProfileCompletion(firstName?: string, lastName?: string) {
  return !firstName?.trim() || !lastName?.trim()
}

export function CompleteProfileModal() {
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
      nextErrors.firstName = "First name is required."
    }

    if (!trimmedLastName) {
      nextErrors.lastName = "Last name is required."
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

    toast.success("Your profile is now complete.")
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-3xl border-border/80 bg-card shadow-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="mb-6">
            <p className=" font-semibold uppercase tracking-[0.28em] text-chart-4">Complete Profile</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Finish setting up your account</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Please add your first name and last name before continuing. This helps identify you correctly across groups and meetings.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="complete-first-name" className="text-sm font-medium">
                First name
              </label>
              <Input
                id="complete-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Enter your first name"
                className="h-11"
              />
              {errors.firstName ? <p className="text-sm text-destructive">{errors.firstName}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="complete-last-name" className="text-sm font-medium">
                Last name
              </label>
              <Input
                id="complete-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Enter your last name"
                className="h-11"
              />
              {errors.lastName ? <p className="text-sm text-destructive">{errors.lastName}</p> : null}
            </div>

            <Button type="submit" className="mt-2 w-full bg-chart-3 text-primary-foreground hover:bg-chart-2" disabled={loading}>
              {loading ? "Saving..." : "Save and Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
