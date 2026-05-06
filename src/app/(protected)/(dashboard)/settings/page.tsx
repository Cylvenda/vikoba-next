"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "react-toastify"
import { KeyRound, MailCheck, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { authUserService } from "@/api/services/auth.service"
import { userServices } from "@/api/services/user.service"
import ThemeToggle from "@/components/theme/theme-toggle"

export default function SettingsPage() {
  const { user } = useAuthUserStore()
  const [sendingReset, setSendingReset] = useState(false)
  const [sendingActivation, setSendingActivation] = useState(false)

  const handlePasswordReset = async () => {
    if (!user?.email) return

    setSendingReset(true)
    try {
      await authUserService.requestPasswordReset({ email: user.email })
      toast.success("Password reset email sent.")
    } catch {
      toast.error("Failed to send password reset email.")
    } finally {
      setSendingReset(false)
    }
  }

  const handleActivationEmail = async () => {
    if (!user?.email) return

    setSendingActivation(true)
    try {
      await userServices.emailActivation(user.email)
      toast.success("Activation email sent.")
    } catch {
      toast.error("Failed to send activation email.")
    } finally {
      setSendingActivation(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6 md:p-10">
      <Card className="border-none bg-accent shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Settings</CardTitle>
          <CardDescription>
            Manage account security, profile shortcuts, and workspace access from one place.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Account overview</CardTitle>
            <CardDescription>Your current account identity inside Meeting Hub.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="mt-1 text-lg font-semibold">{user?.email ?? "Unknown user"}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
                <p className="mt-1 text-sm font-medium">
                  {user?.isAdmin ? "Administrator" : user?.isStaff ? "Staff member" : "Standard member"}
                </p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-medium">{user?.isActive ? "Active" : "Awaiting activation"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/profile">Open profile</Link>
              </Button>
              {user?.isAdmin && (
                <Button asChild variant="outline">
                  <Link href="/admin">Open admin panel</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Use these actions when you need to secure or reactivate your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-3">
                  <KeyRound className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Password reset email</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Send yourself a reset link if you want to change your password securely.
                  </p>
                  <Button className="mt-3 bg-chart-3" onClick={handlePasswordReset} disabled={sendingReset}>
                    {sendingReset ? "Sending..." : "Send reset link"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-3">
                  <MailCheck className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Activation email</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Resend an activation email if your account still needs verification.
                  </p>
                  <Button variant="outline" className="mt-3" onClick={handleActivationEmail} disabled={sendingActivation}>
                    {sendingActivation ? "Sending..." : "Resend activation"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-chart-2/12 p-4 text-sm text-foreground ring-1 ring-chart-2/30">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                Use password reset if you think your account was accessed from another device.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Switch the workspace between light and dark themes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">Theme mode</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your selection is saved on this device and applied the next time you return.
              </p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
