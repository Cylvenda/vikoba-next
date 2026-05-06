"use client"

import { useMemo, useState } from "react"
import { BellRing, CheckCheck, MailPlus, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useNotificationStore } from "@/store/notifications/notification.store"
import { toast } from "react-toastify"

export default function Page() {
     const { invitations, invitationLoading, respondToInvitation, fetchGroups } = useGroupStore()
     const { notifications, markAsRead } = useNotificationStore()
     const [filter, setFilter] = useState<"all" | "invitations" | "updates" | "unread">("all")

     const unreadNotifications = notifications.filter((notification) => !notification.read)

     const activityItems = useMemo(() => {
          const invitationItems = invitations.map((invitation) => ({
               id: invitation.invitation_uuid,
               kind: "invitation" as const,
               title: `Invitation to join ${invitation.group_name}`,
               message: invitation.message || `You were invited by ${invitation.invited_by_email}.`,
               createdAt: new Date(invitation.created_at),
               read: false,
               invitation,
          }))

          const notificationItems = notifications.map((notification) => ({
               id: notification.id,
               kind: "notification" as const,
               title: notification.type.replaceAll("_", " "),
               message: notification.message,
               createdAt: new Date(notification.created_at),
               read: notification.read,
               notification,
          }))

          return [...invitationItems, ...notificationItems]
               .filter((item) => {
                    if (filter === "invitations") return item.kind === "invitation"
                    if (filter === "updates") return item.kind === "notification"
                    if (filter === "unread") return !item.read
                    return true
               })
               .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
     }, [filter, invitations, notifications])

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
               label: "Total activity",
               value: invitations.length + notifications.length,
               icon: <CheckCheck className="size-5" />,
          },
     ]

     return (
          <div className="w-full max-w-6xl mx-auto p-6 md:p-10 space-y-6">
               <Card className="border-none bg-accent shadow-sm">
                    <CardHeader>
                         <CardTitle className="text-3xl">Notifications</CardTitle>
                         <CardDescription>
                              Review account activity, see group invitations, and respond without leaving this page.
                         </CardDescription>
                    </CardHeader>
               </Card>

               <div className="grid gap-5 md:grid-cols-3">
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

               <Card className="border-none bg-card shadow-sm">
                    <CardHeader className="gap-4 border-b">
                         <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                   <CardTitle>Recent activity</CardTitle>
                                   <CardDescription>
                                        Invitations and updates appear together so nothing important gets missed.
                                   </CardDescription>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                   {[
                                        { value: "all", label: "All" },
                                        { value: "invitations", label: "Invitations" },
                                        { value: "updates", label: "Updates" },
                                        { value: "unread", label: "Unread" },
                                   ].map((item) => (
                                        <Button
                                             key={item.value}
                                             type="button"
                                             variant={filter === item.value ? "default" : "outline"}
                                             className={filter === item.value ? "bg-chart-3" : ""}
                                             onClick={() => setFilter(item.value as typeof filter)}
                                        >
                                             {item.label}
                                        </Button>
                                   ))}
                              </div>
                         </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-6">
                         {activityItems.length === 0 && (
                              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                   No notifications yet. Group invitations will appear here automatically.
                              </div>
                         )}

                         {activityItems.map((item) => (
                              <div key={`${item.kind}-${item.id}`} className="rounded-3xl border border-border bg-muted/30 p-5">
                                   <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-2">
                                             <div className="flex items-center gap-2">
                                                  <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                                                       {item.kind === "invitation" ? "Invitation" : "Notification"}
                                                  </span>
                                                  {!item.read && (
                                                       <span className="rounded-full bg-chart-2/20 px-3 py-1 text-xs font-medium text-chart-3">
                                                            New
                                                       </span>
                                                  )}
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
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                             {item.kind === "invitation" ? (
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
                                                  <Button
                                                       variant="outline"
                                                       disabled={item.notification.read}
                                                       onClick={() => markAsRead(item.notification.id)}
                                                  >
                                                       {item.notification.read ? "Read" : "Mark as read"}
                                                  </Button>
                                             )}
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </CardContent>
               </Card>

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
     )
}
