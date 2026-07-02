"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Save, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { userServices } from "@/api/services/user.service"
import { useLanguage } from "@/components/language/language-provider"

export default function ProfilePage() {
  const { user, fetchUser } = useAuthUserStore()
  const { language } = useLanguage()
  const isSwahili = language === "sw"
  const tt = (en: string, sw: string) => (isSwahili ? sw : en)
  const [formData, setFormData] = useState({
    first_name: user?.firstName || "",
    last_name: user?.lastName || "",
    username: user?.username || "",
    phone: user?.phone || "",
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      await userServices.updateUserMe({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username.trim(),
        phone: formData.phone.trim(),
      })
      await fetchUser()
      toast.success(tt("Profile updated successfully.", "Wasifu umesasishwa kwa mafanikio."))
    } catch {
      toast.error(tt("Failed to update your profile.", "Imeshindikana kusasisha wasifu wako."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-3xl space-y-6">
      <Card className="border-none bg-accent shadow-sm">
         <CardHeader>
          <CardTitle className="text-3xl">{tt("Profile", "Wasifu")}</CardTitle>
          <CardDescription>
            {tt("Update the identity details other members will see across groups, meetings, and invitations.", "Sasisha taarifa za utambulisho ambazo wanachama wengine wataona katika vikundi, vikao, na mialiko.")}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-none bg-card shadow-sm">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-chart-2/15 text-chart-3">
              <UserRound className="size-10" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || tt("Workspace member", "Mwanachama wa nafasi ya kazi")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

            <div className="mt-6 grid w-full gap-3 text-left">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Username", "Jina la mtumiaji")}</p>
                <p className="mt-1 text-sm font-medium">{user?.username || tt("Not set", "Haijawekwa")}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Phone", "Simu")}</p>
                <p className="mt-1 text-sm font-medium">{user?.phone || tt("Not set", "Haijawekwa")}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Access level", "Kiwango cha ufikiaji")}</p>
                <p className="mt-1 text-sm font-medium">
                  {user?.isAdmin ? tt("Administrator", "Msimamizi") : user?.isStaff ? tt("Staff member", "Mfanyakazi") : tt("Standard member", "Mwanachama wa kawaida")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{tt("Edit profile", "Hariri wasifu")}</CardTitle>
            <CardDescription>
              {tt("Keep your name, username, and phone number up to date.", "Weka jina lako, jina la mtumiaji, na namba ya simu ikiwa imesasishwa.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="first-name" className="mb-2 block text-sm font-medium">
                    {tt("First name", "Jina la kwanza")}
                  </label>
                  <Input
                    id="first-name"
                    value={formData.first_name}
                    onChange={(event) => handleChange("first_name", event.target.value)}
                    placeholder={tt("Enter first name", "Weka jina la kwanza")}
                    className="h-10 rounded-2xl"
                  />
                </div>

                <div>
                  <label htmlFor="last-name" className="mb-2 block text-sm font-medium">
                    {tt("Last name", "Jina la mwisho")}
                  </label>
                  <Input
                    id="last-name"
                    value={formData.last_name}
                    onChange={(event) => handleChange("last_name", event.target.value)}
                    placeholder={tt("Enter last name", "Weka jina la mwisho")}
                    className="h-10 rounded-2xl"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-medium">
                    {tt("Username", "Jina la mtumiaji")}
                  </label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(event) => handleChange("username", event.target.value)}
                    placeholder={tt("Enter username", "Weka jina la mtumiaji")}
                    className="h-10 rounded-2xl"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                    {tt("Phone number", "Namba ya simu")}
                  </label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    placeholder={tt("Enter phone number", "Weka namba ya simu")}
                    className="h-10 rounded-2xl"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  {tt("Email address", "Anwani ya barua pepe")}
                </label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="h-10 rounded-2xl"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-chart-3" disabled={saving}>
                  <Save className="size-4" />
                  {saving ? tt("Saving...", "Inahifadhi...") : tt("Save changes", "Hifadhi mabadiliko")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
