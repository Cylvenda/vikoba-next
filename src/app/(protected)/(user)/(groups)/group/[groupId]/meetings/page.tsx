"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TimePicker } from "@/components/ui/time-picker"
import { Calendar, Play, CalendarPlus2, Clock, CheckCircle2, ShieldAlert, History, CalendarDays } from "lucide-react"
import { useGroupStore } from "@/store/group/groupUser.store"
import { useMeetingStore } from "@/store/meeting/meeting.store"
import { useAuthUserStore } from "@/store/auth/userAuth.store"
import { toast } from "react-toastify"
import { getMeetingDetailHref, getMeetingSessionHref } from "@/lib/meeting-routes"
import Link from "next/link"

export default function GroupMeetingsPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params?.groupId) ? params.groupId[0] : params?.groupId
  const router = useRouter()
  
  const { user } = useAuthUserStore()
  const { selectedGroup, selectedGroupMembers, fetchGroupById, fetchSelectedGroupMembers } = useGroupStore()
  const { meetings, loading, fetchMeetings, createMeeting, createInstantMeeting } = useMeetingStore()

  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isInstantOpen, setIsInstantOpen] = useState(false)
  
  // Meeting Form States
  const [meetingTitle, setMeetingTitle] = useState("")
  const [meetingDescription, setMeetingDescription] = useState("")
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(undefined)
  const [meetingStartTime, setMeetingStartTime] = useState("")
  const [meetingEndTime, setMeetingEndTime] = useState("")
  const [instantTitle, setInstantTitle] = useState("")
  const [instantDescription, setInstantDescription] = useState("")

  useEffect(() => {
    if (!groupId) return

    void fetchMeetings()

    if (!selectedGroup || selectedGroup.id !== groupId) {
      void fetchGroupById(groupId)
    }

    void fetchSelectedGroupMembers(groupId)
  }, [groupId, selectedGroup, fetchGroupById, fetchMeetings, fetchSelectedGroupMembers])

  // ==========================================
  // Role-Based Access Control
  // ==========================================
  const currentUserMembership = useMemo(() => {
    return selectedGroupMembers.find(member => member.user_id === user?.uuid);
  }, [selectedGroupMembers, user]);

  const currentUserRole = currentUserMembership?.role;
  const isLeader =
    (currentUserRole === "CHAIRPERSON" || currentUserRole === "SECRETARY") &&
    currentUserMembership?.is_verified &&
    currentUserMembership?.is_active;

  // ==========================================
  // Backend Dashboard Data Computations
  // ==========================================
  const groupMeetings = useMemo(() => {
    return meetings.filter((meeting) => meeting.group === groupId)
  }, [meetings, groupId]);

  const upcomingMeetings = useMemo(() => {
    return groupMeetings.filter(m => m.status === 'scheduled');
  }, [groupMeetings]);

  const concludedMeetings = useMemo(() => {
    return groupMeetings.filter(m => m.status === 'ended');
  }, [groupMeetings]);

  const nextMeeting = useMemo(() => {
    const ongoing = groupMeetings.find(m => m.status === 'ongoing');
    if (ongoing) return ongoing;
    
    const scheduled = [...upcomingMeetings].sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
    return scheduled.length > 0 ? scheduled[0] : null;
  }, [groupMeetings, upcomingMeetings]);

  // ==========================================
  // Form Handlers
  // ==========================================
  const handleScheduleMeeting = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedGroup?.id) {
         toast.error("No group selected.")
         return
    }

    if (!meetingDate || !meetingStartTime) {
         toast.error("Date and start time are required.")
         return
    }

    const dateStr = meetingDate.toISOString().split("T")[0]
    const startDateTime = new Date(`${dateStr}T${meetingStartTime}`).toISOString()
    const endDateTime = meetingEndTime
         ? new Date(`${dateStr}T${meetingEndTime}`).toISOString()
         : undefined

    const result = await createMeeting({
         title: meetingTitle.trim(),
         description: meetingDescription.trim(),
         group: selectedGroup.id,
         scheduled_start: startDateTime,
         scheduled_end: endDateTime,
    })

    if (result.success) {
         toast.success(result.message)
         setMeetingTitle("")
         setMeetingDescription("")
         setMeetingDate(undefined)
         setMeetingStartTime("")
         setMeetingEndTime("")
         setIsScheduleOpen(false)
         return
    }

    toast.error(result.message)
  }

  const handleInstantMeeting = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedGroup?.id) {
         toast.error("No group selected.")
         return
    }

    const result = await createInstantMeeting({
         title: instantTitle.trim() || `Instant Meeting - ${selectedGroup.name}`,
         description: instantDescription.trim() || undefined,
         group: selectedGroup.id,
    })

    if (result.success && result.meeting) {
         toast.success(result.message)
         setInstantTitle("")
         setInstantDescription("")
         setIsInstantOpen(false)
         router.push(getMeetingSessionHref(result.meeting.id, result.meeting.group))
         return
    }

    toast.error(result.message)
  }

  // ==========================================
  // Rendering logic
  // ==========================================
  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <Card className="border-none bg-card shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading group meetings dashboard...
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full p-4 md:p-6 lg:p-8 space-y-8">
        <div className="mx-auto w-full max-w-screen-3xl">
          
          {/* HEADER ROW */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-foreground">
                <CalendarDays className="h-8 w-8 text-chart-3" />
                Meeting Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Virtual workspace sessions for <span className="font-semibold text-foreground">{selectedGroup.name}</span>
              </p>
            </div>
            {isLeader && (
              <div className="flex flex-wrap gap-3">
                <Button className="bg-chart-4 hover:bg-chart-4/90 text-white rounded-full shadow-md font-medium" onClick={() => setIsInstantOpen(true)} disabled={!selectedGroup?.id}>
                  <Play className="mr-2 h-4 w-4" /> Start Instant Session
                </Button>
                <Button className="bg-chart-3 hover:bg-chart-2 text-primary-foreground rounded-full shadow-md font-medium" onClick={() => setIsScheduleOpen(true)}>
                  <CalendarPlus2 className="mr-2 h-4 w-4" /> Schedule Session
                </Button>
              </div>
            )}
          </div>

          {/* OVERVIEW METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Access Role</span>
                <ShieldAlert className="w-4 h-4 text-chart-3" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {currentUserRole ? currentUserRole.replace('_', ' ') : 'MEMBER'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Your permission level</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upcoming</span>
                <Clock className="w-4 h-4 text-chart-4" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-chart-4">{upcomingMeetings.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Scheduled sessions</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Concluded</span>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-foreground">{concludedMeetings.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Successfully ended</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Ledger</span>
                <History className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-foreground">{groupMeetings.length}</p>
                <p className="text-xs text-muted-foreground mt-1">All historical meetings</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* NEXT HIGHLIGHT CARD */}
            <div className="lg:col-span-1">
              <Card className="rounded-md border border-border bg-card shadow-sm p-6 h-full relative overflow-hidden">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-primary mb-6 relative z-10">Next Up</h3>
                
                {nextMeeting ? (
                  <div className="relative z-10 flex flex-col h-[85%] justify-between">
                    <div>
                      {nextMeeting.status === 'ongoing' && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500 mb-4 shadow-sm backdrop-blur-md animate-pulse">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          LIVE NOW
                        </div>
                      )}
                      <h4 className="text-2xl font-bold text-foreground leading-tight">{nextMeeting.title}</h4>
                      <p className="mt-2 text-sm text-muted-foreground font-medium">
                        {new Date(nextMeeting.scheduled_start).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                      {nextMeeting.description && (
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground/80 line-clamp-3">
                          {nextMeeting.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-8 flex flex-col gap-2">
                      <Button asChild className="w-full bg-chart-3 hover:bg-chart-2 rounded-xl text-primary-foreground font-bold shadow-md">
                        <Link href={getMeetingSessionHref(nextMeeting.id, nextMeeting.group)}>
                          {nextMeeting.status === "ongoing" ? "Join Session" : "Open Workspace"}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full rounded-xl border-chart-3/30 hover:bg-chart-3/10 bg-card/50 text-chart-4 font-semibold shadow-sm">
                        <Link href={getMeetingDetailHref(nextMeeting.id, nextMeeting.group)}>View Ledger Details</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center text-center h-[70%] opacity-60">
                    <Calendar className="h-10 w-10 mb-3 text-chart-4/50" />
                    <p className="font-semibold text-foreground">No upcoming meetings.</p>
                    <p className="text-xs mt-1 text-muted-foreground">The schedule is currently empty.</p>
                  </div>
                )}
              </Card>
            </div>

            {/* TIMELINE LIST */}
            <div className="lg:col-span-2">
              <Card className="rounded-md border border-border/80 bg-card/40 shadow-sm backdrop-blur-md p-6 h-full">
                <div className="flex justify-between items-end mb-6 border-b border-border/50 pb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-foreground tracking-tight">Meeting Timeline</h3>
                    <p className="text-xs text-muted-foreground mt-1">All synchronized banking sessions</p>
                  </div>
                </div>

                {loading && groupMeetings.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground font-medium">Loading ledger data...</div>
                ) : groupMeetings.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="font-semibold text-foreground">No meetings exist in this group yet.</p>
                    {isLeader && <p className="text-sm mt-1">Click schedule to launch your first session.</p>}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {groupMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/50 p-4 transition-all duration-300 hover:border-chart-3/30 hover:bg-chart-3/5 hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                            meeting.status === 'ongoing' ? 'bg-red-500 animate-pulse' :
                            meeting.status === 'scheduled' ? 'bg-chart-4' :
                            meeting.status === 'cancelled' ? 'bg-muted-foreground' : 'bg-green-500'
                          }`} />
                          <div>
                            <h4 className="text-base font-bold text-foreground group-hover:text-chart-3 transition-colors">{meeting.title}</h4>
                            <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock size={12}/> {new Date(meeting.scheduled_start).toLocaleString()}</span>
                              <span className="uppercase tracking-wider px-2 py-0.5 rounded-sm bg-muted/60 border border-border/50">{meeting.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {(meeting.status === "scheduled" || meeting.status === "ongoing") && (
                            <Button asChild size="sm" className="flex-1 sm:flex-none rounded-lg bg-chart-3 text-primary-foreground hover:bg-chart-2 font-semibold shadow-sm">
                              <Link href={getMeetingSessionHref(meeting.id, meeting.group)}>
                                {meeting.status === "ongoing" ? "Join" : "Open"}
                              </Link>
                            </Button>
                          )}
                          <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none rounded-lg border-border hover:border-chart-3/30 hover:bg-chart-3/10 shadow-sm transition-all">
                            <Link href={getMeetingDetailHref(meeting.id, meeting.group)}>Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* INSTANT MEETING MODAL */}
      {/* ==================================================== */}
      <Dialog open={isInstantOpen && isLeader} onOpenChange={(open) => { if (!open) setIsInstantOpen(false) }}>
        <DialogContent className="sm:max-w-xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Launch Instant Session</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Start a live VICOBA meeting now. Members will receive instant email notifications.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleInstantMeeting}>
            <div>
              <label htmlFor="instant-title" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">Title</label>
              <Input
                id="instant-title"
                type="text"
                value={instantTitle}
                onChange={(event) => setInstantTitle(event.target.value)}
                placeholder={`Instant Session - ${selectedGroup?.name || "Group"}`}
                className="rounded-md"
              />
            </div>

            <div>
              <label htmlFor="instant-description" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">Agenda / Context</label>
              <Textarea
                id="instant-description"
                value={instantDescription}
                onChange={(event) => setInstantDescription(event.target.value)}
                className="min-h-24 rounded-md"
                placeholder="Quick context for members joining now"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsInstantOpen(false)} disabled={loading} className="rounded-md font-bold">
                Cancel
              </Button>
              <Button type="submit" className="rounded-md font-bold shadow-md" disabled={loading}>
                {loading ? "Launching..." : "Start Now"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* SCHEDULE MEETING MODAL */}
      {/* ==================================================== */}
      <Dialog open={isScheduleOpen && isLeader} onOpenChange={(open) => { if (!open) setIsScheduleOpen(false) }}>
        <DialogContent className="sm:max-w-xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Schedule Session</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Define the date and time for the next formal gathering.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-4 space-y-4" onSubmit={handleScheduleMeeting}>
            <div>
              <label htmlFor="meeting-title" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">Title</label>
              <Input
                id="meeting-title"
                type="text"
                value={meetingTitle}
                onChange={(event) => setMeetingTitle(event.target.value)}
                placeholder="Weekly Ledger Reconciliation"
                className="rounded-md"
                required
              />
            </div>

            <div>
              <label htmlFor="meeting-description" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">Description</label>
              <Textarea
                id="meeting-description"
                value={meetingDescription}
                onChange={(event) => setMeetingDescription(event.target.value)}
                className="min-h-24 rounded-md"
                placeholder="Agenda summary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">Date</label>
              <DatePicker
                value={meetingDate}
                onChange={setMeetingDate}
                placeholder="Select meeting date"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">Start Time</label>
                <TimePicker
                  value={meetingStartTime}
                  onChange={setMeetingStartTime}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">End Time (Optional)</label>
                <TimePicker
                  value={meetingEndTime}
                  onChange={setMeetingEndTime}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsScheduleOpen(false)} disabled={loading} className="rounded-md font-bold">
                Cancel
              </Button>
              <Button type="submit" className="rounded-md font-bold shadow-md" disabled={loading}>
                {loading ? "Saving..." : "Schedule Session"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
