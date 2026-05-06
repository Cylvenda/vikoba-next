import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { meetingServices } from "@/api/services/meeting.service"
import { MeetingHistory, MeetingStatus } from "@/store/meeting/meeting.types"
import {
  Calendar,
  Clock,
  Users,
  FileText,
  ArrowLeft,
  Activity,
  Timer,
  Target,
  History,
  RefreshCw,
} from "lucide-react"
import { toast } from "react-toastify"
import { AttendanceList } from "./AttendanceList"
import { MeetingMinutesDisplay } from "./MeetingMinutesDisplay"
import { MeetingAgendaHistory } from "./MeetingAgendaHistory"
import { MeetingAuditLogDisplay } from "./MeetingAuditLogDisplay"
import { AgendaMinutesHistory } from "@/components/meeting/AgendaMinutesHistory"
import { useAuthUserStore } from "@/store/auth/userAuth.store"

interface MeetingDetailViewProps {
  meetingId: string
  onBack?: () => void
}

export function MeetingDetailView({ meetingId, onBack }: MeetingDetailViewProps) {
   const [meeting, setMeeting] = useState<MeetingHistory | null>(null)
   const [loading, setLoading] = useState(true)
   const [recalculating, setRecalculating] = useState(false)
   const { user } = useAuthUserStore()

  useEffect(() => {
    const loadMeetingDetails = async () => {
      setLoading(true)
      try {
        const response = await meetingServices.getMeetingHistory(meetingId)
        setMeeting(response.data)
      } catch (error: unknown) {
        const errorResponse = error as { response?: { data?: { detail?: string } } }
        toast.error(errorResponse.response?.data?.detail || "Failed to load meeting details")
      } finally {
        setLoading(false)
      }
    }

    void loadMeetingDetails()
  }, [meetingId])

  const getStatusColor = (status: MeetingStatus) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300"
      case "ongoing": return "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300"
      case "ended": return "bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300"
      case "cancelled": return "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
      default: return "bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const handleRecalculateAttendance = async () => {
    if (!meeting) return

    setRecalculating(true)
    try {
      const response = await meetingServices.recalculateAttendance(meeting.id)
      toast.success(response.data.detail || "Attendance recalculated successfully")

      // Reload meeting details to show updated attendance
      const updatedResponse = await meetingServices.getMeetingHistory(meetingId)
      setMeeting(updatedResponse.data)
    } catch (error: unknown) {
      const errorResponse = error as { response?: { data?: { detail?: string } } }
      toast.error(errorResponse.response?.data?.detail || "Failed to recalculate attendance")
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading meeting details...</div>
        </CardContent>
      </Card>
    )
  }

  if (!meeting) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Meeting not found</div>
        </CardContent>
      </Card>
    )
  }

const isHostViewer = user?.email === meeting.host_email

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {meeting?.group ? "Back to Group" : "Back to List"}
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={getStatusColor(meeting.status)}>
              {meeting.status}
            </Badge>
            <span className="text-muted-foreground">
              Host: {meeting.host_email}
            </span>
          </div>
        </div>
      </div>

      {/* Meeting Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 dark:bg-blue-500/30 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(meeting.scheduled_start)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 dark:bg-green-500/30 rounded-lg">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{formatTime(meeting.scheduled_start)}</p>
                {meeting.scheduled_end && (
                  <p className="text-sm">- {formatTime(meeting.scheduled_end)}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 dark:bg-purple-500/30 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="font-medium">{meeting.present_attendees}/{meeting.total_attendees}</p>
                <p className="text-sm text-muted-foreground">
                  {meeting.total_attendees > 0
                    ? `${Math.round((meeting.present_attendees / meeting.total_attendees) * 100)}% present`
                    : 'No attendees'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 dark:bg-orange-500/30 rounded-lg">
                <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agenda Progress</p>
                <p className="font-medium">{meeting.agenda_completion_percentage}%</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                    style={{ width: `${meeting.agenda_completion_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {meeting.description && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{meeting.description}</p>
            </div>
          )}

          {/* Duration and Timing */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {meeting.actual_start && (
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Started: {formatDate(meeting.actual_start)} at {formatTime(meeting.actual_start)}
                </span>
              </div>
            )}

            {meeting.actual_end && (
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Ended: {formatDate(meeting.actual_end)} at {formatTime(meeting.actual_end)}
                </span>
              </div>
            )}

            {meeting.meeting_duration_minutes > 0 && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Duration: {meeting.meeting_duration_minutes} minutes
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="agenda" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Agenda
          </TabsTrigger>
          <TabsTrigger value="minutes" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Minutes
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          {/* Attendance Header with Export */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Attendance Records</h3>
                  <p className="text-sm text-muted-foreground">
                    {meeting.attendance_records.length} attendee{meeting.attendance_records.length !== 1 ? 's' : ''} recorded
                  </p>
                </div>
                {isHostViewer && meeting.status === "ended" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecalculateAttendance}
                    disabled={recalculating}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                    {recalculating ? 'Recalculating...' : 'Recalculate'}
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Attendance Actions */}
          {isHostViewer && meeting.status === "ended" && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Attendance Management</h3>
                    <p className="text-sm text-muted-foreground">
                      If attendance status appears incorrect, you can recalculate it based on actual participation data.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecalculateAttendance}
                    disabled={recalculating}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                    {recalculating ? 'Recalculating...' : 'Recalculate Attendance'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <AttendanceList
            attendanceRecords={meeting.attendance_records}
            participantSessions={meeting.participant_sessions}
            meetingTitle={meeting.title}
          />
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <MeetingAgendaHistory
            agendaSections={meeting.agenda_sections || []}
            agendaItems={meeting.agenda_items || []}
          />
        </TabsContent>

        <TabsContent value="minutes" className="space-y-4">
          <MeetingMinutesDisplay minutes={meeting.minutes} />
          <AgendaMinutesHistory
            agendaItems={meeting.agenda_items || []}
            minuteNotes={meeting.agenda_minute_notes || []}
            additionalNotes={meeting.additional_notes || []}
            isHost={isHostViewer}
          />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <MeetingAuditLogDisplay auditLogs={meeting.audit_logs} />
        </TabsContent>
      </Tabs >
    </div >
  )
}
