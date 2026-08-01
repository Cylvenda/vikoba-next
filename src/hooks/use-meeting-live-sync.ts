"use client"

import { useEffect, useEffectEvent } from "react"

type UseMeetingLiveSyncOptions = {
  meetingId?: string
  status?: string
  refreshMeetingState: (meetingId: string, options?: { silent?: boolean }) => Promise<void>
}

export function useMeetingLiveSync({
  meetingId,
  status,
  refreshMeetingState,
}: UseMeetingLiveSyncOptions) {
  const syncLiveState = useEffectEvent(async () => {
    if (!meetingId || document.visibilityState !== "visible") {
      return
    }

    await refreshMeetingState(meetingId, { silent: true })
  })

  useEffect(() => {
    if (!meetingId || status !== "ongoing") {
      return
    }

    const intervalId = window.setInterval(() => {
      void syncLiveState()
    }, 20000)

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
