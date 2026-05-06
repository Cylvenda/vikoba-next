import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  ChevronDown
} from "lucide-react"
import { toast } from "react-toastify"
import * as XLSX from 'xlsx'

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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300"
      case "late": return "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300"
      case "left_early": return "bg-orange-500/20 text-orange-700 dark:bg-orange-500/30 dark:text-orange-300"
      case "absent": return "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
      default: return "bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
      case "late": return <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
      case "left_early": return <Timer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      case "absent": return <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
      default: return <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
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
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return "0m"
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const buildFileName = (extension: "xlsx" | "csv") => {
    const safeMeetingTitle = (meetingTitle || "meeting-attendance")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()

    return `${safeMeetingTitle || "meeting-attendance"}-${new Date().toISOString().split("T")[0]}.${extension}`
  }

  const exportToExcel = () => {
    try {
      // Prepare data for Excel export
      const excelData = sortedAttendance.map((record, index) => {
        const sessions = participantSessions.filter(session => session.user === record.user)
        const sessionDetails = sessions.map((session, sessionIndex) => ({
          [`Session ${sessionIndex + 1} Joined`]: formatDateTime(session.joined_at),
          [`Session ${sessionIndex + 1} Left`]: formatDateTime(session.left_at),
          [`Session ${sessionIndex + 1} Duration`]: session.left_at
            ? formatDuration(Math.round((new Date(session.left_at).getTime() - new Date(session.joined_at).getTime()) / 1000 / 60))
            : 'In Progress'
        })).reduce((acc, curr) => ({ ...acc, ...curr }), {})

        return {
          '#': index + 1,
          'Name': record.user_name || '',
          'Email': record.user_email,
          'Status': getStatusText(record.status),
          'First Joined': formatDateTime(record.first_joined_at),
          'Last Left': formatDateTime(record.last_left_at),
          'Total Duration': formatDuration(record.total_duration_minutes),
          'Duration (Minutes)': record.total_duration_minutes,
          'Number of Sessions': record.totalSessions,
          'Verified Member': record.is_verified_member ? 'Yes' : 'No',
          ...sessionDetails
        }
      })

      // Add summary statistics at the top
      const summaryData = [
        { 'Metric': 'Total Attendees', 'Value': summaryStats.total },
        { 'Metric': 'Present', 'Value': summaryStats.present },
        { 'Metric': 'Late', 'Value': summaryStats.late },
        { 'Metric': 'Left Early', 'Value': summaryStats.left_early },
        { 'Metric': 'Absent', 'Value': summaryStats.absent },
        { 'Metric': 'Average Duration', 'Value': formatDuration(Math.round(summaryStats.averageDuration)) },
        {},
        { 'Export Date': new Date().toLocaleString() },
        { 'Report Type': 'Meeting Attendance Report' }
      ]

      // Combine summary and detailed data
      const worksheetData = [...summaryData, {}, ...excelData]

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(worksheetData)

      // Set column widths
      const colWidths = [
        { wch: 5 },  // #
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 12 }, // Status
        { wch: 20 }, // First Joined
        { wch: 20 }, // Last Left
        { wch: 15 }, // Total Duration
        { wch: 18 }, // Duration (Minutes)
        { wch: 15 }, // Number of Sessions
        { wch: 15 }, // Verified Member
      ]

      // Add dynamic columns for sessions
      const maxSessions = sortedAttendance.length > 0
        ? Math.max(...sortedAttendance.map((record) => record.totalSessions))
        : 0
      for (let i = 0; i < maxSessions; i++) {
        colWidths.push({ wch: 20 }) // Session Joined
        colWidths.push({ wch: 20 }) // Session Left
        colWidths.push({ wch: 15 }) // Session Duration
      }

      ws['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report')

      // Generate filename and download
      const fileName = buildFileName("xlsx")
      XLSX.writeFile(wb, fileName)

      toast.success('Attendance report exported to Excel successfully')
    } catch (error) {
      console.error('Excel export failed:', error)
      toast.error('Failed to export attendance to Excel')
    }
  }

  const exportToCSV = () => {
    try {
      // Prepare CSV data
      const csvData = sortedAttendance.map((record) => ({
        'Name': record.user_name || '',
        'Email': record.user_email,
        'Status': getStatusText(record.status),
        'First Joined': formatDateTime(record.first_joined_at),
        'Last Left': formatDateTime(record.last_left_at),
        'Total Duration (Minutes)': record.total_duration_minutes,
        'Number of Sessions': record.totalSessions,
        'Verified Member': record.is_verified_member ? 'Yes' : 'No'
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(csvData)

      // Set column widths
      ws['!cols'] = [
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 12 }, // Status
        { wch: 20 }, // First Joined
        { wch: 20 }, // Last Left
        { wch: 20 }, // Total Duration
        { wch: 15 }, // Number of Sessions
        { wch: 15 }, // Verified Member
      ]

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

      // Generate filename and download
      const fileName = buildFileName("csv")
      XLSX.writeFile(wb, fileName)

      toast.success('Attendance data exported to CSV successfully')
    } catch (error) {
      console.error('CSV export failed:', error)
      toast.error('Failed to export attendance to CSV')
    }
  }

  // Combine attendance records with session data
  const enrichedAttendance = attendanceRecords.map(record => {
    const sessions = participantSessions.filter(session => session.user === record.user)
    return {
      ...record,
      sessions,
      totalSessions: sessions.length,
      firstJoin: sessions.length > 0 ? sessions[0].joined_at : null,
      lastLeave: sessions.length > 0 ? sessions[sessions.length - 1].left_at : null
    }
  })

  // Sort by status (present first) then by name
  const sortedAttendance = [...enrichedAttendance].sort((a, b) => {
    const statusOrder = { present: 0, late: 1, left_early: 2, absent: 3 }
    const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 4
    const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 4

    if (aStatusOrder !== bStatusOrder) {
      return aStatusOrder - bStatusOrder
    }

    const aName = a.user_name || a.user_email
    const bName = b.user_name || b.user_email
    return aName.localeCompare(bName)
  })

  const summaryStats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(r => r.status === "present").length,
    late: attendanceRecords.filter(r => r.status === "late").length,
    left_early: attendanceRecords.filter(r => r.status === "left_early").length,
    absent: attendanceRecords.filter(r => r.status === "absent").length,
    averageDuration: attendanceRecords.reduce((sum, r) => sum + r.total_duration_minutes, 0) / attendanceRecords.length || 0
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Attendance Summary
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{summaryStats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryStats.present}</div>
              <div className="text-sm text-muted-foreground">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summaryStats.late}</div>
              <div className="text-sm text-muted-foreground">Late</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summaryStats.left_early}</div>
              <div className="text-sm text-muted-foreground">Left Early</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summaryStats.absent}</div>
              <div className="text-sm text-muted-foreground">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatDuration(Math.round(summaryStats.averageDuration))}</div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attendance List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Details</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedAttendance.map((record) => (
              <div key={record.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{record.user_name || record.user_email}</h4>
                      {record.user_name && <span className="text-sm text-muted-foreground">{record.user_email}</span>}
                      <Badge className={getStatusColor(record.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(record.status)}
                          {getStatusText(record.status)}
                        </span>
                      </Badge>
                      {record.is_verified_member && (
                        <Badge variant="outline" className="text-blue-600">
                          Verified Member
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">First Joined:</span>
                        <div>{formatDateTime(record.first_joined_at)}</div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Last Left:</span>
                        <div>{formatDateTime(record.last_left_at)}</div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Total Duration:</span>
                        <div className="font-medium">{formatDuration(record.total_duration_minutes)}</div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Sessions:</span>
                        <div className="font-medium">{record.totalSessions} session(s)</div>
                      </div>
                    </div>

                    {/* Session Details */}
                    {record.sessions.length > 0 && (
                      <div className="mt-3">
                        <details className="cursor-pointer">
                          <summary className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            View session details
                          </summary>
                          <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            {record.sessions.map((session, index) => (
                              <div key={session.id} className="text-sm">
                                <div className="flex items-center gap-2">
                                  <Activity className="w-3 h-3 text-muted-foreground" />
                                  <span>Session {index + 1}</span>
                                </div>
                                <div className="ml-5 text-muted-foreground">
                                  Joined: {formatDateTime(session.joined_at)}
                                  {session.left_at && (
                                    <>
                                      <span className="mx-2">•</span>
                                      Left: {formatDateTime(session.left_at)}
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {sortedAttendance.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>No attendance records found for this meeting</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
