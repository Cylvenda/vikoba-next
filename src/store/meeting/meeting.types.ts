export type MeetingStatus = "scheduled" | "ongoing" | "ended" | "cancelled"

export type AgendaSection = {
  id: string
  meeting: string
  title: string
  description: string | undefined
  order: number
  is_active: boolean
  items?: AgendaItem[]
  created_at: string
  updated_at: string
}

export type AgendaItem = {
  id: string
  meeting: string
  section?: string | undefined
  title: string
  description: string | undefined
  notes?: string | undefined
  order: number
  allocated_minutes: number
  completed: boolean
  completed_at?: string | null
  completed_by?: string | null
  completed_by_email?: string | null
}

export type AttendanceRecord = {
  id: string
  meeting: string
  user: string
  user_email: string
  user_name?: string
  first_joined_at: string | null
  last_left_at: string | null
  total_duration_minutes: number
  status: string
  is_verified_member: boolean
}

export type ParticipantSession = {
  id: string
  user: string
  user_email: string
  user_name?: string
  joined_at: string
  left_at: string | null
}

export type RealtimeConnection = {
  token: string
  room: string
  url?: string
}

export type MinuteSection = {
  id: string
  meeting: string
  agenda_section: string | null
  title: string
  description: string | null
  order: number
  is_active_working: boolean
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  completed_by_email: string | null
  notes: string | null
}

export type MeetingMinutes = {
  id: string
  meeting: string
  content: string
  prepared_by: string | null
  prepared_by_email: string | null
  approved: boolean
  created_at: string
  updated_at: string
}

export type AgendaMinuteNote = {
  id: string
  agenda_item_id: string
  agenda_item_title: string
  agenda_item_description?: string | null
  allocated_minutes: number
  notes: string | null
  host_notes: string | null
  status: "pending" | "ongoing" | "completed"
  start_time: string | null
  end_time: string | null
  created_at: string
  updated_at: string
}

export type AdditionalNote = {
  id: string
  title: string
  notes: string
  host_notes: string | null
  created_by: string | null
  created_by_name?: string
  created_by_email?: string
  created_at: string
  updated_at: string
}

export type MeetingAuditLog = {
  id: string
  user: string | null
  user_email: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
}

export type Meeting = {
  id: string
  title: string
  description: string | null
  group: string
  host: string
  host_email: string
  scheduled_start: string
  scheduled_end: string | null
  actual_start: string | null
  actual_end: string | null
  status: MeetingStatus
  is_locked: boolean
  agenda_sections?: AgendaSection[]
  agenda_items?: AgendaItem[]
  minute_sections?: MinuteSection[]
  minutes?: MeetingMinutes | null
  created_at: string
  updated_at: string
}

export type MeetingHistory = Meeting & {
  attendance_records: AttendanceRecord[]
  participant_sessions: ParticipantSession[]
  agenda_minute_notes: AgendaMinuteNote[]
  additional_notes: AdditionalNote[]
  audit_logs: MeetingAuditLog[]
  total_attendees: number
  present_attendees: number
  meeting_duration_minutes: number
  agenda_completion_percentage: number
  has_minutes: boolean
}

export type MeetingListHistory = Omit<Meeting, 'agenda_sections' | 'agenda_items' | 'minutes'> & {
  total_attendees: number
  present_attendees: number
  meeting_duration_minutes: number
  agenda_completion_percentage: number
  has_minutes: boolean
  agenda_items_count: number
}
