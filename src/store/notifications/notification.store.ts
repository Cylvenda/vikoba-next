import { create } from "zustand"
import type { Notification } from "./notification.types"
import { notificationService, type NotificationResponse } from "@/api/services/notification.service"

function mapNotification(response: NotificationResponse): Notification {
     return {
          id: response.uuid,
          title: response.title,
          type: response.notification_type as Notification["type"],
          message: response.message,
          created_at: response.created_at,
          read: response.is_read,
          read_at: response.read_at,
          group_uuid: response.group_uuid,
          invitation_uuid: response.invitation_uuid,
          membership_uuid: response.membership_uuid,
          meeting_uuid: response.meeting_uuid,
     }
}

export type NotificationStore = {
     notifications: Notification[]
     loading: boolean
     error: string | null

     fetchNotifications: () => Promise<void>
     addNotification: (notification: Notification) => void
     markAsRead: (id: string) => Promise<{ success: boolean; message: string }>
     clearNotifications: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
     notifications: [],
     loading: false,
     error: null,

     fetchNotifications: async () => {
          set({ loading: true, error: null })
          try {
               const res = await notificationService.getNotifications()
               set({
                    notifications: res.data.map(mapNotification),
                    loading: false,
               })
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Failed to fetch notifications"
               set({ loading: false, error: message })
          }
     },

     addNotification: (notification) =>
          set((state) => ({
               notifications: [notification, ...state.notifications],
          })),

     markAsRead: async (id) => {
          set({ loading: true, error: null })
          try {
               await notificationService.markAsRead(id)
               set((state) => ({
                    notifications: state.notifications.map((n) =>
                         n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
                    ),
                    loading: false,
               }))
               return { success: true, message: "Notification marked as read." }
          } catch (err: unknown) {
               const message = err instanceof Error ? err.message : "Failed to mark notification as read"
               set({ loading: false, error: message })
               return { success: false, message }
          }
     },

     clearNotifications: () => set({ notifications: [] }),
}))
