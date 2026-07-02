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
import { useLanguage } from "@/components/language/language-provider"

export default function SettingsPage() {
  const { user } = useAuthUserStore()
  const { language } = useLanguage()
  const isSwahili = language === "sw"
  const tt = (en: string, sw: string) => (isSwahili ? sw : en)
  const [sendingReset, setSendingReset] = useState(false)
  const [sendingActivation, setSendingActivation] = useState(false)

  const handlePasswordReset = async () => {
    if (!user?.email) return

    setSendingReset(true)
    try {
      await authUserService.requestPasswordReset({ email: user.email })
      toast.success(tt("Password reset email sent.", "Barua pepe ya kurejesha nenosiri imetumwa."))
    } catch {
      toast.error(tt("Failed to send password reset email.", "Imeshindikana kutuma barua pepe ya kurejesha nenosiri."))
    } finally {
      setSendingReset(false)
    }
  }

  const handleActivationEmail = async () => {
    if (!user?.email) return

    setSendingActivation(true)
    try {
      await userServices.emailActivation(user.email)
      toast.success(tt("Activation email sent.", "Barua pepe ya uanzishaji imetumwa."))
    } catch {
      toast.error(tt("Failed to send activation email.", "Imeshindikana kutuma barua pepe ya uanzishaji."))
    } finally {
      setSendingActivation(false)
    }
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-screen-3xl space-y-6">
      <Card className="border-none bg-accent shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">{tt("Settings", "Mipangilio")}</CardTitle>
          <CardDescription>
            {tt("Manage account security, profile shortcuts, and workspace access from one place.", "Dhibiti usalama wa akaunti, njia za mkato za wasifu, na ufikiaji wa nafasi ya kazi kutoka sehemu moja.")}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{tt("Account overview", "Muhtasari wa akaunti")}</CardTitle>
            <CardDescription>{tt("Your current account identity inside Community Hub.", "Utambulisho wako wa sasa wa akaunti ndani ya Community Hub.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">{tt("Signed in as", "Umeingia kama")}</p>
              <p className="mt-1 text-lg font-semibold">{user?.email ?? tt("Unknown user", "Mtumiaji hajulikani")}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Role", "Jukumu")}</p>
                <p className="mt-1 text-sm font-medium">
                  {user?.isAdmin ? tt("Administrator", "Msimamizi") : user?.isStaff ? tt("Staff member", "Mfanyakazi") : tt("Standard member", "Mwanachama wa kawaida")}
                </p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Status", "Hali")}</p>
                <p className="mt-1 text-sm font-medium">{user?.isActive ? tt("Active", "Hai") : tt("Awaiting activation", "Inasubiri uanzishaji")}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/profile">{tt("Open profile", "Fungua wasifu")}</Link>
              </Button>
              {user?.isAdmin && (
                <Button asChild variant="outline">
                  <Link href="/admin">{tt("Open admin panel", "Fungua paneli ya msimamizi")}</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{tt("Security", "Usalama")}</CardTitle>
            <CardDescription>{tt("Use these actions when you need to secure or reactivate your account.", "Tumia vitendo hivi unapohitaji kulinda au kuwasha upya akaunti yako.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-3">
                  <KeyRound className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{tt("Password reset email", "Barua pepe ya kurejesha nenosiri")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tt("Send yourself a reset link if you want to change your password securely.", "Jitumie kiungo cha kurejesha ikiwa unataka kubadilisha nenosiri lako kwa usalama.")}
                  </p>
                  <Button className="mt-3 bg-chart-3" onClick={handlePasswordReset} disabled={sendingReset}>
                    {sendingReset ? tt("Sending...", "Inatuma...") : tt("Send reset link", "Tuma kiungo cha kurejesha")}
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
                  <p className="font-medium">{tt("Activation email", "Barua pepe ya uanzishaji")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tt("Resend an activation email if your account still needs verification.", "Tuma tena barua pepe ya uanzishaji ikiwa akaunti yako bado inahitaji uthibitisho.")}
                  </p>
                  <Button variant="outline" className="mt-3" onClick={handleActivationEmail} disabled={sendingActivation}>
                    {sendingActivation ? tt("Sending...", "Inatuma...") : tt("Resend activation", "Tuma tena uanzishaji")}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-chart-2/12 p-4 text-sm text-foreground ring-1 ring-chart-2/30">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                {tt("Use password reset if you think your account was accessed from another device.", "Tumia urejeshaji wa nenosiri ikiwa unafikiri akaunti yako ilifikiwa kutoka kifaa kingine.")}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>{tt("Appearance", "Mwonekano")}</CardTitle>
            <CardDescription>{tt("Switch the workspace between light and dark themes.", "Badilisha nafasi ya kazi kati ya mandhari nyepesi na ya giza.")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{tt("Theme mode", "Hali ya mandhari")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tt("Your selection is saved on this device and applied the next time you return.", "Chaguo lako huhifadhiwa kwenye kifaa hiki na kutumika unaporudi tena.")}
              </p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
