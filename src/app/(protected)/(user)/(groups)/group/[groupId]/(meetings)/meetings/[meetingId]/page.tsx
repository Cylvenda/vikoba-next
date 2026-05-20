"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Calendar, Clock, Users, ArrowLeft, Plus, Trash2, LayoutDashboard, CalendarCheck, Download, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgendaMinutesHistory } from "@/components/meeting/AgendaMinutesHistory"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { useGroupStore } from "@/store/group/groupUser.store"
import { toast } from "react-toastify"
import type { AttendanceRecord, ParticipantSession } from "@/store/meeting/meeting.types"
import { getMeetingSessionHref } from "@/lib/meeting-routes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import * as XLSX from "xlsx"

export default function MeetingPage() {
  const params = useParams<{ meetingId: string; groupId: string }>()
  const meetingId = Array.isArray(params?.meetingId) ? params.meetingId[0] : params?.meetingId
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  
  const { user } = useAuthUserStore()
  const { selectedGroupMembers, fetchSelectedGroupMembers } = useGroupStore()
  
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
      if (groupId && selectedGroupMembers.length === 0) {
        await fetchSelectedGroupMembers(groupId)
      }
    }

    void load()
  }, [meetingId, groupId, fetchMeetingById, fetchAttendance, fetchParticipants, fetchSelectedGroupMembers, selectedGroupMembers.length])

  // ==========================================
  // Role-Based Access Control & Logic
  // ==========================================
  const currentUserMembership = useMemo(() => {
    return selectedGroupMembers.find(member => member.email === user?.email);
  }, [selectedGroupMembers, user]);

  const isLeader = (currentUserMembership?.role === "CHAIRPERSON" || currentUserMembership?.role === "SECRETARY") && 
                   currentUserMembership?.is_verified && 
                   currentUserMembership?.is_active;

  const sessionHref = meetingId ? getMeetingSessionHref(meetingId, selectedMeeting?.group ?? params?.groupId) : "#"
  
  // Can only create an agenda if they are a leader AND the meeting is not ended
  const canCreateAgenda = isLeader && selectedMeeting?.status !== "ended"

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
    } catch {
      toast.error("Failed to add agenda item")
    }
  }

  const handleAgendaDelete = async (itemId: string) => {
    if (!meetingId) return
    try {
      await removeAgendaItem(itemId)
      toast.success("Agenda item removed")
    } catch {
      toast.error("Failed to remove agenda item")
    }
  }

  const handleStartMeeting = async () => {
    if (!meetingId) return
    window.location.href = sessionHref
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

        return {
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
      })
      .sort((left, right) => {
        if (left.totalDurationMinutes !== right.totalDurationMinutes) {
          return right.totalDurationMinutes - left.totalDurationMinutes
        }
        return left.email.localeCompare(right.email)
      })
  }, [attendance, participants])

  // ==========================================
  // EXPORT FUNCTIONS
  // ==========================================
  const handleExportAttendanceExcel = () => {
    if (attendanceHistory.length === 0) {
      toast.error("No attendance data to export.")
      return
    }
    const ws = XLSX.utils.json_to_sheet(attendanceHistory.map(item => ({
      "Email Address": item.email,
      "Membership Type": item.isVerifiedMember ? "Member" : "Guest",
      "Attendance Status": item.status,
      "Time Joined": item.joinedAt ? new Date(item.joinedAt).toLocaleString() : "Not recorded",
      "Total Duration (Min)": item.totalDurationMinutes
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Attendance")
    XLSX.writeFile(wb, `Attendance_${selectedMeeting?.title || 'Meeting'}.xlsx`)
    toast.success("Attendance exported to Excel")
  }

  const handleExportAttendanceWord = () => {
    if (attendanceHistory.length === 0) {
      toast.error("No attendance data to export.")
      return
    }
    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Attendance</title></head>
        <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #333;">Attendance Ledger: ${selectedMeeting?.title}</h2>
            <p><strong>Date:</strong> ${scheduledStart}</p>
            <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; border-color: #ddd;">
                <tr style="background-color: #f8f9fa;">
                  <th>Email</th><th>Type</th><th>Status</th><th>Joined</th><th>Duration (Min)</th>
                </tr>
                ${attendanceHistory.map(item => `
                    <tr>
                        <td>${item.email}</td>
                        <td>${item.isVerifiedMember ? "Member" : "Guest"}</td>
                        <td><strong style="text-transform: uppercase;">${item.status}</strong></td>
                        <td>${item.joinedAt ? new Date(item.joinedAt).toLocaleString() : "Not recorded"}</td>
                        <td>${item.totalDurationMinutes} min</td>
                    </tr>
                `).join('')}
            </table>
        </body>
        </html>
    `
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Attendance_${selectedMeeting?.title || 'Meeting'}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Attendance exported to Word")
  }

  const handleExportAgendaPdf = () => {
    if (!selectedMeeting?.agenda_items || selectedMeeting.agenda_items.length === 0) {
      toast.error("No agenda points to export.")
      return
    }
    const htmlContent = `
        <html>
        <head>
          <title>Agenda_${selectedMeeting?.title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h2 { color: #111; margin-bottom: 5px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .date { color: #666; margin-bottom: 30px; font-size: 14px; }
            ol { padding-left: 20px; }
            li { margin-bottom: 25px; }
            strong { font-size: 18px; color: #222; }
            .meta { color: #777; font-size: 14px; margin-left: 8px; font-weight: normal; }
            p { margin-top: 8px; color: #555; }
          </style>
        </head>
        <body>
            <h2>Formal Agenda: ${selectedMeeting?.title}</h2>
            <div class="date">Date: ${scheduledStart}</div>
            <ol>
                ${selectedMeeting.agenda_items.map(item => `
                    <li>
                        <strong>${item.title}</strong> 
                        <span class="meta">(${item.allocated_minutes} min)</span>
                        <p>${item.description || "No description provided."}</p>
                    </li>
                `).join('')}
            </ol>
            <script>
                window.onload = () => { window.print(); }
            </script>
        </body>
        </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    } else {
      toast.error("Please allow popups to export as PDF.")
    }
  }

  const handleExportAgendaWord = () => {
    if (!selectedMeeting?.agenda_items || selectedMeeting.agenda_items.length === 0) {
      toast.error("No agenda points to export.")
      return
    }
    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Agenda</title></head>
        <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #333;">Formal Agenda: ${selectedMeeting?.title}</h2>
            <p><strong>Date:</strong> ${scheduledStart}</p>
            <hr/>
            <ol style="margin-top: 20px;">
                ${selectedMeeting.agenda_items.map(item => `
                    <li style="margin-bottom: 15px;">
                        <strong style="font-size: 16px;">${item.title}</strong> 
                        <span style="color: #666; font-size: 14px;">(${item.allocated_minutes} min)</span><br/>
                        <p style="margin-top: 5px; color: #444;">${item.description || "No description provided."}</p>
                    </li>
                `).join('')}
            </ol>
        </body>
        </html>
    `
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Agenda_${selectedMeeting?.title || 'Meeting'}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Agenda exported to Word")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ongoing": 
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold tracking-wide text-red-500 shadow-sm animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            LIVE NOW
          </span>
        )
      case "ended": 
        return <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold tracking-wide text-muted-foreground shadow-sm">CONCLUDED</span>
      case "scheduled":
        return <span className="inline-flex rounded-full border border-chart-4/30 bg-chart-4/10 px-3 py-1 text-xs font-bold tracking-wide text-chart-4 shadow-sm">SCHEDULED</span>
      case "cancelled": 
        return <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold tracking-wide text-orange-500 shadow-sm">CANCELLED</span>
      default: 
        return <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold tracking-wide text-blue-500 shadow-sm uppercase">{status}</span>
    }
  }

  const getActionButton = () => {
    if (!meetingId) return null

    switch (selectedMeeting?.status) {
      case "ongoing":
        return (
          <Button asChild className="bg-red-500 hover:bg-red-600 text-white rounded-full font-bold shadow-md shadow-red-500/20">
            <Link href={sessionHref}>Join Session</Link>
          </Button>
        )
      case "scheduled":
        if (isLeader) {
          return (
            <Button onClick={handleStartMeeting} className="bg-chart-3 hover:bg-chart-2 text-primary-foreground rounded-full font-bold shadow-md">
              Start Session Now
            </Button>
          )
        }
        return <Button disabled variant="outline" className="rounded-full font-bold border-border/80 text-muted-foreground">Waiting for Host</Button>
      case "ended":
        return <Button disabled variant="outline" className="rounded-full font-bold border-border/80 text-muted-foreground">Session Ended</Button>
      default:
        return null
    }
  }

  if (loading || !selectedMeeting) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <CalendarCheck className="w-10 h-10 animate-pulse text-chart-3/50" />
          <p className="font-medium tracking-tight">Loading session ledger...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-8">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-[2rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 shadow-sm relative overflow-hidden">

          
          <div className="flex items-center gap-4 relative z-10">
            <Button asChild variant="outline" size="icon" className="rounded-full shadow-sm hover:border-chart-3/40 transition-colors">
              <Link href={selectedMeeting?.group ? `/group/${selectedMeeting.group}/meetings` : "/home"}>
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {selectedMeeting?.title || "Session"}
                </h1>
                {getStatusBadge(selectedMeeting?.status || "")}
              </div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                {scheduledStart}
              </p>
            </div>
          </div>
          
          <div className="relative z-10">
            {getActionButton()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Details & Agenda */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Session Info Bento */}
            <div className="rounded-[2rem] border border-border/80 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <LayoutDashboard className="w-5 h-5 text-chart-3" />
                <h2 className="text-xl font-bold tracking-tight text-foreground">Session Overview</h2>
              </div>
              
              {selectedMeeting?.description && (
                <p className="text-sm text-foreground/80 leading-relaxed mb-6 bg-muted/30 p-4 rounded-2xl border border-border/50">
                  {selectedMeeting.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-card/50 border border-border/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Host Identity</p>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-chart-4" />
                    {selectedMeeting?.host_email}
                  </p>
                </div>
                <div className="rounded-2xl bg-card/50 border border-border/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Execution Time</p>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-chart-3" />
                    {selectedMeeting?.actual_start ? new Date(selectedMeeting.actual_start).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' }) : "Pending Initiation"}
                  </p>
                </div>
              </div>
            </div>

            {/* Agenda Bento */}
            <div className="rounded-[2rem] border border-border/80 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Formal Agenda</h2>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Structured points of discussion</p>
                </div>
                
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-full shadow-sm font-bold border-border/80 hover:bg-chart-3/10 hover:text-chart-3 transition-colors">
                        <Download className="w-4 h-4 mr-1.5" /> Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={handleExportAgendaWord} className="font-medium cursor-pointer">
                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                        Export as Word (.doc)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportAgendaPdf} className="font-medium cursor-pointer">
                        <FileText className="w-4 h-4 mr-2 text-red-500" />
                        Export as PDF (.pdf)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {canCreateAgenda && (
                    <Button
                      onClick={() => setShowAgendaForm(!showAgendaForm)}
                      size="sm"
                      className="rounded-full bg-chart-3 hover:bg-chart-2 text-primary-foreground font-bold shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Point
                    </Button>
                  )}
                </div>
              </div>

              {/* Add Agenda Form */}
              {showAgendaForm && canCreateAgenda && (
                <form onSubmit={handleAgendaAdd} className="mb-6 p-5 bg-card border border-border rounded-2xl shadow-sm space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-1.5 block">Title</label>
                    <input
                      value={agendaTitle}
                      onChange={(e) => setAgendaTitle(e.target.value)}
                      placeholder="E.g., Review weekly deposits"
                      className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-chart-3 focus:ring-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-1.5 block">Description</label>
                    <textarea
                      value={agendaDescription}
                      onChange={(e) => setAgendaDescription(e.target.value)}
                      placeholder="Optional context for this agenda point"
                      className="w-full min-h-[80px] rounded-xl border border-input bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-chart-3 focus:ring-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" className="rounded-xl font-bold" onClick={() => setShowAgendaForm(false)}>Cancel</Button>
                    <Button type="submit" className="rounded-xl bg-chart-4 hover:bg-chart-4/90 font-bold text-white shadow-sm">Save Point</Button>
                  </div>
                </form>
              )}

              {/* Agenda Items List */}
              <div className="space-y-3">
                {selectedMeeting?.agenda_items?.length === 0 ? (
                  <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed border-border/60">
                    <p className="text-sm font-medium text-muted-foreground">The agenda is currently empty.</p>
                  </div>
                ) : (
                  selectedMeeting?.agenda_items?.map((item, index) => (
                    <div key={item.id} className="group flex items-start gap-4 p-4 bg-card/60 hover:bg-card border border-border/50 hover:border-chart-3/30 rounded-2xl transition-all shadow-sm">
                      <div className="shrink-0 w-8 h-8 bg-chart-3/15 text-chart-3 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-chart-3 transition-colors">{item.title}</h3>
                        {item.description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground/90">{item.description}</p>}
                        <span className="mt-2 inline-block px-2 py-0.5 rounded bg-muted text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                          {item.allocated_minutes} MIN ALLOCATED
                        </span>
                      </div>
                      {canCreateAgenda && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleAgendaDelete(item.id)}
                          className="h-8 w-8 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-full shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Official Minutes Bento - Only visible if ended */}
            {(selectedMeeting?.status === "ended") && (
              <div className="rounded-[2rem] border border-border/80 bg-card/40 backdrop-blur-sm p-6 md:p-8 shadow-sm">
                 <AgendaMinutesHistory
                  meetingId={meetingId!}
                  agendaItems={selectedMeeting?.agenda_items || []}
                  isHost={isLeader} // Use isLeader so secretary can edit minutes
                  meetingTitle={selectedMeeting?.title}
                />
              </div>
            )}
          </div>

          {/* Right Column - Attendance Panel */}
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 shadow-sm sticky top-6">
              <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Attendance</h2>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Verified session roster</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-chart-4/15 text-chart-4 px-3 py-1 rounded-full text-xs font-extrabold">
                    {attendanceHistory.length}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-full shadow-sm hover:bg-chart-3/10 hover:text-chart-3">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={handleExportAttendanceWord} className="font-medium cursor-pointer">
                        <FileText className="w-4 h-4 mr-2 text-blue-500" /> Word (.doc)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportAttendanceExcel} className="font-medium cursor-pointer">
                        <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" /> Excel (.xlsx)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {attendanceHistory.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No participants recorded.</p>
                  </div>
                ) : (
                  attendanceHistory.map((item) => (
                    <div key={item.id} className="border border-border/60 bg-background/50 rounded-2xl p-4 hover:border-chart-3/30 transition-colors">
                      <div className="mb-2">
                        <p className="text-sm font-bold text-foreground truncate">{item.email}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${item.isVerifiedMember ? "bg-chart-4/15 text-chart-4" : "bg-muted text-muted-foreground"}`}>
                            {item.isVerifiedMember ? "Member" : "Guest"}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                            item.status === "present" ? "bg-green-500/15 text-green-600" :
                            item.status === "late" ? "bg-chart-2/15 text-chart-2" :
                            item.status === "left_early" ? "bg-chart-3/15 text-chart-3" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Joined</p>
                          <p className="font-medium text-foreground">{item.joinedAt ? new Date(item.joinedAt).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Duration</p>
                          <p className="font-medium text-foreground">{item.totalDurationMinutes} min</p>
                        </div>
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
  )
}
