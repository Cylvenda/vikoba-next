"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Eye, EyeOff, KeyRound, Save, UserRound } from "lucide-react"
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
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

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

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (passwordData.newPassword.length < 8) {
      toast.error(tt("The new password must contain at least 8 characters.", "Nenosiri jipya lazima liwe na angalau herufi 8."))
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(tt("The new passwords do not match.", "Manenosiri mapya hayafanani."))
      return
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error(tt("Choose a new password different from your current password.", "Chagua nenosiri jipya tofauti na nenosiri lako la sasa."))
      return
    }

    setChangingPassword(true)
    try {
      await userServices.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setShowPasswords(false)
      toast.success(tt("Password changed successfully.", "Nenosiri limebadilishwa kwa mafanikio."))
    } catch (error: unknown) {
      const responseData = (error as {
        response?: { data?: { current_password?: string[]; new_password?: string[]; detail?: string } }
      })?.response?.data
      const message = responseData?.current_password?.[0]
        || responseData?.new_password?.[0]
        || responseData?.detail
        || tt("Failed to change your password.", "Imeshindikana kubadilisha nenosiri lako.")
      toast.error(message)
    } finally {
      setChangingPassword(false)
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

      <Card className="border-none bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-chart-3/10 text-chart-3">
              <KeyRound className="size-5" />
            </div>
            <div>
              <CardTitle>{tt("Change password", "Badilisha nenosiri")}</CardTitle>
              <CardDescription className="mt-1">
                {tt("Confirm your current password, then choose a secure new password.", "Thibitisha nenosiri lako la sasa, kisha chagua nenosiri jipya salama.")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handlePasswordSubmit}>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label htmlFor="current-password" className="mb-2 block text-sm font-medium">
                  {tt("Current password", "Nenosiri la sasa")}
                </label>
                <Input
                  id="current-password"
                  type={showPasswords ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(event) => setPasswordData((current) => ({ ...current, currentPassword: event.target.value }))}
                  placeholder={tt("Enter current password", "Weka nenosiri la sasa")}
                  className="h-10 rounded-2xl"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-medium">
                  {tt("New password", "Nenosiri jipya")}
                </label>
                <Input
                  id="new-password"
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordData.newPassword}
                  onChange={(event) => setPasswordData((current) => ({ ...current, newPassword: event.target.value }))}
                  placeholder={tt("At least 8 characters", "Angalau herufi 8")}
                  className="h-10 rounded-2xl"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium">
                  {tt("Confirm new password", "Thibitisha nenosiri jipya")}
                </label>
                <Input
                  id="confirm-password"
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordData.confirmPassword}
                  onChange={(event) => setPasswordData((current) => ({ ...current, confirmPassword: event.target.value }))}
                  placeholder={tt("Repeat new password", "Rudia nenosiri jipya")}
                  className="h-10 rounded-2xl"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="justify-start gap-2 sm:justify-center"
                onClick={() => setShowPasswords((current) => !current)}
              >
                {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {showPasswords ? tt("Hide passwords", "Ficha manenosiri") : tt("Show passwords", "Onyesha manenosiri")}
              </Button>
              <Button type="submit" className="bg-chart-3" disabled={changingPassword}>
                <KeyRound className="size-4" />
                {changingPassword ? tt("Changing password...", "Inabadilisha nenosiri...") : tt("Change password", "Badilisha nenosiri")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
