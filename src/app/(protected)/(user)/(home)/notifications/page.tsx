"use client"

import { useEffect, useMemo } from "react"
import { BellRing, CheckCheck, MailPlus, ShieldAlert, Inbox, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useNotificationStore } from "@/store/notifications/notification.store"
import { toast } from "react-toastify"

export default function Page() {
     const { user } = useAuthUserStore()
     const { invitations, invitationLoading, respondToInvitation, fetchGroups, fetchMyInvitations } = useGroupStore()
     const { notifications, loading: notificationsLoading, error: notificationsError, fetchNotifications, markAsRead } = useNotificationStore()

     const unreadNotifications = notifications.filter((notification) => !notification.read)
     const viewedNotifications = notifications.filter((notification) => notification.read)

     const invitationItems = useMemo(
          () =>
               invitations.map((invitation) => ({
                    id: invitation.invitation_uuid,
                    kind: "invitation" as const,
                    title: `Invitation to join ${invitation.group_name}`,
                    message: invitation.message || `You were invited by ${invitation.invited_by_email}.`,
                    createdAt: new Date(invitation.created_at),
                    read: false,
                    invitation,
               })),
          [invitations]
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
               label: "Pending invitations",
               value: invitations.length,
               icon: <MailPlus className="size-5" />,
          },
          {
               label: "Unread updates",
               value: unreadNotifications.length,
               icon: <BellRing className="size-5" />,
          },
          {
               label: "Viewed updates",
               value: viewedNotifications.length,
               icon: <MailCheck className="size-5" />,
          },
          {
               label: "Total activity",
               value: invitations.length + notifications.length,
               icon: <CheckCheck className="size-5" />,
          },
     ]

     return (
          <div className="w-full p-4 md:p-6 lg:p-8">
               <div className="mx-auto w-full max-w-screen-3xl space-y-6">
               <Card className="border-none bg-accent shadow-sm">
                    <CardHeader>
                         <CardTitle className="text-3xl">Notifications</CardTitle>
                         <CardDescription>
                              Review account activity, see group invitations, and respond without leaving this page.
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
                                        <CardTitle>Unread activity</CardTitle>
                                        <CardDescription>
                                             New notifications and pending invitations that still need your attention.
                                        </CardDescription>
                                   </div>
                              </div>
                         </CardHeader>

                         <CardContent className="space-y-4 pt-6">
                              {unreadItems.length === 0 ? (
                                   <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                        No unread activity right now.
                                   </div>
                              ) : (
                                   unreadItems.map((item) => (
                                        <div key={`${item.kind}-${item.id}`} className="rounded-3xl border border-border bg-muted/30 p-5">
                                             <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                  <div className="space-y-2">
                                                       <div className="flex items-center gap-2">
                                                            <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                                                                 {item.kind === "invitation" ? "Invitation" : "Notification"}
                                                            </span>
                                                            <span className="rounded-full bg-chart-2/20 px-3 py-1 text-xs font-medium text-chart-3">
                                                                 New
                                                            </span>
                                                       </div>

                                                       <h2 className="text-lg font-semibold">{item.title}</h2>
                                                       <p className="text-sm text-muted-foreground">{item.message}</p>
                                                       <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>

                                                       {item.kind === "invitation" && (
                                                            <div className="rounded-2xl bg-background p-4 text-sm text-muted-foreground ring-1 ring-border">
                                                                 <p>Group: {item.invitation.group_name}</p>
                                                                 <p>Invited by: {item.invitation.invited_by_email}</p>
                                                                 <p>Status: {item.invitation.status}</p>
                                                            </div>
                                                       )}

                                                       {item.kind === "invitation" &&
                                                            user?.email &&
                                                            item.invitation.invited_by_email.toLowerCase() === user.email.toLowerCase() && (
                                                                 <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                                                                      This invitation was sent from your own account and cannot be accepted or declined.
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
                                                                      Decline
                                                                 </Button>
                                                                 <Button
                                                                     className="bg-chart-3"
                                                                     disabled={invitationLoading}
                                                                      onClick={() => handleResponse(item.invitation.invitation_uuid, "accept")}
                                                                 >
                                                                      Join group
                                                                 </Button>
                                                            </>
                                                       ) : (
                                                            item.kind === "notification" && (
                                                                <Button
                                                                     variant="outline"
                                                                      disabled={item.notification.read || notificationsLoading}
                                                                      onClick={() => void handleMarkAsRead(item.notification.id)}
                                                                 >
                                                                      {item.notification.read ? "Read" : "Mark as read"}
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
                                        <CardTitle>Viewed notifications</CardTitle>
                                        <CardDescription>
                                             Read updates stay here so you can review them later without cluttering the main feed.
                                        </CardDescription>
                                   </div>
                              </div>
                         </CardHeader>

                         <CardContent className="space-y-4 pt-6">
                              {viewedItems.length === 0 ? (
                                   <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                        No viewed notifications yet.
                                   </div>
                              ) : (
                                   viewedItems.map((item) => (
                                        <div key={`${item.kind}-${item.id}`} className="rounded-3xl border border-border bg-muted/20 p-5">
                                             <div className="space-y-2">
                                                  <div className="flex items-center gap-2">
                                                       <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                                                            Viewed
                                                       </span>
                                                       <span className="rounded-full bg-chart-2/15 px-3 py-1 text-xs font-medium text-chart-3">
                                                            Read
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
                                                       {item.notification.read ? "Already viewed" : "Mark as viewed"}
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
                              <CardTitle className="text-lg">Invitation reminder</CardTitle>
                              <CardDescription>
                                   You still have {invitations.length} pending group invitation{invitations.length > 1 ? "s" : ""}.
                              </CardDescription>
                         </CardHeader>
                         <CardContent>
                              <div className="flex items-start gap-3 rounded-2xl bg-chart-2/12 p-4 text-sm text-foreground ring-1 ring-chart-2/30">
                                   <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                                   Accept invitations to see those groups in your dashboard, or decline them to clear this list.
                              </div>
                         </CardContent>
                    </Card>
               )}
               </div>
          </div>
     )
}
