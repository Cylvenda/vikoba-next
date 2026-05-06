"use client"

export type MeetingSidebarTab = "chat" | "attendance" | "agenda" | "minutes"

export type MeetingChatMessage = {
  id: string
  senderId: string
  senderName: string
  text: string
  createdAt: string
  kind?: "user" | "system"
}

export type MeetingAgendaStatus = "Pending" | "Ongoing" | "Done"

export type MeetingParticipantSignalState = {
  raisedHand: boolean
  reactionEmoji?: string | null
  reactionAt?: string | null
}

export type MeetingAgendaItem = {
  id: string
  title: string
  description: string | null
  order: number
  allocatedMinutes: number
  status: MeetingAgendaStatus
}

export type MeetingAttendanceItem = {
  id: string
  name: string
  email: string
  joinedAt: string | null
  lastLeftAt: string | null
  totalDurationMinutes: number
  joinCount: number
  status: "online" | "offline"
  badge: "Host" | "Member"
  isCurrentUser: boolean
  sessions: Array<{
    id: string
    joinedAt: string
    leftAt: string | null
  }>
}
