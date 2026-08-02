import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AttendanceRecord, ParticipantSession } from "@/store/meeting/meeting.types"
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  Timer,
  Activity,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  LogIn,
  LogOut,
  Hourglass,
  ChevronRight,
} from "lucide-react"
import { toast } from "react-toastify"
import { exportRowsAsCsv, exportRowsAsXlsx, type ReportRow } from "@/lib/report-export"
import { useGroupStore } from "@/store/group/groupUser.store"

interface AttendanceListProps {
  attendanceRecords: AttendanceRecord[]
  participantSessions: ParticipantSession[]
  meetingTitle?: string
}

export function AttendanceList({
  attendanceRecords,
  participantSessions,
  meetingTitle,
}: AttendanceListProps) {
  const { selectedGroup } = useGroupStore()
  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-chart-3/15 text-chart-3 border-chart-3/25"
      case "late": return "bg-chart-2/15 text-chart-2 border-chart-2/25"
      case "left_early": return "bg-chart-1/15 text-chart-1 border-chart-1/25"
      case "absent": return "bg-destructive/15 text-destructive border-destructive/25"
      default: return "bg-muted text-muted-foreground border-border/60"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <UserCheck className="w-3.5 h-3.5" />
      case "late": return <Clock className="w-3.5 h-3.5" />
      case "left_early": return <Timer className="w-3.5 h-3.5" />
      case "absent": return <UserX className="w-3.5 h-3.5" />
      default: return <Users className="w-3.5 h-3.5" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "present": return "Present"
      case "late": return "Late"
      case "left_early": return "Left Early"
      case "absent": return "Absent"
      default: return status
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const formatDateTimeFull = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return "0m"
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const calcSessionDuration = (joined_at: string, left_at: string | null): number | null => {
    if (!left_at) return null
    return Math.round((new Date(left_at).getTime() - new Date(joined_at).getTime()) / 1000 / 60)
  }

  const buildFileName = () => {
    const safeMeetingTitle = (meetingTitle || "meeting-attendance")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
    return `${safeMeetingTitle || "meeting-attendance"}-${new Date().toISOString().split("T")[0]}`
  }

  // Combine attendance records with session data
  const enrichedAttendance = attendanceRecords.map(record => {
    const sessions = participantSessions.filter(session => session.user === record.user)
    return {
      ...record,
      sessions,
      totalSessions: sessions.length,
    }
  })

  // Sort by status (present first) then by name
  const sortedAttendance = [...enrichedAttendance].sort((a, b) => {
    const statusOrder = { present: 0, late: 1, left_early: 2, absent: 3 }
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 4
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 4
    if (aOrder !== bOrder) return aOrder - bOrder
    return (a.user_name || a.user_email).localeCompare(b.user_name || b.user_email)
  })

  const summaryStats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(r => r.status === "present").length,
    late: attendanceRecords.filter(r => r.status === "late").length,
    left_early: attendanceRecords.filter(r => r.status === "left_early").length,
    absent: attendanceRecords.filter(r => r.status === "absent").length,
    averageDuration: attendanceRecords.reduce((sum, r) => sum + r.total_duration_minutes, 0) / attendanceRecords.length || 0
  }

  const exportToExcel = () => {
    try {
      const maximumSessions = Math.max(0, ...sortedAttendance.map((record) => record.sessions.length))
      const sessionHeaders = Array.from({ length: maximumSessions }, (_, index) => [
        `Session ${index + 1} Joined`, `Session ${index + 1} Left`, `Session ${index + 1} Duration`,
      ]).flat()
      const rows: ReportRow[] = [
        ["Meeting Attendance Report"],
        ["Group", selectedGroup?.name || "Not recorded"],
        ["Meeting", meetingTitle || "Meeting"],
        ["Export Date", new Date().toLocaleString()],
        [],
        ["Summary", "Value"],
        ["Total Attendees", summaryStats.total],
        ["Present", summaryStats.present],
        ["Late", summaryStats.late],
        ["Left Early", summaryStats.left_early],
        ["Absent", summaryStats.absent],
        ["Average Duration", formatDuration(Math.round(summaryStats.averageDuration))],
        [],
        ["#", "Name", "Email", "Status", "First Joined", "Last Left", "Total Duration", "Duration (Minutes)", "Number of Sessions", "Verified Member", ...sessionHeaders],
        ...sortedAttendance.map((record, index) => [
          index + 1,
          record.user_name || "",
          record.user_email,
          getStatusText(record.status),
          formatDateTimeFull(record.first_joined_at),
          formatDateTimeFull(record.last_left_at),
          formatDuration(record.total_duration_minutes),
          record.total_duration_minutes,
          record.totalSessions,
          record.is_verified_member ? "Yes" : "No",
          ...Array.from({ length: maximumSessions }, (_, sessionIndex) => {
            const session = record.sessions[sessionIndex]
            return session
              ? [formatDateTimeFull(session.joined_at), formatDateTimeFull(session.left_at), session.left_at ? formatDuration(calcSessionDuration(session.joined_at, session.left_at) ?? 0) : "In Progress"]
              : ["", "", ""]
          }).flat(),
        ]),
      ]
      exportRowsAsXlsx(rows, buildFileName(), "Attendance Report")
      toast.success('Attendance report exported to Excel successfully')
    } catch (error) {
      console.error('Excel export failed:', error)
      toast.error('Failed to export attendance to Excel')
    }
  }

  const exportToCSV = () => {
    try {
      const rows: ReportRow[] = [
        ["Meeting Attendance Report"],
        ["Group", selectedGroup?.name || "Not recorded"],
        ["Meeting", meetingTitle || "Meeting"],
        ["Export Date", new Date().toLocaleString()],
        [],
        ["Name", "Email", "Status", "First Joined", "Last Left", "Total Duration (Minutes)", "Number of Sessions", "Verified Member"],
        ...sortedAttendance.map((record) => [
          record.user_name || "",
          record.user_email,
          getStatusText(record.status),
          formatDateTimeFull(record.first_joined_at),
          formatDateTimeFull(record.last_left_at),
          record.total_duration_minutes,
          record.totalSessions,
          record.is_verified_member ? "Yes" : "No",
        ]),
      ]
      exportRowsAsCsv(rows, buildFileName())
      toast.success('Attendance data exported to CSV successfully')
    } catch (error) {
      console.error('CSV export failed:', error)
      toast.error('Failed to export attendance to CSV')
    }
  }

  const renderExportMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl border-border/80 font-bold">
          <Download className="w-4 h-4 mr-2" />
          Export
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export to Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="w-4 h-4 mr-2" />
          Export to CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="w-5 h-5" />
              Attendance Summary
            </CardTitle>
            {renderExportMenu()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-3 md:grid-cols-6">
            {[
              { label: "Total", value: summaryStats.total, color: "text-foreground" },
              { label: "Present", value: summaryStats.present, color: "text-chart-3" },
              { label: "Late", value: summaryStats.late, color: "text-chart-2" },
              { label: "Left Early", value: summaryStats.left_early, color: "text-chart-1" },
              { label: "Absent", value: summaryStats.absent, color: "text-destructive" },
              { label: "Avg Duration", value: formatDuration(Math.round(summaryStats.averageDuration)), color: "text-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-muted/40 border border-border/40">
                <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                <div className="text-xs font-medium text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attendance List */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Attendance Details</CardTitle>
            {renderExportMenu()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedAttendance.map((record, idx) => {
              const initials = (record.user_name || record.user_email || "?")
                .split(" ")
                .filter(Boolean)
                .map((w: string) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()

              return (
                <div key={record.id} className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
                  {/* Member Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                    <span className="text-xs font-bold text-muted-foreground/50 w-5 text-right tabular-nums shrink-0">{idx + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-chart-4/15 text-chart-4 text-sm font-extrabold flex items-center justify-center shrink-0 border border-chart-4/20">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm truncate">
                          {record.user_name || record.user_email}
                        </span>
                        {record.user_name && (
                          <span className="text-xs text-muted-foreground truncate">{record.user_email}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {record.is_verified_member && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-chart-4/15 text-chart-4 border border-chart-4/25">
                          Verified
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        {getStatusText(record.status)}
                      </span>
                    </div>
                  </div>

                  {/* Time Stats Row */}
                  <div className="grid grid-cols-1 divide-y divide-border/40 min-[400px]:grid-cols-3 min-[400px]:divide-x min-[400px]:divide-y-0">
                    {/* Join Time */}
                    <div className="flex items-center gap-2.5 px-4 py-3">
                      <div className="w-8 h-8 rounded-xl bg-chart-3/10 flex items-center justify-center shrink-0">
                        <LogIn className="w-4 h-4 text-chart-3" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Joined</p>
                        <p className="text-sm font-bold text-foreground">
                          {record.first_joined_at ? formatDateTime(record.first_joined_at) : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Left Time */}
                    <div className="flex items-center gap-2.5 px-4 py-3">
                      <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                        <LogOut className="w-4 h-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Left</p>
                        <p className="text-sm font-bold text-foreground">
                          {record.last_left_at ? formatDateTime(record.last_left_at) : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2.5 px-4 py-3">
                      <div className="w-8 h-8 rounded-xl bg-chart-2/10 flex items-center justify-center shrink-0">
                        <Hourglass className="w-4 h-4 text-chart-2" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duration</p>
                        <p className="text-sm font-bold text-foreground">
                          {formatDuration(record.total_duration_minutes)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Session Breakdown */}
                  {record.sessions.length > 0 && (
                    <details className="group border-t border-border/40">
                      <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors list-none">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          {record.sessions.length} Session{record.sessions.length !== 1 ? "s" : ""}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="divide-y divide-border/30 bg-muted/20">
                        {record.sessions.map((session, sIdx) => {
                          const dur = calcSessionDuration(session.joined_at, session.left_at)
                          return (
                            <div key={session.id} className="grid grid-cols-1 gap-1 px-4 py-2.5 text-xs min-[400px]:grid-cols-3 min-[400px]:items-center">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground font-bold flex items-center justify-center text-[10px] shrink-0">
                                  {sIdx + 1}
                                </span>
                                <span className="text-muted-foreground font-medium">Session {sIdx + 1}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-chart-3">
                                <LogIn className="w-3 h-3" />
                                <span className="font-semibold">{formatDateTime(session.joined_at)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-destructive">
                                  <LogOut className="w-3 h-3" />
                                  <span className="font-semibold">
                                    {session.left_at ? formatDateTime(session.left_at) : "In session"}
                                  </span>
                                </div>
                                {dur !== null && (
                                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                    {formatDuration(dur)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </details>
                  )}
                </div>
              )
            })}

            {sortedAttendance.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mb-3 opacity-25" />
                <p className="text-sm font-medium">No attendance records found for this meeting</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
