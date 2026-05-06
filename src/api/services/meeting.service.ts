import api from "../axios"
import { API_ENDPOINTS } from "../endpoints"
import type { ApiResponse } from "../types"
import type {
  AgendaSection,
  AgendaItem,
  AttendanceRecord,
  Meeting,
  MeetingMinutes,
  MinuteSection,
  ParticipantSession,
  RealtimeConnection,
  MeetingHistory,
  MeetingListHistory,
  MeetingAuditLog,
} from "@/store/meeting/meeting.types"

type AdditionalNoteApi = {
  id: string
  title: string
  notes: string
  host_notes?: string | null
  created_by_name?: string
  created_by_email?: string
  created_at: string
  updated_at: string
}

type AdditionalNoteDto = {
  id: string
  title: string
  notes: string
  hostNotes: string
  createdByName?: string
  createdByEmail?: string
  createdAt: string
  updatedAt: string
}

type AgendaMinuteNoteApi = {
  id: string
  title?: string | null
  agenda_item_id?: string | null
  agenda_item_title?: string | null
  agenda_item_description?: string | null
  allocated_minutes?: number | null
  notes?: string | null
  host_notes?: string | null
  status: "pending" | "ongoing" | "completed"
  start_time?: string | null
  end_time?: string | null
  created_at: string
  updated_at: string
}

type BulkAgendaMinuteNotesResponse = {
  saved_notes: AgendaMinuteNoteApi[]
  errors: Array<Record<string, string>>
  success_count: number
  error_count: number
}

const mapAdditionalNote = (note: AdditionalNoteApi): AdditionalNoteDto => ({
  id: note.id,
  title: note.title,
  notes: note.notes || "",
  hostNotes: note.host_notes || "",
  createdByName: note.created_by_name,
  createdByEmail: note.created_by_email,
  createdAt: note.created_at,
  updatedAt: note.updated_at,
})

export const meetingServices = {
  async getMeetings(): Promise<ApiResponse<Meeting[]>> {
    const response = await api.get<Meeting[]>(API_ENDPOINTS.USER_MEETINGS)

    return {
      status: response.status,
      data: response.data,
    }
  },

  async getMeetingById(meetingId: string): Promise<ApiResponse<Meeting>> {
    const response = await api.get<Meeting>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async createMeeting(payload: {
    title: string
    description?: string
    group: string
    scheduled_start: string
    scheduled_end?: string
  }): Promise<ApiResponse<Meeting>> {
    const response = await api.post<Meeting>(API_ENDPOINTS.USER_MEETINGS, payload)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async createInstantMeeting(payload: {
    title?: string
    description?: string
    group: string
  }): Promise<ApiResponse<Meeting>> {
    const response = await api.post<Meeting>(`${API_ENDPOINTS.USER_MEETINGS}instant/`, payload)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async startMeeting(meetingId: string) {
    const response = await api.post<{ detail: string }>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/start/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async endMeeting(meetingId: string) {
    const response = await api.post<{ detail: string }>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/end/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async joinMeeting(meetingId: string) {
    const response = await api.post<RealtimeConnection>(`${API_ENDPOINTS.REALTIME}meetings/${meetingId}/token/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async leaveMeeting(meetingId: string) {
    const response = await api.post<{ detail: string }>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/leave/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async getAttendance(meetingId: string): Promise<ApiResponse<AttendanceRecord[]>> {
    const response = await api.get<AttendanceRecord[]>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/attendance/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async getParticipants(meetingId: string): Promise<ApiResponse<ParticipantSession[]>> {
    const response = await api.get<ParticipantSession[]>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/participants/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async getMinutes(meetingId: string): Promise<ApiResponse<MeetingMinutes>> {
    const response = await api.get<MeetingMinutes>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/minutes/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async createMinutes(meetingId: string, payload: { content: string; approved?: boolean }): Promise<ApiResponse<MeetingMinutes>> {
    const response = await api.post<MeetingMinutes>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/minutes/`, payload)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async updateMinutes(meetingId: string, payload: { content?: string; approved?: boolean }): Promise<ApiResponse<MeetingMinutes>> {
    const response = await api.patch<MeetingMinutes>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/minutes/`, payload)
    return {
      status: response.status,
      data: response.data,
    }
  },

  // Agenda Section Services
  async getAgendaSections(meetingId: string): Promise<ApiResponse<AgendaSection[]>> {
    const response = await api.get<AgendaSection[]>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/agenda-sections/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async createAgendaSection(payload: {
    meeting: string
    title: string
    description?: string
    order: number
    is_active?: boolean
  }): Promise<ApiResponse<AgendaSection>> {
    const response = await api.post<AgendaSection>(API_ENDPOINTS.AGENDA_SECTIONS, payload)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async updateAgendaSection(sectionId: string, payload: {
    title?: string
    description?: string
    order?: number
    is_active?: boolean
  }): Promise<ApiResponse<AgendaSection>> {
    const response = await api.patch<AgendaSection>(`${API_ENDPOINTS.AGENDA_SECTIONS}${sectionId}/`, payload)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async deleteAgendaSection(sectionId: string) {
    const response = await api.delete(`${API_ENDPOINTS.AGENDA_SECTIONS}${sectionId}/`)
    return {
      status: response.status,
      data: null,
    }
  },

  // Agenda Item Services
  async getAgendaItems(meetingId: string): Promise<ApiResponse<AgendaItem[]>> {
    const response = await api.get<AgendaItem[]>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/agenda-items/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async createAgendaItem(payload: {
    meeting: string
    section?: string
    title: string
    description?: string
    notes?: string
    order: number
    allocated_minutes?: number
    completed?: boolean
  }): Promise<ApiResponse<AgendaItem>> {
    const response = await api.post<AgendaItem>(API_ENDPOINTS.AGENDA_ITEMS, payload)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async updateAgendaItem(itemId: string, payload: {
    section?: string
    title?: string
    description?: string
    notes?: string
    order?: number
    allocated_minutes?: number
    completed?: boolean
  }): Promise<ApiResponse<AgendaItem>> {
    const response = await api.patch<AgendaItem>(`${API_ENDPOINTS.AGENDA_ITEMS}${itemId}/`, payload)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async deleteAgendaItem(agendaItemId: string) {
    const response = await api.delete(`${API_ENDPOINTS.AGENDA_ITEMS}${agendaItemId}/`)
    return {
      status: response.status,
      data: null,
    }
  },

  // Meeting History Services
  async getMeetingHistory(meetingId: string): Promise<ApiResponse<MeetingHistory>> {
    const response = await api.get<MeetingHistory>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/history/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async getMeetingHistoryList(params?: {
    status?: string
    start_date?: string
    end_date?: string
  }): Promise<ApiResponse<MeetingListHistory[]>> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append('status', params.status)
    if (params?.start_date) searchParams.append('start_date', params.start_date)
    if (params?.end_date) searchParams.append('end_date', params.end_date)

    const url = searchParams.toString()
      ? `${API_ENDPOINTS.USER_MEETINGS}history_list/?${searchParams.toString()}`
      : `${API_ENDPOINTS.USER_MEETINGS}history_list/`

    const response = await api.get<MeetingListHistory[]>(url)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async getMeetingAuditLog(meetingId: string): Promise<ApiResponse<MeetingAuditLog[]>> {
    const response = await api.get<MeetingAuditLog[]>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/audit_log/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  // Minute Sections API
  async getMinuteSections(meetingId: string): Promise<ApiResponse<MinuteSection[]>> {
    const response = await api.get<MinuteSection[]>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/minute_sections/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async createMinuteSections(meetingId: string): Promise<ApiResponse<MinuteSection[]>> {
    const response = await api.post<MinuteSection[]>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/minute_sections/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async updateMinuteSection(meetingId: string, sectionUuid: string, data: {
    is_active_working?: boolean
    is_completed?: boolean
    notes?: string
  }): Promise<ApiResponse<MinuteSection>> {
    const response = await api.patch<MinuteSection>(
      `${API_ENDPOINTS.USER_MEETINGS}${meetingId}/minute_sections/`,
      { section_uuid: sectionUuid, ...data }
    )
    return {
      status: response.status,
      data: response.data,
    }
  },

  // Agenda Minute Notes API
  async getAgendaMinuteNotes(meetingId: string): Promise<ApiResponse<AgendaMinuteNoteApi[]>> {
    const response = await api.get<AgendaMinuteNoteApi[]>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/agenda_minute_notes/`)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async saveAgendaMinuteNote(meetingId: string, data: {
    agenda_item_id?: string
    title?: string
    notes?: string
    host_notes?: string
    status?: string
    start_time?: string
    end_time?: string
  }): Promise<ApiResponse<AgendaMinuteNoteApi>> {
    const response = await api.post<AgendaMinuteNoteApi>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/agenda_minute_notes/`, data)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async updateAgendaMinuteNote(meetingId: string, noteId: string, data: {
    title?: string
    notes?: string
    host_notes?: string
    status?: string
    start_time?: string
    end_time?: string
  }): Promise<ApiResponse<AgendaMinuteNoteApi>> {
    const response = await api.patch<AgendaMinuteNoteApi>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/agenda_minute_notes/${noteId}/`, data)
    return {
      status: response.status,
      data: response.data,
    }
  },

  async saveAllAgendaMinuteNotes(meetingId: string, notes: Array<{
    agenda_item_id: string
    notes?: string
    host_notes?: string
    status?: string
    start_time?: string
    end_time?: string
  }>): Promise<ApiResponse<BulkAgendaMinuteNotesResponse>> {
    const response = await api.post<BulkAgendaMinuteNotesResponse>(
      `${API_ENDPOINTS.USER_MEETINGS}${meetingId}/agenda_minute_notes/bulk_save/`,
      { notes }
    )
    return {
      status: response.status,
      data: response.data,
    }
  },

  // Additional Notes API
  async getAdditionalNotes(meetingId: string): Promise<ApiResponse<AdditionalNoteDto[]>> {
    const response = await api.get<AdditionalNoteApi[]>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/additional_notes/`)
    return {
      status: response.status,
      data: response.data.map(mapAdditionalNote),
    }
  },

  async createAdditionalNote(meetingId: string, data: {
    title: string
    notes: string
    host_notes?: string
  }): Promise<ApiResponse<AdditionalNoteDto>> {
    const response = await api.post<AdditionalNoteApi>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/additional_notes/`, data)
    return {
      status: response.status,
      data: mapAdditionalNote(response.data),
    }
  },

  async updateAdditionalNote(meetingId: string, noteId: string, data: {
    title?: string
    notes?: string
    host_notes?: string
  }): Promise<ApiResponse<AdditionalNoteDto>> {
    const response = await api.patch<AdditionalNoteApi>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/additional_notes/${noteId}/`, data)
    return {
      status: response.status,
      data: mapAdditionalNote(response.data),
    }
  },

  async deleteAdditionalNote(meetingId: string, noteId: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/additional_notes/${noteId}/`)
    return {
      status: response.status,
      data: null,
    }
  },

  async recalculateAttendance(meetingId: string): Promise<ApiResponse<{ detail: string }>> {
    const response = await api.post<{ detail: string }>(`${API_ENDPOINTS.USER_MEETINGS}${meetingId}/recalculate-attendance/`)
    return {
      status: response.status,
      data: response.data,
    }
  },
}
