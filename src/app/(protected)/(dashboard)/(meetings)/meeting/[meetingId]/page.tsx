"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Calendar, Clock, Users, ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AgendaMinutesHistory } from "@/components/meeting/AgendaMinutesHistory"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { toast } from "react-toastify"
import type { AttendanceRecord, ParticipantSession } from "@/store/meeting/meeting.types"

export default function MeetingPage() {
  const params = useParams<{ meetingId: string }>()
  const meetingId = Array.isArray(params?.meetingId) ? params.meetingId[0] : params?.meetingId
  const { user } = useAuthUserStore()
  const {
    selectedMeeting,
    attendance,
    participants,
    loading,
    fetchMeetingById,
    fetchAttendance,
    fetchParticipants,
    addAgendaItem,
    removeAgendaItem,
    startMeeting,
  } = useMeetingStore()

  const [agendaTitle, setAgendaTitle] = useState("")
  const [agendaDescription, setAgendaDescription] = useState("")
  const [showAgendaForm, setShowAgendaForm] = useState(false)

  useEffect(() => {
    if (!meetingId) return

    const load = async () => {
      await fetchMeetingById(meetingId)
      await fetchAttendance(meetingId)
      await fetchParticipants(meetingId)
    }

    void load()
  }, [meetingId, fetchMeetingById, fetchAttendance, fetchParticipants])

  const isHost = user?.email === selectedMeeting?.host_email
  const sessionHref = meetingId ? `/meeting/${meetingId}/session` : "#"
  const canCreateAgenda = isHost

  const scheduledStart = selectedMeeting?.scheduled_start
    ? new Date(selectedMeeting.scheduled_start).toLocaleString("en-US", {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : "Not scheduled"

  const handleAgendaAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingId || !agendaTitle.trim()) return

    try {
      await addAgendaItem({
        meeting: meetingId!,
        title: agendaTitle.trim(),
        description: agendaDescription.trim() || undefined,
        allocated_minutes: 10,
        order: (selectedMeeting?.agenda_items?.length || 0) + 1,
      })
      setAgendaTitle("")
      setAgendaDescription("")
      setShowAgendaForm(false)
      toast.success("Agenda item added")
    } catch (error: unknown) {
      toast.error("Failed to add agenda item")
    }
  }

  const handleAgendaDelete = async (itemId: string) => {
    if (!meetingId) return

    try {
      await removeAgendaItem(itemId)
      toast.success("Agenda item removed")
    } catch (error: unknown) {
      toast.error("Failed to remove agenda item")
    }
  }

  const handleStartMeeting = async () => {
    if (!meetingId) return

    // Navigate to session page for device testing
    window.location.href = `/meeting/${meetingId}/session`
  }

  const attendanceHistory = useMemo(() => {
    const sessionsByUser = new Map<string, ParticipantSession[]>()

    participants.forEach((session) => {
      const existing = sessionsByUser.get(session.user) || []
      existing.push(session)
      sessionsByUser.set(session.user, existing)
    })

    return attendance
      .map((record: AttendanceRecord) => {
        const userSessions = (sessionsByUser.get(record.user) || []).sort(
          (left, right) => new Date(right.joined_at).getTime() - new Date(left.joined_at).getTime()
        )

        const mappedRecord = {
          id: record.user,
          email: record.user_email,
          joinedAt: record.first_joined_at || (userSessions.length > 0 ? userSessions[0].joined_at : null),
          lastLeftAt: record.last_left_at || (userSessions.length > 0 ? userSessions[userSessions.length - 1].left_at : null),
          totalDurationMinutes: record.total_duration_minutes,
          status: record.status,
          isVerifiedMember: record.is_verified_member,
          joinCount: userSessions.length,
          sessions: userSessions,
        }

        return mappedRecord
      })
      .sort((left, right) => {
        if (left.totalDurationMinutes !== right.totalDurationMinutes) {
          return right.totalDurationMinutes - left.totalDurationMinutes
        }
        return left.email.localeCompare(right.email)
      })
  }, [attendance, participants])

  const formatHistoryDateTime = (value: string | null) => {
    if (!value) return "Not recorded"
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) return "Invalid date"
      return date.toLocaleString()
    } catch (error) {
      return "Date error"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing": return "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300"
      case "ended": return "bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300"
      case "cancelled": return "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
      default: return "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300"
    }
  }

  const getActionButton = () => {
    if (!meetingId) return null

    switch (selectedMeeting?.status) {
      case "ongoing":
        return (
          <Button asChild>
            <Link href={sessionHref}>Join Meeting</Link>
          </Button>
        )
      case "scheduled":
        // Show Start Meeting button for hosts, Not Started for others
        if (isHost) {
          return (
            <Button
              onClick={handleStartMeeting}
            >
              Start Meeting
            </Button>
          )
        }
        return <Button disabled>Not Started</Button>
      case "ended":
        return <Button disabled>Meeting Ended</Button>
      default:
        return <Button disabled>Open Session</Button>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading meeting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link href={selectedMeeting?.group ? `/group/${selectedMeeting.group}` : "/home"} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                {selectedMeeting?.group ? "Back to Group" : "Back"}
              </Link>
            </Button>

            {getActionButton()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {selectedMeeting?.status === "ended" ? (
        // Ended Meeting Layout - Two Column
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Meeting Details and Minutes */}
            <div className="lg:col-span-2 space-y-8">
              {/* Meeting Header */}
              <Card>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">
                          {selectedMeeting?.title || "Meeting"}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedMeeting?.status || "")}`}>
                          {selectedMeeting?.status || "Loading"}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>Host: {selectedMeeting?.host_email || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{scheduledStart}</span>
                        </div>
                      </div>

                      {selectedMeeting?.description && (
                        <p className="mt-4 leading-relaxed">
                          {selectedMeeting.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Meeting Details */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Meeting Details</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Scheduled Start</p>
                          <p className="text-sm text-muted-foreground">{scheduledStart}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          <p className="text-sm text-muted-foreground capitalize">{selectedMeeting?.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Host</p>
                          <p className="text-sm text-muted-foreground">{selectedMeeting?.host_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Actual Start</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedMeeting?.actual_start
                              ? new Date(selectedMeeting.actual_start).toLocaleString()
                              : "Not recorded"
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Agenda Section */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">Agenda</h2>
                      <p className="text-sm text-muted-foreground">Meeting topics and discussion points</p>
                    </div>
                  </div>

                  {/* Agenda Items */}
                  <div className="space-y-3">
                    {selectedMeeting?.agenda_items?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No agenda items
                      </div>
                    ) : (
                      selectedMeeting?.agenda_items?.map((item, index) => (
                        <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="shrink-0 w-8 h-8 bg-blue-500/20 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{item.title}</h3>
                            {item.description && (
                              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">{item.allocated_minutes} minutes allocated</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>

              {/* Meeting Minutes */}
              <Card>
                <div className="p-6">
                  <AgendaMinutesHistory
                    meetingId={meetingId!}
                    agendaItems={selectedMeeting?.agenda_items || []}
                    isHost={isHost}
                  />
                </div>
              </Card>
            </div>

            {/* Right Column - Attendance */}
            <div className="space-y-8">
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">Attendance</h2>
                      <p className="text-sm text-muted-foreground">All participants</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {attendanceHistory.length} participants
                    </div>
                  </div>

                  <div className="space-y-4">
                    {attendanceHistory.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No attendance recorded
                      </div>
                    ) : (
                      attendanceHistory.map((item) => (
                        <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium">{item.email}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isVerifiedMember ? "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300" : "bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300"
                                  }`}>
                                  {item.isVerifiedMember ? "Verified" : "Guest"}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${item.status === "present" ? "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300" :
                                  item.status === "late" ? "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300" :
                                    item.status === "left_early" ? "bg-orange-500/20 text-orange-700 dark:bg-orange-500/30 dark:text-orange-300" :
                                      "bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300"
                                  }`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total Duration</p>
                              <p className="font-medium">{item.totalDurationMinutes} min</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">First Joined</p>
                              <p className="font-medium">{formatHistoryDateTime(item.joinedAt)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Last Left</p>
                              <p className="font-medium">{formatHistoryDateTime(item.lastLeftAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        // Regular Meeting Layout - Single Column
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Meeting Header */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">
                      {selectedMeeting?.title || "Meeting"}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedMeeting?.status || "")}`}>
                      {selectedMeeting?.status || "Loading"}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>Host: {selectedMeeting?.host_email || "Unknown"}</span>
                      {isHost && selectedMeeting?.status === "scheduled" && (
                        <Button
                          onClick={handleStartMeeting}
                          className="ml-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                          size="sm"
                        >
                          Start Meeting
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{scheduledStart}</span>
                    </div>
                  </div>

                  {selectedMeeting?.description && (
                    <p className="mt-4 leading-relaxed">
                      {selectedMeeting.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Agenda Section */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Agenda</h2>
                  <p className="text-sm text-muted-foreground">Meeting topics and discussion points</p>
                </div>

                {canCreateAgenda && (
                  <Button
                    onClick={() => setShowAgendaForm(!showAgendaForm)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                )}
              </div>

              {/* Add Agenda Form */}
              {showAgendaForm && canCreateAgenda && (
                <form onSubmit={handleAgendaAdd} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="space-y-4">
                    <Input
                      value={agendaTitle}
                      onChange={(e) => setAgendaTitle(e.target.value)}
                      placeholder="Agenda item title"
                      required
                    />
                    <textarea
                      value={agendaDescription}
                      onChange={(e) => setAgendaDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full min-h-20 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button type="submit">Add Item</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAgendaForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Agenda Items */}
              <div className="space-y-3">
                {selectedMeeting?.agenda_items?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No agenda items yet
                  </div>
                ) : (
                  selectedMeeting?.agenda_items?.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="shrink-0 w-8 h-8 bg-blue-500/20 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        {item.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      {canCreateAgenda && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAgendaDelete(item.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Quick Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Meeting Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground capitalize">{selectedMeeting?.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Host</p>
                    <p className="text-sm text-muted-foreground">{selectedMeeting?.host_email}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}