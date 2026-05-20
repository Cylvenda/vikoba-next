"use client"

import Link from 'next/link'
import { Users, Play, CalendarPlus2, ArrowLeft, Copy } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { DatePicker } from '../ui/date-picker'
import { useGroupStore } from '@/store/group/groupUser.store'
import { formatUTCDate } from '@/hooks/formatted-date'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useMeetingStore } from '@/store/meeting/meeting.store'
import { useRouter } from 'next/navigation'
import { useAuthUserStore } from '@/store/auth/userAuth.store'
import { getMeetingSessionHref } from '@/lib/meeting-routes'

export default function GroupHeader() {
     const [isInviteOpen, setIsInviteOpen] = useState(false)
     const [isScheduleOpen, setIsScheduleOpen] = useState(false)
     const [isInstantOpen, setIsInstantOpen] = useState(false)
     const [inviteEmail, setInviteEmail] = useState("")
     const [inviteMessage, setInviteMessage] = useState("")
     
     const [meetingTitle, setMeetingTitle] = useState("")
     const [meetingDescription, setMeetingDescription] = useState("")
     const [meetingDate, setMeetingDate] = useState<Date | undefined>(undefined)
     const [meetingStartTime, setMeetingStartTime] = useState("")
     const [meetingEndTime, setMeetingEndTime] = useState("")
     
     const [instantTitle, setInstantTitle] = useState("")
     const [instantDescription, setInstantDescription] = useState("")
     
     const router = useRouter()
     const { user } = useAuthUserStore()

     const { selectedGroup, invitationLoading, sendGroupInvitation, selectedGroupMembers } = useGroupStore()
     const { createMeeting, createInstantMeeting, loading } = useMeetingStore()

     const handleCopyCode = () => {
          if (selectedGroup?.join_code) {
               navigator.clipboard.writeText(selectedGroup.join_code)
               toast.success("Join code copied to clipboard!")
          }
     }

     // ==========================================
     // Role-Based Access Control
     // ==========================================
     const currentUserMembership = selectedGroupMembers.find((m) => m.user_id === user?.uuid)
     const isLeader = (currentUserMembership?.role === "CHAIRPERSON" || currentUserMembership?.role === "SECRETARY") && currentUserMembership?.is_verified && currentUserMembership?.is_active

     const memberCount = selectedGroup?.members_count ?? 0

     const handleInviteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          const trimmedEmail = inviteEmail.trim().toLowerCase()

          if (!selectedGroup?.id) {
               toast.error("No group selected.")
               return
          }

          if (!trimmedEmail) {
               toast.error("Email is required.")
               return
          }

          const result = await sendGroupInvitation(
               selectedGroup.id,
               trimmedEmail,
               inviteMessage.trim() || undefined
          )

          if (result.success) {
               toast.success(result.message)
               setInviteEmail("")
               setInviteMessage("")
               setIsInviteOpen(false)
               return
          }

          toast.error(result.message)
     }

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

          const startDateTime = new Date(`${meetingDate.toISOString().split('T')[0]}T${meetingStartTime}`).toISOString()
          const endDateTime = meetingEndTime
               ? new Date(`${meetingDate.toISOString().split('T')[0]}T${meetingEndTime}`).toISOString()
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
               title: instantTitle.trim() || `Instant Session - ${selectedGroup.name}`,
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

     return (
          <>
               <div className="flex flex-col justify-between rounded-md border border-border bg-card/60 backdrop-blur-md p-6 shadow-sm md:flex-row md:items-center relative overflow-hidden">
                    
                    <div className="flex items-center gap-4 relative z-10">
                         <Link href="/home">
                              <Button variant="outline" size="icon" className="rounded-full shadow-sm hover:border-chart-3/40 transition-colors">
                                   <ArrowLeft className="w-5 h-5 text-foreground" />
                              </Button>
                         </Link>
                         <div>
                              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{selectedGroup?.name}</h1>
                              <p className="text-sm font-medium text-muted-foreground mt-1">
                                   <span className="uppercase tracking-widest text-[10px] bg-muted px-2 py-0.5 rounded-full mr-2 border border-border/60">
                                        {selectedGroup?.is_private ? "Private" : "Public"} Group
                                   </span>
                                   {selectedGroup?.join_code && (
                                        <button 
                                             onClick={handleCopyCode}
                                             className="uppercase tracking-widest text-[10px] bg-chart-1/10 text-chart-1 px-2 py-0.5 rounded-full mr-2 border border-chart-1/30 hover:bg-chart-1/20 transition-colors flex items-center gap-1.5 inline-flex"
                                             title="Click to copy join code"
                                        >
                                             Join Code: <span className="font-bold">{selectedGroup.join_code}</span>
                                             <Copy className="w-3 h-3" />
                                        </button>
                                   )}
                                   {memberCount} Members • Created {formatUTCDate(selectedGroup?.created_at || "")}
                              </p>
                         </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mt-5 md:mt-0 relative z-10">
                         <Button
                              variant="outline"
                              className="rounded-full shadow-sm font-bold border-border/80 hover:bg-chart-3/10 hover:text-chart-3 transition-colors"
                              onClick={() => setIsInviteOpen(true)}
                              disabled={!selectedGroup?.id}
                         >
                              <Users className="w-4 h-4 mr-2" /> Invite Members
                         </Button>
                         
                         {isLeader && (
                              <>
                                   <Button className="bg-chart-4 hover:bg-chart-4/90 text-white rounded-full font-bold shadow-md" onClick={() => setIsInstantOpen(true)} disabled={!selectedGroup?.id}>
                                        <Play className="w-4 h-4 mr-2" /> Start Instant Session
                                   </Button>
                                   <Button className="bg-chart-3 hover:bg-chart-2 text-primary-foreground rounded-full font-bold shadow-md" onClick={() => setIsScheduleOpen(true)} >
                                        <CalendarPlus2 className="w-4 h-4 mr-2" /> Schedule Meeting
                                   </Button>
                              </>
                         )}
                    </div>
               </div>

               {/* ======================================= */}
               {/* MODALS */}
               {/* ======================================= */}
               {isInviteOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                         <div className="w-full max-w-md rounded-md bg-card border border-border p-6 shadow-2xl">
                              <h2 className="text-xl font-extrabold">Invite New Member</h2>
                              <p className="mt-1 text-sm text-muted-foreground">
                                   Send an invitation email to join {selectedGroup?.name}.
                              </p>

                              <form className="mt-6 space-y-4" onSubmit={handleInviteSubmit}>
                                   <div>
                                        <label htmlFor="invite-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">Email Address</label>
                                        <Input
                                             id="invite-email"
                                             type="email"
                                             value={inviteEmail}
                                             onChange={(event) => setInviteEmail(event.target.value)}
                                             placeholder="member@example.com"
                                             className="rounded-md"
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label htmlFor="invite-message" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">Message (optional)</label>
                                        <Textarea
                                             id="invite-message"
                                             value={inviteMessage}
                                             onChange={(event) => setInviteMessage(event.target.value)}
                                             placeholder="Welcome to our group."
                                             className="min-h-24 rounded-md"
                                        />
                                   </div>

                                   <div className="flex items-center justify-end gap-3 pt-2">
                                        <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)} disabled={invitationLoading} className="rounded-md font-bold">
                                             Cancel
                                        </Button>
                                        <Button type="submit" className="rounded-md shadow-md font-bold" disabled={invitationLoading}>
                                             {invitationLoading ? "Sending..." : "Send Invite"}
                                        </Button>
                                   </div>
                              </form>
                         </div>
                    </div>
               )}

               {isInstantOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                         <div className="w-full max-w-xl rounded-md bg-card border border-border p-6 shadow-2xl">
                              <h2 className="text-xl font-extrabold">Start Instant Session</h2>
                              <p className="mt-1 text-sm text-muted-foreground">
                                   Start a live meeting now for {selectedGroup?.name}. Members will receive an email to join immediately.
                              </p>

                              <form className="mt-6 space-y-4" onSubmit={handleInstantMeeting}>
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
                                        <Button type="submit" className="rounded-md shadow-md font-bold" disabled={loading}>
                                             {loading ? "Starting..." : "Start Now"}
                                        </Button>
                                   </div>
                              </form>
                         </div>
                    </div>
               )}

               {isScheduleOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                         <div className="w-full max-w-xl rounded-md bg-card border border-border p-6 shadow-2xl">
                              <h2 className="text-xl font-extrabold">Schedule Session</h2>
                              <p className="mt-1 text-sm text-muted-foreground">
                                   Define the date and time for the next formal gathering.
                              </p>

                              <form className="mt-6 space-y-4" onSubmit={handleScheduleMeeting}>
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
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">Meeting Date</label>
                                        <DatePicker
                                             value={meetingDate}
                                             onChange={setMeetingDate}
                                             placeholder="Select meeting date"
                                        />
                                   </div>

                                   <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                             <label htmlFor="meeting-start-time" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">Start Time</label>
                                             <Input
                                                  id="meeting-start-time"
                                                  type="time"
                                                  value={meetingStartTime}
                                                  onChange={(event) => setMeetingStartTime(event.target.value)}
                                                  className="rounded-md"
                                                  required
                                             />
                                        </div>

                                        <div>
                                             <label htmlFor="meeting-end-time" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">End Time (Optional)</label>
                                             <Input
                                                  id="meeting-end-time"
                                                  type="time"
                                                  value={meetingEndTime}
                                                  onChange={(event) => setMeetingEndTime(event.target.value)}
                                                  className="rounded-md"
                                             />
                                        </div>
                                   </div>

                                   <div className="flex items-center justify-end gap-3 pt-2">
                                        <Button type="button" variant="ghost" onClick={() => setIsScheduleOpen(false)} disabled={loading} className="rounded-md font-bold">
                                             Cancel
                                        </Button>
                                        <Button type="submit" className="rounded-md shadow-md font-bold" disabled={loading}>
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
