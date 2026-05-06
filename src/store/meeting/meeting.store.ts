import { create } from "zustand"
import { meetingServices } from "@/api/services/meeting.service"
import type {
  AgendaItem,
  AttendanceRecord,
  Meeting,
  MeetingMinutes,
  ParticipantSession,
  RealtimeConnection,
} from "./meeting.types"

const sortMeetingsNewestFirst = (meetings: Meeting[]) =>
  [...meetings].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  )

type MeetingState = {
  meetings: Meeting[]
  selectedMeeting: Meeting | null
  attendance: AttendanceRecord[]
  participants: ParticipantSession[]
  currentMinutes: MeetingMinutes | null
  realtimeConnection: RealtimeConnection | null
  loading: boolean
  error: string | null
  fetchMeetings: () => Promise<void>
  fetchMeetingById: (meetingId: string, options?: { silent?: boolean }) => Promise<void>
  fetchAttendance: (meetingId: string, options?: { silent?: boolean }) => Promise<void>
  fetchParticipants: (meetingId: string, options?: { silent?: boolean }) => Promise<void>
  createMeeting: (payload: {
    title: string
    description?: string
    group: string
    scheduled_start: string
    scheduled_end?: string
  }) => Promise<{ success: boolean; message: string }>
  createInstantMeeting: (payload: {
    title?: string
    description?: string
    group: string
  }) => Promise<{ success: boolean; message: string; meeting?: Meeting }>
  startMeeting: (meetingId: string) => Promise<{ success: boolean; message: string }>
  endMeeting: (meetingId: string) => Promise<{ success: boolean; message: string }>
  joinMeeting: (meetingId: string) => Promise<{ success: boolean; message: string; connection?: RealtimeConnection }>
  leaveMeeting: (meetingId: string) => Promise<{ success: boolean; message: string }>
  resetRealtimeConnection: () => void
  saveMinutes: (meetingId: string, payload: { content: string; approved?: boolean }) => Promise<{ success: boolean; message: string }>
  addAgendaItem: (payload: {
    meeting: string
    title: string
    description?: string
    order: number
    allocated_minutes?: number
  }) => Promise<{ success: boolean; message: string }>
  removeAgendaItem: (agendaItemId: string) => Promise<{ success: boolean; message: string }>
}

export const useMeetingStore = create<MeetingState>((set) => ({
  meetings: [],
  selectedMeeting: null,
  attendance: [],
  participants: [],
  currentMinutes: null,
  realtimeConnection: null,
  loading: false,
  error: null,

  fetchMeetings: async () => {
    set({ loading: true, error: null })

    try {
      const res = await meetingServices.getMeetings()
      set({
        meetings: sortMeetingsNewestFirst(res.data),
        loading: false,
      })
    } catch (err: unknown) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch meetings",
      })
    }
  },

  fetchMeetingById: async (meetingId, options) => {
    if (!options?.silent) {
      set({ loading: true, error: null })
    }
    try {
      const res = await meetingServices.getMeetingById(meetingId)
      set((state) => ({
        selectedMeeting: res.data,
        currentMinutes: res.data.minutes || null,
        loading: options?.silent ? state.loading : false,
      }))
    } catch (err: unknown) {
      set((state) => ({
        loading: options?.silent ? state.loading : false,
        error: err instanceof Error ? err.message : "Failed to fetch meeting",
      }))
    }
  },

  fetchAttendance: async (meetingId, options) => {
    if (!options?.silent) {
      set({ loading: true, error: null })
    }
    try {
      const res = await meetingServices.getAttendance(meetingId)
      set((state) => ({
        attendance: res.data,
        loading: options?.silent ? state.loading : false,
      }))
    } catch (err: unknown) {
      set((state) => ({
        loading: options?.silent ? state.loading : false,
        error: err instanceof Error ? err.message : "Failed to fetch attendance",
      }))
    }
  },

  fetchParticipants: async (meetingId, options) => {
    if (!options?.silent) {
      set({ loading: true, error: null })
    }
    try {
      const res = await meetingServices.getParticipants(meetingId)
      set((state) => ({
        participants: res.data,
        loading: options?.silent ? state.loading : false,
      }))
    } catch (err: unknown) {
      set((state) => ({
        loading: options?.silent ? state.loading : false,
        error: err instanceof Error ? err.message : "Failed to fetch participants",
      }))
    }
  },

  createMeeting: async (payload) => {
    set({ loading: true, error: null })
    try {
      const res = await meetingServices.createMeeting(payload)
      set((state) => ({
        meetings: sortMeetingsNewestFirst([res.data, ...state.meetings]),
        loading: false,
      }))
      return { success: true, message: "Meeting scheduled successfully." }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to schedule meeting"
      set({ loading: false, error: message })
      return { success: false, message }
    }
  },

  createInstantMeeting: async (payload) => {
    set({ loading: true, error: null })
    try {
      const res = await meetingServices.createInstantMeeting(payload)
      set((state) => ({
        meetings: sortMeetingsNewestFirst([res.data, ...state.meetings]),
        selectedMeeting: res.data,
        loading: false,
      }))
      return { success: true, message: "Instant meeting started successfully.", meeting: res.data }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start instant meeting"
      set({ loading: false, error: message })
      return { success: false, message }
    }
  },

  startMeeting: async (meetingId) => {
    set({ loading: true, error: null })
    try {
      await meetingServices.startMeeting(meetingId)
      const res = await meetingServices.getMeetingById(meetingId)
      set((state) => ({
        selectedMeeting: res.data,
        meetings: sortMeetingsNewestFirst(
          state.meetings.map((meeting) => (meeting.id === res.data.id ? res.data : meeting))
        ),
        loading: false,
      }))
      return { success: true, message: "Meeting started successfully." }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start meeting"
      set({ loading: false, error: message })
      return { success: false, message }
    }
  },

  endMeeting: async (meetingId) => {
    set({ loading: true, error: null })
    try {
      await meetingServices.endMeeting(meetingId)
      const res = await meetingServices.getMeetingById(meetingId)
      set((state) => ({
        selectedMeeting: res.data,
        meetings: sortMeetingsNewestFirst(
          state.meetings.map((meeting) => (meeting.id === res.data.id ? res.data : meeting))
        ),
        loading: false,
      }))
      return { success: true, message: "Meeting ended successfully." }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to end meeting"
      set({ loading: false, error: message })
      return { success: false, message }
    }
  },

  joinMeeting: async (meetingId) => {
    set({ loading: true, error: null })
    try {
      const connection = await meetingServices.joinMeeting(meetingId)
      const participants = await meetingServices.getParticipants(meetingId).catch(() => null)
      
      // Also silently fetch attendance so the Attendance tab updates to show the user as Present
      const attendance = await meetingServices.getAttendance(meetingId).catch(() => null)

      set((state) => ({
        realtimeConnection: connection.data,
        participants: participants?.data || [],
        attendance: attendance?.data || state.attendance,
        loading: false,
      }))
      return {
        success: true,
        message: "Realtime token issued successfully.",
        connection: connection.data,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join meeting"
      set({ loading: false, error: message })
      return { success: false, message }
    }
  },

  leaveMeeting: async (meetingId) => {
    set({ loading: true, error: null })
    try {
      await meetingServices.leaveMeeting(meetingId)
      set({
        realtimeConnection: null,
        loading: false,
      })
      return { success: true, message: "Leave requested. Presence will finish updating after the LiveKit disconnect completes." }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to leave meeting"
      set({ loading: false, error: message })
      return { success: false, message }
    }
  },

  resetRealtimeConnection: () => {
    set({
      realtimeConnection: null,
    })
  },

  saveMinutes: async (meetingId, payload) => {
    set({ loading: true, error: null })
    try {
      const currentMinutes = await meetingServices.getMinutes(meetingId).catch(() => null)
      const response = currentMinutes
        ? await meetingServices.updateMinutes(meetingId, payload)
        : await meetingServices.createMinutes(meetingId, payload)

      set((state) => ({
        currentMinutes: response.data,
        selectedMeeting: state.selectedMeeting
          ? { ...state.selectedMeeting, minutes: response.data }
          : state.selectedMeeting,
        loading: false,
      }))
      return { success: true, message: "Meeting minutes saved successfully." }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save meeting minutes"
      set({ loading: false, error: message })
      return { success: false, message }
    }
  },

  addAgendaItem: async (payload) => {
    set({ loading: true, error: null })
    try {
      const response = await meetingServices.createAgendaItem(payload)
      set((state) => ({
        selectedMeeting: state.selectedMeeting
          ? {
              ...state.selectedMeeting,
              agenda_items: [...(state.selectedMeeting.agenda_items || []), response.data].sort(
                (a: AgendaItem, b: AgendaItem) => a.order - b.order
              ),
            }
          : state.selectedMeeting,
        loading: false,
      }))
      return { success: true, message: "Agenda item added successfully." }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add agenda item"
      set({ loading: false, error: message })
      return { success: false, message }
    }
  },

  removeAgendaItem: async (agendaItemId) => {
    set({ loading: true, error: null })
    try {
      await meetingServices.deleteAgendaItem(agendaItemId)
      set((state) => ({
        selectedMeeting: state.selectedMeeting
          ? {
              ...state.selectedMeeting,
              agenda_items: (state.selectedMeeting.agenda_items || []).filter(
                (item) => item.id !== agendaItemId
              ),
            }
          : state.selectedMeeting,
        loading: false,
      }))
      return { success: true, message: "Agenda item removed successfully." }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove agenda item"
      set({ loading: false, error: message })
      return { success: false, message }
    }
  },
}))
