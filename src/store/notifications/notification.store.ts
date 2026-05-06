import { create } from "zustand"
import type { Notification } from "./notification.types"

export type NotificationStore = {
     notifications: Notification[]
     loading: boolean
     error: string | null

     addNotification: (notification: Notification) => void
     markAsRead: (id: string) => void
     clearNotifications: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
     notifications: [],
     loading: false,
     error: null,

     addNotification: (notification) =>
          set((state) => ({
               notifications: [notification, ...state.notifications],
          })),

     markAsRead: (id) =>
          set((state) => ({
               notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, read: true } : n
               ),
          })),

     clearNotifications: () => set({ notifications: [] }),
}))
