import api from "../axios"
import { API_ENDPOINTS } from "../endpoints"
import type { ApiResponse } from "../types"

export type NotificationResponse = {
     uuid: string
     title: string
     message: string
     notification_type: string
     is_read: boolean
     read_at: string | null
     group_uuid: string | null
     invitation_uuid: string | null
     membership_uuid: string | null
     meeting_uuid: string | null
     created_at: string
}

export const notificationService = {
     async getNotifications(): Promise<ApiResponse<NotificationResponse[]>> {
          const response = await api.get<NotificationResponse[]>(API_ENDPOINTS.NOTIFICATIONS)
          return {
               status: response.status,
               data: response.data,
          }
     },

     async markAsRead(notificationUuid: string): Promise<ApiResponse<{ detail: string }>> {
          const response = await api.patch<{ detail: string }>(
               `${API_ENDPOINTS.NOTIFICATIONS}${notificationUuid}/read/`
          )
          return {
               status: response.status,
               data: response.data,
          }
     },
}
