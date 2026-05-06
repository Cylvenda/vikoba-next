"use client"

import type { ReactNode } from "react"
import { useMemo, useRef, useState } from "react"
import {
  LiveKitRoom,
  PreJoin,
  type LocalUserChoices,
} from "@livekit/components-react"
import type { RealtimeConnection } from "@/store/meeting/meeting.types"
import { Button } from "@/components/ui/button"
import { MeetingRoom } from "@/components/meeting-room/MeetingRoom"
import type { AgendaItem, AttendanceRecord, ParticipantSession } from "@/store/meeting/meeting.types"

type MeetingRealtimePanelProps = {
  meetingId?: string
  meetingTitle?: string
  meetingStatus?: string
  fullscreen?: boolean
  connection: RealtimeConnection | null
  userEmail?: string
  userId?: string
  userName?: string
  hostIdentity?: string
  hostEmail?: string
  agendaItems?: AgendaItem[]
  minutesContent?: string | null
  attendance?: AttendanceRecord[]
  participants?: ParticipantSession[]
  loading?: boolean
  headerActions?: ReactNode
  onRequestToken: () => Promise<boolean> | boolean
  onLeaveRequested?: () => Promise<void> | void
  onDisconnected?: () => Promise<void> | void
  onConnected?: () => Promise<void> | void
  onError?: (message: string) => void
  onResetConnection?: () => void
}

export function MeetingRealtimePanel({
  meetingId,
  meetingTitle,
  meetingStatus,
  fullscreen = false,
  connection,
  userEmail,
  userId,
  userName,
  hostIdentity,
  hostEmail,
  agendaItems = [],
  minutesContent,
  attendance = [],
  participants = [],
  loading = false,
  headerActions,
  onRequestToken,
  onLeaveRequested,
  onDisconnected,
  onConnected,
  onError,
  onResetConnection,
}: MeetingRealtimePanelProps) {
  const [userChoices, setUserChoices] = useState<LocalUserChoices>({
    username: userEmail || "",
    audioEnabled: true,
    videoEnabled: true,
    audioDeviceId: "default",
    videoDeviceId: "default",
  })
  const [roomPhase, setRoomPhase] = useState<"setup" | "connecting" | "connected" | "reconnecting" | "failed">("setup")
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null)
  const tokenRequestInFlightRef = useRef(false)

  const liveKitUrl = connection?.url || process.env.NEXT_PUBLIC_LIVEKIT_URL
  const canConnect = Boolean(connection?.token && liveKitUrl)
  const preJoinDefaults = useMemo(
    () =>
      userEmail && userChoices.username !== userEmail
        ? {
          ...userChoices,
          username: userEmail,
        }
        : userChoices,
    [userChoices, userEmail]
  )

  const audio = useMemo(
    () =>
      userChoices.audioEnabled
        ? {
          deviceId: userChoices.audioDeviceId === "default" ? undefined : userChoices.audioDeviceId,
        }
        : false,
    [userChoices.audioDeviceId, userChoices.audioEnabled]
  )

  const video = useMemo(
    () =>
      userChoices.videoEnabled
        ? {
          deviceId: userChoices.videoDeviceId === "default" ? undefined : userChoices.videoDeviceId,
        }
        : false,
    [userChoices.videoDeviceId, userChoices.videoEnabled]
  )

  const roomKey = connection?.token && liveKitUrl ? `${liveKitUrl}:${connection.room}:${connection.token}` : "no-room"

  const requestToken = async (phase: "connecting" | "reconnecting", message: string) => {
    if (tokenRequestInFlightRef.current) {
      return
    }

    tokenRequestInFlightRef.current = true
    setConnectionMessage(message)
    setRoomPhase(phase)
    onResetConnection?.()

    try {
      const success = await onRequestToken()

      if (!success) {
        setRoomPhase("failed")
        setConnectionMessage("We could not get a valid meeting token. Review your setup and try again.")
      }
    } finally {
      tokenRequestInFlightRef.current = false
    }
  }

  const handleReconnect = () => {
    void requestToken(
      "reconnecting",
      "Requesting a fresh token and reconnecting to the room..."
    )
  }

  const handleBackToSetup = () => {
    setConnectionMessage(null)
    setRoomPhase("setup")
    onResetConnection?.()
  }

  if (meetingStatus !== "ongoing") {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-dashed border-gray-200 bg-white text-center text-sm text-gray-500 shadow-sm">
        Start the meeting to open the Live room.
      </div>
    )
  }

  if ((roomPhase === "connecting" || roomPhase === "reconnecting") && !canConnect) {
    return (
      <div className={fullscreen ? "flex h-full min-h-full items-center justify-center bg-white p-6" : "rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm"}>
        <div className={fullscreen ? "w-full max-w-3xl rounded-[28px] border border-gray-100 bg-accent px-6 py-10 text-center shadow-sm" : "rounded-[28px] border border-gray-100 bg-accent px-6 py-10 text-center"}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">LiveKit</p>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900">
            {roomPhase === "reconnecting" ? "Reconnecting to meeting room" : "Connecting to meeting room"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
            {connectionMessage || "Preparing your secure room connection and validating your selected media devices."}
          </p>
        </div>
      </div>
    )
  }

  if (!canConnect || roomPhase === "setup") {
    return (
      <div className={fullscreen ? "flex h-full min-h-full items-center justify-center bg-accent p-6 text-black dark:text-white" : "rounded-md border border-gray-200 bg-accent p-3 shadow-sm text-black dark:text-white "}>
        <div className={fullscreen ? "w-full max-w-6xl rounded-md border border-gray-100 bg-accent p-4 shadow-sm" : "rounded-[28px] border border-gray-100 bg-accent"}>
          {roomPhase === "failed" && connectionMessage ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
              {connectionMessage}
            </div>
          ) : null}

          <div className="mb-4 rounded-md border border-gray-200 bg-accent px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] ">Device Check</p>
            <h2 className="mt-2 text-2xl font-semibold ">Prepare your camera and microphone</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 ">
              Review your devices, confirm how you want to appear in the room, and then join the live meeting with a secure token.
            </p>
          </div>

          <PreJoin
            key={userEmail || "meeting-prejoin"}
            className="lk-prejoin-modern rounded-md"
            defaults={preJoinDefaults}
            joinLabel={loading ? "Joining..." : "Join Live Meeting"}
            userLabel="Email"
            persistUserChoices
            onValidate={(values) => !loading && Boolean(values.username)}
            onError={(error) => {
              setRoomPhase("setup")
              onError?.(error.message || "Unable to access your local media devices.")
            }}
            onSubmit={async (values) => {
              setUserChoices({
                ...values,
                username: userEmail || values.username,
              })

              await requestToken(
                "connecting",
                "Requesting a secure access token for the Live Room..."
              )
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={fullscreen ? "relative h-full w-full overflow-hidden bg-white" : "relative overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm"}
      data-lk-theme="default"
    >
      <LiveKitRoom
        key={roomKey}
        audio={audio}
        video={video}
        connect
        token={connection?.token}
        serverUrl={liveKitUrl}
        className={fullscreen ? "h-full w-full" : "h-full w-full"}
        onConnected={() => {
          setConnectionMessage(null)
          setRoomPhase("connected")
          void onConnected?.()
        }}
        onDisconnected={() => {
          setConnectionMessage("The room connection was interrupted.")
          setRoomPhase("failed")
          onResetConnection?.()
          void onDisconnected?.()
        }}
        onError={(error) => {
          setConnectionMessage(error.message || "Live Room failed to connect.")
          setRoomPhase("failed")
          onResetConnection?.()
          onError?.(error.message || "Live Room failed to connect.")
        }}
      >
        <MeetingRoom
          meetingId={meetingId}
          meetingTitle={meetingTitle || "Meeting room"}
          agendaItems={agendaItems}
          minutesContent={minutesContent}
          attendanceRecords={attendance}
          participantSessions={participants}
          hostIdentity={hostIdentity}
          hostEmail={hostEmail}
          currentUserId={userId}
          currentUserName={userName}
          headerActions={headerActions}
          onLeaveRequested={async () => {
            await onLeaveRequested?.()
          }}
        />
      </LiveKitRoom>

      {roomPhase === "connecting" || roomPhase === "reconnecting" ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/82 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 text-center text-slate-100 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Live Room</p>
            <h3 className="mt-3 text-2xl font-semibold">
              {roomPhase === "reconnecting" ? "Reconnecting to the meeting" : "Connecting to the meeting"}
            </h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
              {connectionMessage || "Preparing your secure room connection and publishing your selected media devices."}
            </p>
          </div>
        </div>
      ) : null}

      {roomPhase === "failed" ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/82 backdrop-blur-sm">
          <div className="max-w-lg rounded-2xl border border-white/10 bg-slate-900/92 p-6 text-center  shadow-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Connection Issue</p>
            <h3 className="mt-3 text-2xl font-semibold">The meeting room needs to reconnect</h3>
            <p className="mt-3 text-sm leading-6 ">
              {connectionMessage || "The Live Room room disconnected unexpectedly."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={handleReconnect} disabled={loading}>
                Reconnect
              </Button>
              <Button variant="outline" onClick={handleBackToSetup}>
                Back To Device Check
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .lk-prejoin-modern .lk-username-container input {
          display: none;
        }
      `}</style>
    </div>
  )
}
