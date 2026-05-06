"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Save, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { userServices } from "@/api/services/user.service"

export default function ProfilePage() {
  const { user, fetchUser } = useAuthUserStore()
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
      toast.success("Profile updated successfully.")
    } catch {
      toast.error("Failed to update your profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6 md:p-10">
      <Card className="border-none bg-accent shadow-sm">
         <CardHeader>
          <CardTitle className="text-3xl">Profile</CardTitle>
          <CardDescription>
            Update the identity details other members will see across groups, meetings, and invitations.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-none bg-card shadow-sm">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-chart-2/15 text-chart-3">
              <UserRound className="size-10" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Workspace member"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

            <div className="mt-6 grid w-full gap-3 text-left">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Username</p>
                <p className="mt-1 text-sm font-medium">{user?.username || "Not set"}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="mt-1 text-sm font-medium">{user?.phone || "Not set"}</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Access level</p>
                <p className="mt-1 text-sm font-medium">
                  {user?.isAdmin ? "Administrator" : user?.isStaff ? "Staff member" : "Standard member"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>
              Keep your name, username, and phone number up to date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="first-name" className="mb-2 block text-sm font-medium">
                    First name
                  </label>
                  <Input
                    id="first-name"
                    value={formData.first_name}
                    onChange={(event) => handleChange("first_name", event.target.value)}
                    placeholder="Enter first name"
                    className="h-10 rounded-2xl"
                  />
                </div>

                <div>
                  <label htmlFor="last-name" className="mb-2 block text-sm font-medium">
                    Last name
                  </label>
                  <Input
                    id="last-name"
                    value={formData.last_name}
                    onChange={(event) => handleChange("last_name", event.target.value)}
                    placeholder="Enter last name"
                    className="h-10 rounded-2xl"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(event) => handleChange("username", event.target.value)}
                    placeholder="Enter username"
                    className="h-10 rounded-2xl"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                    Phone number
                  </label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    placeholder="Enter phone number"
                    className="h-10 rounded-2xl"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Email address
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
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
