"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Play, CalendarPlus2 } from "lucide-react"
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
  
  const { selectedGroup, fetchGroupById, fetchSelectedGroupMembers } = useGroupStore()
  const { meetings, loading, fetchMeetings, createMeeting, createInstantMeeting } = useMeetingStore()

  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isInstantOpen, setIsInstantOpen] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState("")
  const [meetingDescription, setMeetingDescription] = useState("")
  const [meetingDate, setMeetingDate] = useState("")
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

  const isHost = user?.email === selectedGroup?.created_by
  const groupMeetings = meetings.filter((meeting) => meeting.group === groupId)

  const handleScheduleMeeting = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedGroup?.id) {
         toast.error("No group selected.")
         return
    }

    // Validate required fields
    if (!meetingDate || !meetingStartTime) {
         toast.error("Date and start time are required.")
         return
    }

    // Combine date and time to create datetime strings
    const startDateTime = new Date(`${meetingDate}T${meetingStartTime}`).toISOString()
    const endDateTime = meetingEndTime
         ? new Date(`${meetingDate}T${meetingEndTime}`).toISOString()
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
         setMeetingDate("")
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

  if (!selectedGroup) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <Card className="border-none bg-card shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading group...
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-screen-2xl">
          <Card className="border-none bg-card shadow-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-3xl">
                    <Calendar className="h-8 w-8" />
                    Group Meetings
                  </CardTitle>
                  <CardDescription>
                    Meetings and live sessions for {selectedGroup.name}
                  </CardDescription>
                </div>
                {isHost && (
                  <div className="flex flex-wrap gap-2">
                    <Button className="bg-chart-2" onClick={() => setIsInstantOpen(true)} disabled={!selectedGroup?.id}>
                      <Play className="mr-2 h-4 w-4" /> Start Instant Meeting
                    </Button>
                    <Button className="bg-chart-3" onClick={() => setIsScheduleOpen(true)}>
                      <CalendarPlus2 className="mr-2 h-4 w-4" /> Schedule Meeting
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading && groupMeetings.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Loading meetings...</div>
              ) : groupMeetings.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No meetings scheduled yet for this group.</p>
                  {isHost && <p className="text-sm">Create one to get started.</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="rounded-lg border p-4 transition hover:bg-accent"
                    >
                      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-medium">{meeting.title}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Date(meeting.scheduled_start).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">Status: {meeting.status}</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                          <Button asChild size="sm" variant="outline" className="flex-1 md:flex-none">
                            <Link href={getMeetingDetailHref(meeting.id, meeting.group)}>View Details</Link>
                          </Button>
                          {(meeting.status === "scheduled" || meeting.status === "ongoing") ? (
                            <Button asChild size="sm" className="flex-1 md:flex-none bg-chart-3">
                              <Link href={getMeetingSessionHref(meeting.id, meeting.group)}>
                                {meeting.status === "ongoing" ? "Join Session" : "Open Session"}
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instant Meeting Modal */}
      {isInstantOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-card p-5 shadow-xl">
            <h2 className="text-lg font-semibold">Start Instant Meeting</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a live meeting now for {selectedGroup?.name}. Members will receive an email to join immediately.
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleInstantMeeting}>
              <div>
                <label htmlFor="instant-title" className="mb-1 block text-sm font-medium">Title</label>
                <input
                  id="instant-title"
                  type="text"
                  value={instantTitle}
                  onChange={(event) => setInstantTitle(event.target.value)}
                  placeholder={`Instant Meeting - ${selectedGroup?.name || "Group"}`}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-chart-3"
                />
              </div>

              <div>
                <label htmlFor="instant-description" className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  id="instant-description"
                  value={instantDescription}
                  onChange={(event) => setInstantDescription(event.target.value)}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-chart-3"
                  placeholder="Quick context for members joining now"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInstantOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-chart-2" disabled={loading}>
                  {loading ? "Starting..." : "Start Now"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-card p-5 shadow-xl">
            <h2 className="text-lg font-semibold">Schedule Meeting</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a meeting for {selectedGroup?.name}.
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleScheduleMeeting}>
              <div>
                <label htmlFor="meeting-title" className="mb-1 block text-sm font-medium">Title</label>
                <input
                  id="meeting-title"
                  type="text"
                  value={meetingTitle}
                  onChange={(event) => setMeetingTitle(event.target.value)}
                  placeholder="Weekly planning"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-chart-3"
                  required
                />
              </div>

              <div>
                <label htmlFor="meeting-description" className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  id="meeting-description"
                  value={meetingDescription}
                  onChange={(event) => setMeetingDescription(event.target.value)}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-chart-3"
                  placeholder="Agenda summary"
                />
              </div>

              <div>
                <label htmlFor="meeting-date" className="mb-1 block text-sm font-medium">Meeting Date</label>
                <input
                  id="meeting-date"
                  type="date"
                  value={meetingDate}
                  onChange={(event) => setMeetingDate(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-chart-3"
                  required
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor="meeting-start-time" className="mb-1 block text-sm font-medium">Start Time</label>
                  <input
                    id="meeting-start-time"
                    type="time"
                    value={meetingStartTime}
                    onChange={(event) => setMeetingStartTime(event.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-chart-3"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="meeting-end-time" className="mb-1 block text-sm font-medium">End Time (Optional)</label>
                  <input
                    id="meeting-end-time"
                    type="time"
                    value={meetingEndTime}
                    onChange={(event) => setMeetingEndTime(event.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-chart-3"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsScheduleOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-chart-3" disabled={loading}>
                  {loading ? "Saving..." : "Schedule Meeting"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
