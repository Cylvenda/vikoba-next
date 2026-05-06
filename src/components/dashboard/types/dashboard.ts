export type UserRole = "admin" | "host" | "member"

export type UserStatus = "online" | "offline" | "away"

export interface User {
     id: string // UUID
     name: string
     email: string
     avatar: string
     role: UserRole
     status: UserStatus
     last_seen: string | null // ISO datetime
     created_at: string // ISO datetime
}

export interface Group {
     id: string // UUID
     name: string
     description: string
     is_private: boolean
     created_by: string // User.id
     members: string[] // array of User.id
     created_at: string // ISO datetime
}

export type MeetingStatus = "live" | "ended" | "upcoming"

export interface Meeting {
     id: string // UUID
     group_id: string // Group.id
     title: string
     description?: string
     host_id: string // User.id
     participants?: string[] // User.id[]
     start_time: string // ISO datetime
     end_time?: string | null
     duration?: number | null // minutes
     status: MeetingStatus | string
     created_at?: string
}