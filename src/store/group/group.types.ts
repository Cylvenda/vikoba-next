export type GroupMembership = {
     id: string
     user_id: string
     membership_id: string
     email: string
     first_name: string
     last_name: string
     role: "HOST" | "MEMBER" | "MODERATOR" // you can adjust if needed
     is_active: boolean
     is_verified: boolean
     joined_at: string // ISO date
}

export type Group = {
     id: string
     name: string
     description: string
     created_by: string
     is_active: boolean
     is_private: boolean
     members_count: number
     created_at: string // ISO date
     updated_at: string // ISO date
}

export type GroupInvitation = {
     invitation_uuid: string
     group_uuid: string
     group_name: string
     email: string
     invited_by_email: string
     status: "pending" | "accepted" | "declined" | "cancelled" | "expired"
     message: string | null
     created_at: string
     responded_at: string | null
}
