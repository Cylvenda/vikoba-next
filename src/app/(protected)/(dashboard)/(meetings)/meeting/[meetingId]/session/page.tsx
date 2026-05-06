"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MeetingRealtimePanel } from "@/components/meeting/meeting-realtime-panel"
import { useMeetingLiveSync } from "@/hooks/use-meeting-live-sync"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { toast } from "react-toastify"

export default function MeetingSessionPage() {
  const params = useParams<{ meetingId: string }>()
  const router = useRouter()
  const meetingId = Array.isArray(params?.meetingId) ? params.meetingId[0] : params?.meetingId
  const { user } = useAuthUserStore()
  const {
    selectedMeeting,
    currentMinutes,
    attendance,
    participants,
    realtimeConnection,
    loading,
    fetchMeetingById,
    fetchAttendance,
    fetchParticipants,
    startMeeting,
    endMeeting,
    joinMeeting,
    leaveMeeting,
    resetRealtimeConnection,
  } = useMeetingStore()

  useEffect(() => {
    if (!meetingId) return

    const load = async () => {
      await fetchMeetingById(meetingId)
      await fetchAttendance(meetingId)
      await fetchParticipants(meetingId)
    }

    void load()
  }, [meetingId, fetchMeetingById, fetchAttendance, fetchParticipants])

  useMeetingLiveSync({
    meetingId,
    status: selectedMeeting?.status,
    refreshMeeting: fetchMeetingById,
    refreshAttendance: fetchAttendance,
    refreshParticipants: fetchParticipants,
  })

  const isHost = user?.email === selectedMeeting?.host_email
  const isMeetingOngoing = selectedMeeting?.status === "ongoing"
  const activeParticipants = participants.filter((participant) => participant.left_at === null)
  const isConnectedParticipant = activeParticipants.some((participant) => participant.user_email === user?.email)
  const detailsHref = meetingId ? `/meeting/${meetingId}` : "/dashboard"

  const handleStart = async () => {
    if (!meetingId) return
    const result = await startMeeting(meetingId)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const handleEnd = async () => {
    if (!meetingId) return
    const result = await endMeeting(meetingId)
    if (result.success) {
      toast.success(result.message)
      await fetchAttendance(meetingId)
      await fetchParticipants(meetingId)
      return
    }
    toast.error(result.message)
  }

  const handleJoin = async () => {
    if (!meetingId) return false
    const result = await joinMeeting(meetingId)
    if (result.success) {
      toast.success(result.message)
      return true
    } else {
      toast.error(result.message)
      return false
    }
  }

  const handleLeaveRequested = async () => {
    if (!meetingId) return

    const result = await leaveMeeting(meetingId)
    if (result.success) {
      toast.success("You left the meeting room.")
      router.push(detailsHref)
      return
    }

    toast.error(result.message)
  }

  const handleRoomConnected = async () => {
    if (!meetingId) return
    toast.success("Connected to the Live Room room.")
    await fetchParticipants(meetingId, { silent: true })
  }

  const handleRoomDisconnected = async () => {
    if (!meetingId) return
    await fetchParticipants(meetingId, { silent: true })
    await fetchAttendance(meetingId, { silent: true })
    toast.warning("Disconnected from the Live Room room.")
  }

  const roomHeaderActions = (
    <>
      <Button asChild variant="outline" size="lg" className="rounded-md text-black dark:text-white">
        <Link href={detailsHref}>Meeting details</Link>
      </Button>
      {isHost && isMeetingOngoing ? (
        <Button size="lg" className="rounded-md" onClick={handleEnd} disabled={loading}>
          End Meeting
        </Button>
      ) : null}
    </>
  )

  if (isMeetingOngoing) {
    return (
      <div className="fixed inset-x-0 bottom-0 top-22 z-40 bg-accennt md:top-23">
        <MeetingRealtimePanel
          meetingId={meetingId}
          meetingTitle={selectedMeeting?.title}
          meetingStatus={selectedMeeting?.status}
          fullscreen
          connection={realtimeConnection}
          userEmail={user?.email}
          userId={user?.uuid}
          userName={[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email}
          hostIdentity={selectedMeeting?.host}
          hostEmail={selectedMeeting?.host_email}
          agendaItems={selectedMeeting?.agenda_items || []}
          minutesContent={currentMinutes?.content || selectedMeeting?.minutes?.content || null}
          attendance={attendance}
          participants={participants}
          loading={loading}
          headerActions={roomHeaderActions}
          onRequestToken={handleJoin}
          onLeaveRequested={handleLeaveRequested}
          onConnected={handleRoomConnected}
          onDisconnected={handleRoomDisconnected}
          onError={(message) => {
            toast.error(message)
          }}
          onResetConnection={resetRealtimeConnection}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto space-y-6">
        <div className="space-y-6">
          <Card className="border-none bg-card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Meeting Session</p>
                <h1 className="text-3xl font-bold">{selectedMeeting?.title || "Loading session..."}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Host: {selectedMeeting?.host_email || "Unknown"} • Status: {selectedMeeting?.status || "loading"}
                </p>
                <p className="mt-3 text-sm text-foreground/80">
                  This page is the live call experience for joining, starting, and managing the meeting session.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={detailsHref}>Back to Meeting Details</Link>
                </Button>
                {isHost && selectedMeeting?.status === "scheduled" && (
                  <Button className="bg-chart-3" onClick={handleStart} disabled={loading}>
                    Start Meeting
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-none bg-transparent p-0 shadow-none">
            <div className="mb-6 text-center">
              <h3 className="mt-3 text-2xl font-semibold text-foreground">Check your camera and microphone</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Choose your preferred devices here, then we’ll request a secure access token and connect you to the meeting.
              </p>
            </div>

            <MeetingRealtimePanel
              meetingId={meetingId}
              meetingTitle={selectedMeeting?.title}
              meetingStatus={selectedMeeting?.status}
              connection={realtimeConnection}
              userEmail={user?.email}
              userId={user?.uuid}
              userName={[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email}
              hostIdentity={selectedMeeting?.host}
              hostEmail={selectedMeeting?.host_email}
              agendaItems={selectedMeeting?.agenda_items || []}
              minutesContent={currentMinutes?.content || selectedMeeting?.minutes?.content || null}
              attendance={attendance}
              participants={participants}
              loading={loading}
              headerActions={roomHeaderActions}
              onRequestToken={handleJoin}
              onLeaveRequested={handleLeaveRequested}
              onConnected={handleRoomConnected}
              onDisconnected={handleRoomDisconnected}
              onError={(message) => {
                toast.error(message)
              }}
              onResetConnection={resetRealtimeConnection}
            />
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-none bg-card p-5">
            <h2 className="text-xl font-semibold">Attendance Tracking</h2>
            <p className="mt-1 text-sm text-muted-foreground">Backend attendance records for this live session.</p>

            <div className="mt-4 space-y-3">
              {attendance.length === 0 && (
                <p className="text-sm text-muted-foreground">No attendance has been recorded yet.</p>
              )}
              {attendance.map((record) => (
                <div key={record.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{record.user_email}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {record.status} • Duration: {record.total_duration_minutes} min
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs">
                      {record.is_verified_member ? "verified member" : "guest"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-none bg-card p-5">
            <h2 className="text-xl font-semibold">Participants</h2>
            <p className="mt-1 text-sm text-muted-foreground">Currently active participants reported by the backend webhook flow.</p>

            {isMeetingOngoing && (
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {isConnectedParticipant ? "You are currently reported as connected." : "You are not currently reported as connected."}
              </p>
            )}

            <div className="mt-4 space-y-2">
              {activeParticipants.length === 0 && (
                <p className="text-sm text-muted-foreground">No live participants detected yet.</p>
              )}
              {activeParticipants.map((participant) => (
                <div key={participant.id} className="rounded-xl bg-muted px-3 py-2 text-sm">
                  <p className="font-medium">{participant.user_email}</p>
                  <p className="text-xs text-muted-foreground">Joined at {new Date(participant.joined_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
