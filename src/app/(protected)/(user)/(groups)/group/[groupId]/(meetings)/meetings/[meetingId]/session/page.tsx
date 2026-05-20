"use client"

import Link from "next/link"
import { useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MeetingRealtimePanel } from "@/components/meeting/meeting-realtime-panel"
import { useMeetingLiveSync } from "@/hooks/use-meeting-live-sync"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { toast } from "react-toastify"
import { getMeetingDetailHref } from "@/lib/meeting-routes"
import { Video, ShieldAlert, Users, PhoneOff, ArrowLeft } from "lucide-react"

export default function MeetingSessionPage() {
  const params = useParams<{ meetingId: string; groupId: string }>()
  const router = useRouter()
  const meetingId = Array.isArray(params?.meetingId) ? params.meetingId[0] : params?.meetingId
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  
  const { user } = useAuthUserStore()
  const { selectedGroupMembers, fetchSelectedGroupMembers } = useGroupStore()
  
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
      if (groupId && selectedGroupMembers.length === 0) {
        await fetchSelectedGroupMembers(groupId)
      }
    }

    void load()
  }, [meetingId, groupId, fetchMeetingById, fetchAttendance, fetchParticipants, fetchSelectedGroupMembers, selectedGroupMembers.length])

  useMeetingLiveSync({
    meetingId,
    status: selectedMeeting?.status,
    refreshMeeting: fetchMeetingById,
    refreshAttendance: fetchAttendance,
    refreshParticipants: fetchParticipants,
  })

  // ==========================================
  // Role-Based Access Control
  // ==========================================
  const currentUserMembership = useMemo(() => {
    return selectedGroupMembers.find(member => member.email === user?.email);
  }, [selectedGroupMembers, user]);

  const isLeader = (currentUserMembership?.role === "CHAIRPERSON" || currentUserMembership?.role === "SECRETARY") && 
                   currentUserMembership?.is_verified && 
                   currentUserMembership?.is_active;

  const isMeetingOngoing = selectedMeeting?.status === "ongoing"
  const activeParticipants = participants.filter((participant) => participant.left_at === null)
  const isConnectedParticipant = activeParticipants.some((participant) => participant.user_email === user?.email)
  const detailsHref = meetingId ? getMeetingDetailHref(meetingId, selectedMeeting?.group ?? params?.groupId) : "/home"

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
      toast.success("You left the session.")
      router.push(detailsHref)
      return
    }

    toast.error(result.message)
  }

  const handleRoomConnected = async () => {
    if (!meetingId) return
    toast.success("Connected to the Live Session.")
    await fetchParticipants(meetingId, { silent: true })
  }

  const handleRoomDisconnected = async () => {
    if (!meetingId) return
    await fetchParticipants(meetingId, { silent: true })
    await fetchAttendance(meetingId, { silent: true })
    toast.warning("Disconnected from the Live Session.")
  }

  const roomHeaderActions = (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm" className="rounded-full shadow-sm">
        <Link href={detailsHref} className="flex items-center gap-2 text-xs font-bold">
          <ArrowLeft className="w-3.5 h-3.5" /> Leave to Details
        </Link>
      </Button>
      {isLeader && isMeetingOngoing ? (
        <Button size="sm" className="rounded-full bg-red-500 hover:bg-red-600 text-white font-bold shadow-sm shadow-red-500/20" onClick={handleEnd} disabled={loading}>
          <PhoneOff className="w-3.5 h-3.5 mr-1" /> End Session
        </Button>
      ) : null}
    </div>
  )

  if (isMeetingOngoing) {
    return (
      <div className="fixed inset-x-0 bottom-0 top-22 z-40 bg-background md:top-23">
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
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 space-y-6">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        
        {/* Pre-Join Lobby Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-[2rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 md:p-8 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-chart-3/30 bg-chart-3/10 px-3 py-1 text-[10px] font-bold tracking-widest text-chart-3 uppercase mb-4 shadow-sm">
              <Video className="w-3 h-3" /> Pre-Session Lobby
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{selectedMeeting?.title || "Loading session..."}</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> 
              Status: <span className="uppercase tracking-widest text-[10px] bg-muted px-2 py-0.5 rounded border border-border/50">{selectedMeeting?.status || "loading"}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full font-bold shadow-sm border-border/80 hover:bg-chart-3/10 hover:border-chart-3/30 hover:text-chart-3 transition-colors">
              <Link href={detailsHref}>Back to Details</Link>
            </Button>
            {isLeader && selectedMeeting?.status === "scheduled" && (
              <Button className="rounded-full bg-chart-3 hover:bg-chart-2 text-primary-foreground font-bold shadow-md" onClick={handleStart} disabled={loading}>
                <Video className="w-4 h-4 mr-2" /> Start Session Now
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Video/Join Container */}
          <div className="xl:col-span-2">
            <div className="rounded-[2rem] border border-border/80 bg-card/40 backdrop-blur-sm p-6 shadow-sm overflow-hidden h-full flex flex-col justify-center items-center relative">

              
              <div className="text-center max-w-md relative z-10 py-10">
                <div className="mx-auto w-16 h-16 rounded-full bg-chart-4/15 flex items-center justify-center mb-6 border border-chart-4/30 shadow-inner">
                  <Video className="w-8 h-8 text-chart-4" />
                </div>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">Ready to connect?</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-medium">
                  Verify your camera and microphone permissions before requesting a secure token to join the Community Hub Live Session.
                </p>
              </div>

              <div className="w-full relative z-10 border-t border-border/50 pt-8 mt-4">
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
              </div>
            </div>
          </div>

          {/* Side Panel: Active Data */}
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
                <Users className="w-5 h-5 text-chart-4" />
                <h2 className="text-lg font-bold tracking-tight">Live Tracker</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Active Participants</h3>
                  {isMeetingOngoing && (
                    <div className={`mb-3 inline-flex rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${isConnectedParticipant ? 'border-green-500/30 bg-green-500/10 text-green-600' : 'border-chart-4/30 bg-chart-4/10 text-chart-4'}`}>
                      {isConnectedParticipant ? "You are connected" : "You are disconnected"}
                    </div>
                  )}

                  <div className="space-y-2">
                    {activeParticipants.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No participants actively transmitting data.</p>
                    ) : (
                      activeParticipants.map((participant) => (
                        <div key={participant.id} className="rounded-xl bg-background/50 border border-border/60 px-3 py-2 text-sm flex justify-between items-center">
                          <span className="font-bold text-foreground truncate">{participant.user_email}</span>
                          <span className="shrink-0 h-2 w-2 rounded-full bg-green-500 animate-pulse ml-2" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Attendance History</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {attendance.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No history logged yet.</p>
                    ) : (
                      attendance.map((record) => (
                        <div key={record.id} className="rounded-xl border border-border/50 bg-card p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-bold text-sm truncate">{record.user_email}</p>
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                              {record.is_verified_member ? "Member" : "Guest"}
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                              record.status === "present" ? "bg-green-500/10 text-green-600" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {record.status}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground">{record.total_duration_minutes} min duration</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
