"use client"

import { useEffect, useMemo } from "react"
import { BellRing, CheckCheck, MailPlus, ShieldAlert, Inbox, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useNotificationStore } from "@/store/notifications/notification.store"
import { toast } from "react-toastify"
import { useLanguage } from "@/components/language/language-provider"

export default function Page() {
     const { user } = useAuthUserStore()
     const { invitations, invitationLoading, respondToInvitation, fetchGroups, fetchMyInvitations } = useGroupStore()
     const { notifications, loading: notificationsLoading, error: notificationsError, fetchNotifications, markAsRead } = useNotificationStore()
     const { language } = useLanguage()
     const tt = (en: string, sw: string) => language === "sw" ? sw : en

     const unreadNotifications = notifications.filter((notification) => !notification.read)
     const viewedNotifications = notifications.filter((notification) => notification.read)

     const invitationItems = useMemo(
          () =>
               invitations.map((invitation) => ({
                    id: invitation.invitation_uuid,
                    kind: "invitation" as const,
                    title: `${language === "sw" ? "Mwaliko wa kujiunga na" : "Invitation to join"} ${invitation.group_name}`,
                    message: invitation.message || `${language === "sw" ? "Umealikwa na" : "You were invited by"} ${invitation.invited_by_email}.`,
                    createdAt: new Date(invitation.created_at),
                    read: false,
                    invitation,
               })),
          [invitations, language]
     )

     const unreadItems = useMemo(() => {
          const notificationItems = unreadNotifications.map((notification) => ({
               id: notification.id,
               kind: "notification" as const,
               title: notification.type.replaceAll("_", " "),
               message: notification.message,
               createdAt: new Date(notification.created_at),
               read: notification.read,
               notification,
          }))

          return [...invitationItems, ...notificationItems].sort(
               (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          )
     }, [invitationItems, unreadNotifications])

     const viewedItems = useMemo(
          () =>
               viewedNotifications
                    .map((notification) => ({
                         id: notification.id,
                         kind: "notification" as const,
                         title: notification.type.replaceAll("_", " "),
                         message: notification.message,
                         createdAt: new Date(notification.created_at),
                         read: notification.read,
                         notification,
                    }))
                   .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
          [viewedNotifications]
     )

     useEffect(() => {
          void Promise.allSettled([fetchNotifications(), fetchMyInvitations()])
     }, [fetchNotifications, fetchMyInvitations])

     const handleResponse = async (invitationUuid: string, action: "accept" | "decline") => {
          const result = await respondToInvitation(invitationUuid, action)
          if (result.success) {
               toast.success(result.message)
               if (action === "accept") {
                    await fetchGroups()
               }
               return
          }

          toast.error(result.message)
     }

     const handleMarkAsRead = async (notificationId: string) => {
          const result = await markAsRead(notificationId)
          if (!result.success) {
               toast.error(result.message)
          }
     }

     const formatDateTime = (date: Date) =>
          date.toLocaleString("en-US", {
               month: "short",
               day: "numeric",
               year: "numeric",
               hour: "numeric",
               minute: "2-digit",
          })

     const overviewItems = [
          {
               label: tt("Pending invitations", "Mialiko inayosubiri"),
               value: invitations.length,
               icon: <MailPlus className="size-5" />,
          },
          {
               label: tt("Unread updates", "Taarifa ambazo hazijasomwa"),
               value: unreadNotifications.length,
               icon: <BellRing className="size-5" />,
          },
          {
               label: tt("Viewed updates", "Taarifa zilizotazamwa"),
               value: viewedNotifications.length,
               icon: <MailCheck className="size-5" />,
          },
          {
               label: tt("Total activity", "Jumla ya shughuli"),
               value: invitations.length + notifications.length,
               icon: <CheckCheck className="size-5" />,
          },
     ]

     return (
          <div className="w-full p-4 md:p-6 lg:p-8">
               <div className="mx-auto w-full max-w-screen-3xl space-y-6">
               <Card className="border-none bg-accent shadow-sm">
                    <CardHeader>
                         <CardTitle className="text-3xl">{tt("Notifications", "Taarifa")}</CardTitle>
                         <CardDescription>
                              {tt("Review account activity, see group invitations, and respond without leaving this page.", "Kagua shughuli za akaunti, tazama mialiko ya vikundi, na ujibu bila kuondoka kwenye ukurasa huu.")}
                         </CardDescription>
                    </CardHeader>
               </Card>

               <div className="grid gap-5 md:grid-cols-4">
                    {overviewItems.map((item) => (
                         <Card key={item.label} className="border-none bg-card shadow-sm">
                              <CardContent className="flex items-center justify-between p-5">
                                   <div>
                                        <p className="text-sm text-muted-foreground">{item.label}</p>
                                        <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                                   </div>
                                   <div className="flex size-12 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-3">
                                        {item.icon}
                                   </div>
                              </CardContent>
                         </Card>
                    ))}
               </div>

               {notificationsError ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                         <span>{notificationsError}</span>
                    </div>
               ) : null}

               <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                    <Card className="border-none bg-card shadow-sm">
                         <CardHeader className="border-b">
                              <div className="flex items-center gap-3">
                                   <div className="flex size-11 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-3">
                                        <Inbox className="size-5" />
                                   </div>
                                   <div>
                                        <CardTitle>{tt("Unread activity", "Shughuli ambazo hazijasomwa")}</CardTitle>
                                        <CardDescription>
                                             {tt("New notifications and pending invitations that still need your attention.", "Taarifa mpya na mialiko inayosubiri ambayo bado inahitaji uangalizi wako.")}
                                        </CardDescription>
                                   </div>
                              </div>
                         </CardHeader>

                         <CardContent className="space-y-4 pt-6">
                              {unreadItems.length === 0 ? (
                                   <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                        {tt("No unread activity right now.", "Hakuna shughuli mpya kwa sasa.")}
                                   </div>
                              ) : (
                                   unreadItems.map((item) => (
                                        <div key={`${item.kind}-${item.id}`} className="rounded-3xl border border-border bg-muted/30 p-5">
                                             <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                  <div className="space-y-2">
                                                       <div className="flex items-center gap-2">
                                                            <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                                                                 {item.kind === "invitation" ? tt("Invitation", "Mwaliko") : tt("Notification", "Taarifa")}
                                                            </span>
                                                            <span className="rounded-full bg-chart-2/20 px-3 py-1 text-xs font-medium text-chart-3">
                                                                 {tt("New", "Mpya")}
                                                            </span>
                                                       </div>

                                                       <h2 className="text-lg font-semibold">{item.title}</h2>
                                                       <p className="text-sm text-muted-foreground">{item.message}</p>
                                                       <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>

                                                       {item.kind === "invitation" && (
                                                            <div className="rounded-2xl bg-background p-4 text-sm text-muted-foreground ring-1 ring-border">
                                                                 <p>{tt("Group:", "Kikundi:")} {item.invitation.group_name}</p>
                                                                 <p>{tt("Invited by:", "Umealikwa na:")} {item.invitation.invited_by_email}</p>
                                                                 <p>{tt("Status:", "Hali:")} {item.invitation.status}</p>
                                                            </div>
                                                       )}

                                                       {item.kind === "invitation" &&
                                                            user?.email &&
                                                            item.invitation.invited_by_email.toLowerCase() === user.email.toLowerCase() && (
                                                                 <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                                                                      {tt("This invitation was sent from your own account and cannot be accepted or declined.", "Mwaliko huu ulitumwa kutoka akaunti yako na hauwezi kukubaliwa au kukataliwa.")}
                                                                 </div>
                                                            )}
                                                  </div>

                                                  <div className="flex flex-wrap gap-2">
                                                       {item.kind === "invitation" &&
                                                       (!user?.email ||
                                                            item.invitation.invited_by_email.toLowerCase() !== user.email.toLowerCase()) ? (
                                                            <>
                                                                 <Button
                                                                     variant="outline"
                                                                     disabled={invitationLoading}
                                                                      onClick={() => handleResponse(item.invitation.invitation_uuid, "decline")}
                                                                 >
                                                                      {tt("Decline", "Kataa")}
                                                                 </Button>
                                                                 <Button
                                                                     className="bg-chart-3"
                                                                     disabled={invitationLoading}
                                                                      onClick={() => handleResponse(item.invitation.invitation_uuid, "accept")}
                                                                 >
                                                                      {tt("Join group", "Jiunge na kikundi")}
                                                                 </Button>
                                                            </>
                                                       ) : (
                                                            item.kind === "notification" && (
                                                                <Button
                                                                     variant="outline"
                                                                      disabled={item.notification.read || notificationsLoading}
                                                                      onClick={() => void handleMarkAsRead(item.notification.id)}
                                                                 >
                                                                      {item.notification.read ? tt("Read", "Imesomwa") : tt("Mark as read", "Weka kuwa imesomwa")}
                                                                </Button>
                                                            )
                                                       )}
                                                  </div>
                                             </div>
                                        </div>
                                   ))
                              )}
                         </CardContent>
                    </Card>

                    <Card className="border-none bg-card shadow-sm">
                         <CardHeader className="border-b">
                              <div className="flex items-center gap-3">
                                   <div className="flex size-11 items-center justify-center rounded-2xl bg-chart-4/15 text-chart-4">
                                        <MailCheck className="size-5" />
                                   </div>
                                   <div>
                                        <CardTitle>{tt("Viewed notifications", "Taarifa zilizotazamwa")}</CardTitle>
                                        <CardDescription>
                                             {tt("Read updates stay here so you can review them later without cluttering the main feed.", "Taarifa zilizosomwa hukaa hapa ili uzikague baadaye bila kujaza orodha kuu.")}
                                        </CardDescription>
                                   </div>
                              </div>
                         </CardHeader>

                         <CardContent className="space-y-4 pt-6">
                              {viewedItems.length === 0 ? (
                                   <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                        {tt("No viewed notifications yet.", "Bado hakuna taarifa zilizotazamwa.")}
                                   </div>
                              ) : (
                                   viewedItems.map((item) => (
                                        <div key={`${item.kind}-${item.id}`} className="rounded-3xl border border-border bg-muted/20 p-5">
                                             <div className="space-y-2">
                                                  <div className="flex items-center gap-2">
                                                       <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                                                            {tt("Viewed", "Imetazamwa")}
                                                       </span>
                                                       <span className="rounded-full bg-chart-2/15 px-3 py-1 text-xs font-medium text-chart-3">
                                                            {tt("Read", "Imesomwa")}
                                                       </span>
                                                  </div>

                                                  <h2 className="text-lg font-semibold">{item.title}</h2>
                                                  <p className="text-sm text-muted-foreground">{item.message}</p>
                                                  <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>

                                                  <Button
                                                       variant="outline"
                                                       className="w-full"
                                                       disabled={item.notification.read || notificationsLoading}
                                                       onClick={() => void handleMarkAsRead(item.notification.id)}
                                                  >
                                                       {item.notification.read ? tt("Already viewed", "Tayari imetazamwa") : tt("Mark as viewed", "Weka kuwa imetazamwa")}
                                                  </Button>
                                             </div>
                                        </div>
                                   ))
                              )}
                         </CardContent>
                    </Card>
               </div>

               {invitations.length > 0 && (
                    <Card className="border-none bg-card shadow-sm">
                         <CardHeader>
                              <CardTitle className="text-lg">{tt("Invitation reminder", "Kikumbusho cha mwaliko")}</CardTitle>
                              <CardDescription>
                                   {tt("You still have", "Bado una")} {invitations.length} {tt("pending group invitation(s).", "mialiko ya kikundi inayosubiri.")}
                              </CardDescription>
                         </CardHeader>
                         <CardContent>
                              <div className="flex items-start gap-3 rounded-2xl bg-chart-2/12 p-4 text-sm text-foreground ring-1 ring-chart-2/30">
                                   <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                                   {tt("Accept invitations to see those groups in your dashboard, or decline them to clear this list.", "Kubali mialiko kuona vikundi hivyo kwenye dashibodi yako, au ikatae kuondoa orodha hii.")}
                              </div>
                         </CardContent>
                    </Card>
               )}
               </div>
          </div>
     )
}
