
export type Notification<T = unknown> = {
     id: string
     title: string
     type: NotificationType
     message: string
     created_at: string
     read: boolean
     read_at: string | null
     group_uuid: string | null
     invitation_uuid: string | null
     membership_uuid: string | null
     meeting_uuid: string | null
     payload?: T
}


export type NotificationType =
     | "group_invitation"
     | "invitation_accepted"
     | "membership_verified"
     | "membership_activated"
     | "membership_deactivated"
     | "meeting_reminder"
     | "general"
