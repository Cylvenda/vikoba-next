"use client"

import { useEffect, useEffectEvent } from "react"

type UseMeetingLiveSyncOptions = {
  meetingId?: string
  status?: string
  refreshMeeting: (meetingId: string, options?: { silent?: boolean }) => Promise<void>
  refreshAttendance: (meetingId: string, options?: { silent?: boolean }) => Promise<void>
  refreshParticipants: (meetingId: string, options?: { silent?: boolean }) => Promise<void>
}

export function useMeetingLiveSync({
  meetingId,
  status,
  refreshMeeting,
  refreshAttendance,
  refreshParticipants,
}: UseMeetingLiveSyncOptions) {
  const syncLiveState = useEffectEvent(async () => {
    if (!meetingId || document.visibilityState !== "visible") {
      return
    }

    await Promise.all([
      refreshMeeting(meetingId, { silent: true }),
      refreshAttendance(meetingId, { silent: true }),
      refreshParticipants(meetingId, { silent: true }),
    ])
  })

  const syncPresenceState = useEffectEvent(async () => {
    if (!meetingId || document.visibilityState !== "visible") {
      return
    }

    await Promise.all([
      refreshAttendance(meetingId, { silent: true }),
      refreshParticipants(meetingId, { silent: true }),
    ])
  })

  useEffect(() => {
    if (!meetingId || status !== "ongoing") {
      return
    }

    void syncPresenceState()

    const intervalId = window.setInterval(() => {
      void syncLiveState()
    }, 10000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncLiveState()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [meetingId, status])
}
