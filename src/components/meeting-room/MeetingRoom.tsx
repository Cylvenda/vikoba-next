"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import {
  RoomAudioRenderer,
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react"
import { PanelLeftClose, PanelRightClose, X } from "lucide-react"
import { toast } from "react-toastify"
import type { AgendaItem, AttendanceRecord, ParticipantSession } from "@/store/meeting/meeting.types"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { AgendaPanel } from "@/components/meeting-room/AgendaPanel"
import { AttendancePanel } from "@/components/meeting-room/AttendancePanel"
import { ChatPanel } from "@/components/meeting-room/ChatPanel"
import { ControlBar } from "@/components/meeting-room/ControlBar"
import { MinuteSectionsPanel } from "@/components/meeting/MinuteSectionsPanel"
import { AgendaMinutesPanel } from "@/components/meeting-room/AgendaMinutesPanel"
import { TopBar } from "@/components/meeting-room/TopBar"
import { VideoGrid } from "@/components/meeting-room/VideoGrid"
import { Button } from "@/components/ui/button"
import type {
  MeetingAgendaItem,
  MeetingAttendanceItem,
  MeetingChatMessage,
  MeetingParticipantSignalState,
  MeetingSidebarTab,
} from "@/components/meeting-room/types"

type MeetingRoomProps = {
  meetingId?: string
  meetingTitle: string
  agendaItems: AgendaItem[]
  attendanceRecords: AttendanceRecord[]
  participantSessions: ParticipantSession[]
  hostIdentity?: string
  hostEmail?: string
  currentUserId?: string
  currentUserName?: string
  minutesContent?: string | null
  headerActions?: ReactNode
  onLeaveRequested: () => Promise<void> | void
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

type MeetingSignalPayload =
  | {
      type: "hand"
      senderId: string
      raisedHand: boolean
      createdAt: string
    }
  | {
      type: "reaction"
      senderId: string
      emoji: string
      createdAt: string
    }

function getAgendaStatus(index: number, total: number, selectedId: string | null | undefined, agendaId: string) {
  if (agendaId === selectedId) return "Ongoing"
  if (selectedId) return "Pending"
  if (index === 0) return "Ongoing"
  if (index === total - 1 && total > 2) return "Pending"
  return "Pending"
}

function getParticipantName(identity: string, liveName?: string, fallbackEmail?: string) {
  return liveName || fallbackEmail || identity
}

function getLatestJoinedAt(sessions: ParticipantSession[]) {
  if (sessions.length === 0) {
    return null
  }

  return [...sessions]
    .sort((left, right) => new Date(right.joined_at).getTime() - new Date(left.joined_at).getTime())[0]
    ?.joined_at ?? null
}

function PanelFrame({
  side,
  title,
  description,
  onClose,
  children,
}: {
  side: "left" | "right"
  title: string
  description: string
  onClose: () => void
  children: ReactNode
}) {
  const CloseIcon = side === "left" ? PanelLeftClose : PanelRightClose

  return (
    <aside className="flex h-[22rem] w-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm md:h-[26rem] lg:h-full lg:w-[22rem] xl:w-[24rem]">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-foreground">
            <CloseIcon className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-2xl" onClick={onClose}>
          <X className="size-4" />
          <span className="sr-only">Close panel</span>
        </Button>
      </div>

      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  )
}

export function MeetingRoom({
  meetingId,
  meetingTitle,
  agendaItems,
  attendanceRecords,
  participantSessions,
  hostIdentity,
  hostEmail,
  currentUserId,
  currentUserName,
  minutesContent,
  headerActions,
  onLeaveRequested,
}: MeetingRoomProps) {
  const connectionState = useConnectionState()
  const room = useRoomContext()
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const { saveMinutes } = useMeetingStore()
  const [isSavingMinutes, startSavingMinutes] = useTransition()
  const [leftPanel, setLeftPanel] = useState<Extract<MeetingSidebarTab, "agenda" | "minutes"> | null>(null)
  const [rightPanel, setRightPanel] = useState<Extract<MeetingSidebarTab, "chat" | "attendance"> | null>(null)
  const [participantSignals, setParticipantSignals] = useState<Record<string, MeetingParticipantSignalState>>({})
  const [currentUtcIso, setCurrentUtcIso] = useState("")
  const [selectedAgendaItemId, setSelectedAgendaItemId] = useState<string | null>(null)
  const reactionTimeoutsRef = useRef<Record<string, number>>({})
  const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([
    {
      id: "meeting-room-system-welcome",
      senderId: "system",
      senderName: "System",
      text: "Welcome to the meeting room. Chat is active locally and ready for realtime delivery.",
      createdAt: new Date().toISOString(),
      kind: "system",
    },
  ])

  const isHost = Boolean(currentUserId && hostIdentity && currentUserId === hostIdentity)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCurrentUtcIso(new Date().toISOString())
    })

    const timer = window.setInterval(() => {
      setCurrentUtcIso(new Date().toISOString())
    }, 1000 * 30)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(timer)
    }
  }, [])

  useDataChannel("chat", (message) => {
    try {
      const decoded = JSON.parse(new TextDecoder().decode(message.payload)) as {
        id?: string
        senderId?: string
        senderName?: string
        text?: string
        createdAt?: string
      }

      if (!decoded.text || !decoded.senderId) return

      setChatMessages((current) => {
        if (current.some((item) => item.id === decoded.id)) {
          return current
        }

        const senderId = decoded.senderId
        const text = decoded.text

        if (!senderId || !text) {
          return current
        }

        return [
          ...current,
          {
            id: decoded.id || createMessageId(),
            senderId,
            senderName: decoded.senderName || "Participant",
            text,
            createdAt: decoded.createdAt || new Date().toISOString(),
          },
        ]
      })
    } catch {
      return
    }
  })

  const { send } = useDataChannel("chat")
  useDataChannel("meeting-signals", (message) => {
    try {
      const decoded = JSON.parse(new TextDecoder().decode(message.payload)) as MeetingSignalPayload
      if (!decoded.senderId) return

      if (decoded.type === "hand") {
        setParticipantSignals((current) => ({
          ...current,
          [decoded.senderId]: {
            ...(current[decoded.senderId] || { raisedHand: false }),
            raisedHand: decoded.raisedHand,
          },
        }))
        return
      }

      if (decoded.type === "reaction" && decoded.emoji) {
        setParticipantSignals((current) => ({
          ...current,
          [decoded.senderId]: {
            ...(current[decoded.senderId] || { raisedHand: false }),
            reactionEmoji: decoded.emoji,
            reactionAt: decoded.createdAt,
          },
        }))

        const existingTimeout = reactionTimeoutsRef.current[decoded.senderId]
        if (existingTimeout) {
          window.clearTimeout(existingTimeout)
        }

        reactionTimeoutsRef.current[decoded.senderId] = window.setTimeout(() => {
          setParticipantSignals((current) => {
            const participantSignal = current[decoded.senderId]
            if (!participantSignal) return current

            return {
              ...current,
              [decoded.senderId]: {
                ...participantSignal,
                reactionEmoji: null,
                reactionAt: null,
              },
            }
          })
          delete reactionTimeoutsRef.current[decoded.senderId]
        }, 4000)
      }
    } catch {
      return
    }
  })
  const { send: sendMeetingSignal } = useDataChannel("meeting-signals")
  const textEncoder = useMemo(() => new TextEncoder(), [])

  const chatSenderId = currentUserId || localParticipant.identity
  const chatSenderName =
    currentUserName ||
    localParticipant.name ||
    localParticipant.attributes?.email ||
    localParticipant.identity
  const raisedHand = participantSignals[chatSenderId]?.raisedHand ?? false

  useEffect(() => {
    const reactionTimeouts = reactionTimeoutsRef.current

    return () => {
      Object.values(reactionTimeouts).forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
    }
  }, [])

  const normalizedAgendaItems = useMemo<MeetingAgendaItem[]>(
    () =>
      agendaItems.map((item, index) => ({
        id: item.id,
        title: item.title,
        description: item.description || null,
        order: item.order,
        allocatedMinutes: item.allocated_minutes,
        status: getAgendaStatus(index, agendaItems.length, selectedAgendaItemId ?? agendaItems[0]?.id ?? null, item.id),
      })),
    [agendaItems, selectedAgendaItemId]
  )

  const activeAgendaItemId = selectedAgendaItemId ?? agendaItems[0]?.id ?? null

  const attendanceItems = useMemo<MeetingAttendanceItem[]>(() => {
    const liveParticipants = new Map(
      participants.map((participant) => [
        participant.identity,
        {
          name: participant.name,
          email: participant.attributes?.email,
        },
      ])
    )

    const items = new Map<string, MeetingAttendanceItem>()
    const sessionsByUser = new Map<string, ParticipantSession[]>()

    participantSessions.forEach((session) => {
      const existing = sessionsByUser.get(session.user) || []
      existing.push(session)
      sessionsByUser.set(session.user, existing)
    })

    attendanceRecords.forEach((record) => {
      const liveParticipant = liveParticipants.get(record.user)
      const email = liveParticipant?.email || record.user_email
      const userSessions = sessionsByUser.get(record.user) || []
      items.set(record.user, {
        id: record.user,
        name: getParticipantName(record.user, liveParticipant?.name, record.user_name || email),
        email,
        joinedAt: getLatestJoinedAt(userSessions) || record.first_joined_at,
        lastLeftAt: record.last_left_at,
        totalDurationMinutes: record.total_duration_minutes,
        joinCount: userSessions.length,
        status: liveParticipants.has(record.user) ? "online" : "offline",
        badge: record.user === hostIdentity || email === hostEmail ? "Host" : "Member",
        isCurrentUser: record.user === currentUserId,
        sessions: userSessions.map((session) => ({
          id: session.id,
          joinedAt: session.joined_at,
          leftAt: session.left_at,
        })),
      })
    })

    sessionsByUser.forEach((userSessions, userId) => {
      const firstSession = userSessions[0]
      if (!firstSession) return

      const liveParticipant = liveParticipants.get(userId)
      const existing = items.get(userId)
      const email = liveParticipant?.email || firstSession.user_email
      const userName = firstSession.user_name || email

      items.set(userId, {
        id: userId,
        name: existing?.name || getParticipantName(userId, liveParticipant?.name, userName),
        email,
        joinedAt: existing?.joinedAt || getLatestJoinedAt(userSessions),
        lastLeftAt:
          existing?.lastLeftAt ||
          userSessions
            .filter((session) => session.left_at)
            .sort((left, right) => new Date(right.left_at as string).getTime() - new Date(left.left_at as string).getTime())[0]
            ?.left_at ||
          null,
        totalDurationMinutes: existing?.totalDurationMinutes || 0,
        joinCount: existing?.joinCount || userSessions.length,
        status: liveParticipants.has(userId) ? "online" : "offline",
        badge: userId === hostIdentity || email === hostEmail ? "Host" : "Member",
        isCurrentUser: userId === currentUserId,
        sessions: existing?.sessions || userSessions.map((session) => ({
          id: session.id,
          joinedAt: session.joined_at,
          leftAt: session.left_at,
        })),
      })
    })

    participants.forEach((participant) => {
      if (items.has(participant.identity)) return

      const email = participant.attributes?.email || participant.identity
      items.set(participant.identity, {
        id: participant.identity,
        name: getParticipantName(participant.identity, participant.name, email),
        email,
        joinedAt: null,
        lastLeftAt: null,
        totalDurationMinutes: 0,
        joinCount: 0,
        status: "online",
        badge: participant.identity === hostIdentity || email === hostEmail ? "Host" : "Member",
        isCurrentUser: participant.identity === currentUserId,
        sessions: [],
      })
    })

    return [...items.values()].sort((left, right) => {
      if (left.badge !== right.badge) return left.badge === "Host" ? -1 : 1
      if (left.status !== right.status) return left.status === "online" ? -1 : 1
      return left.name.localeCompare(right.name)
    })
  }, [attendanceRecords, currentUserId, hostEmail, hostIdentity, participantSessions, participants])

  const handleSendMessage = async (text: string) => {
    const nextMessage: MeetingChatMessage = {
      id: createMessageId(),
      senderId: chatSenderId,
      senderName: chatSenderName,
      text,
      createdAt: new Date().toISOString(),
    }

    setChatMessages((current) => [...current, nextMessage])

    try {
      await send(
        textEncoder.encode(
          JSON.stringify({
            id: nextMessage.id,
            senderId: nextMessage.senderId,
            senderName: nextMessage.senderName,
            text: nextMessage.text,
            createdAt: nextMessage.createdAt,
          })
        ),
        {
          topic: "chat",
          reliable: true,
        }
      )
    } catch {
      setChatMessages((current) => [
        ...current,
        {
          id: `${nextMessage.id}-failed`,
          senderId: "system",
          senderName: "System",
          text: "Your message was saved locally but could not be delivered to the room.",
          createdAt: new Date().toISOString(),
          kind: "system",
        },
      ])
    }
  }

  const handleSaveMinutes = async (content: string) => {
    if (!meetingId || !isHost) {
      return
    }

    startSavingMinutes(() => {
      void (async () => {
        const result = await saveMinutes(meetingId, { content })
        if (result.success) {
          toast.success(result.message)
          return
        }

        toast.error(result.message)
      })()
    })
  }

  const handleLeave = async () => {
    room.disconnect()
    await onLeaveRequested()
  }

  const handleToggleRaisedHand = () => {
    const nextRaisedHand = !raisedHand

    setParticipantSignals((current) => ({
      ...current,
      [chatSenderId]: {
        ...(current[chatSenderId] || { raisedHand: false }),
        raisedHand: nextRaisedHand,
      },
    }))

    void sendMeetingSignal(
      textEncoder.encode(
        JSON.stringify({
          type: "hand",
          senderId: chatSenderId,
          raisedHand: nextRaisedHand,
          createdAt: new Date().toISOString(),
        } satisfies MeetingSignalPayload)
      ),
      {
        topic: "meeting-signals",
        reliable: true,
      }
    ).catch(() => {
      toast.error("Failed to share your hand raise with the room.")
    })
  }

  const handleSendReaction = (emoji: string) => {
    const createdAt = new Date().toISOString()

    setParticipantSignals((current) => ({
      ...current,
      [chatSenderId]: {
        ...(current[chatSenderId] || { raisedHand: false }),
        reactionEmoji: emoji,
        reactionAt: createdAt,
      },
    }))

    const existingTimeout = reactionTimeoutsRef.current[chatSenderId]
    if (existingTimeout) {
      window.clearTimeout(existingTimeout)
    }

    reactionTimeoutsRef.current[chatSenderId] = window.setTimeout(() => {
      setParticipantSignals((current) => {
        const participantSignal = current[chatSenderId]
        if (!participantSignal) return current

        return {
          ...current,
          [chatSenderId]: {
            ...participantSignal,
            reactionEmoji: null,
            reactionAt: null,
          },
        }
      })
      delete reactionTimeoutsRef.current[chatSenderId]
    }, 4000)

    void sendMeetingSignal(
      textEncoder.encode(
        JSON.stringify({
          type: "reaction",
          senderId: chatSenderId,
          emoji,
          createdAt,
        } satisfies MeetingSignalPayload)
      ),
      {
        topic: "meeting-signals",
        reliable: true,
      }
    ).catch(() => {
      toast.error("Failed to share your reaction with the room.")
    })

    toast.success(`${emoji} Reaction sent`, {
      autoClose: 1500,
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <TopBar
        title={meetingTitle}
        connectionLabel={connectionState}
        currentUtcIso={currentUtcIso}
        actions={headerActions}
        onLeave={() => void handleLeave()}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden px-4 pb-2 pt-4 sm:pb-3 sm:pt-3 lg:flex-row lg:pt-4">
        {leftPanel ? (
          <PanelFrame
            side="left"
            title={leftPanel === "minutes" ? "Meeting Minutes" : "Agenda"}
            description={
              leftPanel === "minutes"
                ? "Host can manage minute sections, mark sections as done, and add notes during the meeting."
                : "Follow the current discussion without leaving the live room."
            }
            onClose={() => setLeftPanel(null)}
          >
            {leftPanel === "agenda" ? (
              <AgendaPanel
                items={normalizedAgendaItems}
                selectedItemId={activeAgendaItemId}
                onSelectItem={setSelectedAgendaItemId}
              />
            ) : (
              <AgendaMinutesPanel
                meetingId={meetingId!}
                agendaItems={agendaItems}
                isHost={isHost}
                onAgendaItemSelect={setSelectedAgendaItemId}
                selectedAgendaItemId={activeAgendaItemId}
              />
            )}
          </PanelFrame>
        ) : null}

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <VideoGrid
            hostIdentity={hostIdentity}
            currentUserIdentity={currentUserId || localParticipant.identity}
            participantSignals={participantSignals}
          />
        </div>

        {rightPanel ? (
          <PanelFrame
            side="right"
            title={rightPanel === "attendance" ? "Attendance" : "Meeting chat"}
            description={
              rightPanel === "attendance"
                ? "Track who is present without covering the meeting stage."
                : "Chat while everyone stays visible on screen."
            }
            onClose={() => setRightPanel(null)}
          >
            {rightPanel === "chat" ? (
              <ChatPanel
                messages={chatMessages}
                currentUserId={chatSenderId}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <AttendancePanel items={attendanceItems} />
            )}
          </PanelFrame>
        ) : null}
      </div>

      <ControlBar
        raisedHand={raisedHand}
        canAccessMinutes={isHost}
        activeDocumentsPanel={leftPanel}
        activePeoplePanel={rightPanel}
        onToggleRaisedHand={handleToggleRaisedHand}
        onSendReaction={handleSendReaction}
        onLeave={() => void handleLeave()}
        onOpenDocumentsPanel={(tab) => {
          if (tab === "minutes" && !isHost) {
            return
          }

          setLeftPanel((current) => (current === tab ? null : tab))
        }}
        onOpenPeoplePanel={(tab) => {
          setRightPanel((current) => (current === tab ? null : tab))
        }}
      />

      <RoomAudioRenderer />
    </div>
  )
}
