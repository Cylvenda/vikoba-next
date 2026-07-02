"use client"

import Link from 'next/link'
import { Users, Play, CalendarPlus2, ArrowLeft, Copy } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { DatePicker } from '../ui/date-picker'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { TimePicker } from '../ui/time-picker'
import { useGroupStore } from '@/store/group/groupUser.store'
import { formatUTCDate } from '@/hooks/formatted-date'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useMeetingStore } from '@/store/meeting/meeting.store'
import { useRouter } from 'next/navigation'
import { useAuthUserStore } from '@/store/auth/userAuth.store'
import { getMeetingSessionHref } from '@/lib/meeting-routes'
import { useLanguage } from '@/components/language/language-provider'

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
     const { language } = useLanguage()
     const tt = (en: string, sw: string) => language === "sw" ? sw : en

     const { selectedGroup, invitationLoading, sendGroupInvitation, selectedGroupMembers } = useGroupStore()
     const { createMeeting, createInstantMeeting, loading } = useMeetingStore()

     const handleCopyCode = () => {
          if (selectedGroup?.join_code) {
               navigator.clipboard.writeText(selectedGroup.join_code)
               toast.success(tt("Join code copied to clipboard!", "Msimbo wa kujiunga umenakiliwa!"))
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
               toast.error(tt("No group selected.", "Hakuna kikundi kilichochaguliwa."))
               return
          }

          if (!trimmedEmail) {
               toast.error(tt("Email is required.", "Barua pepe inahitajika."))
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
               toast.error(tt("No group selected.", "Hakuna kikundi kilichochaguliwa."))
               return
          }

          if (!meetingDate || !meetingStartTime) {
               toast.error(tt("Date and start time are required.", "Tarehe na muda wa kuanza vinahitajika."))
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
               toast.error(tt("No group selected.", "Hakuna kikundi kilichochaguliwa."))
               return
          }

          const result = await createInstantMeeting({
               title: instantTitle.trim() || `${tt("Instant Session", "Kikao cha Papo Hapo")} - ${selectedGroup.name}`,
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
                                        {selectedGroup?.is_private ? tt("Private", "Faragha") : tt("Public", "Umma")} {tt("Group", "Kikundi")}
                                   </span>
                                   {selectedGroup?.join_code && (
                                        <button 
                                             onClick={handleCopyCode}
                                             className="uppercase tracking-widest text-[10px] bg-green-300  px-2 py-0.5 cursor-pointer rounded-full mr-2 border border-chart-1/30 hover:bg-chart-1/20 transition-colors items-center gap-1.5 inline-flex"
                                             title={tt("Click to copy join code", "Bofya kunakili msimbo")}
                                        >
                                             {tt("Join Code:", "Msimbo:")} <span className="font-bold">{selectedGroup.join_code}</span>
                                             <Copy className="w-3 h-3" />
                                        </button>
                                   )}
                                   {memberCount} {tt("Members", "Wanachama")} • {tt("Created", "Kimeundwa")} {formatUTCDate(selectedGroup?.created_at || "")}
                              </p>
                         </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mt-5 md:mt-0 relative z-10">
                         <Button
                              variant="outline"
                              className=" shadow-sm font-bold border-border/80 hover:bg-chart-3/10 hover:text-chart-3 transition-colors"
                              onClick={() => setIsInviteOpen(true)}
                              disabled={!selectedGroup?.id}
                         >
                              <Users className="w-4 h-4 mr-2" /> {tt("Invite Members", "Alika Wanachama")}
                         </Button>
                         
                         {isLeader && (
                              <>
                                   <Button className="bg-chart-4 hover:bg-chart-4/90 text-white font-bold shadow-md" onClick={() => setIsInstantOpen(true)} disabled={!selectedGroup?.id}>
                                        <Play className="w-4 h-4 mr-2" /> {tt("Start Instant Session", "Anzisha Kikao cha Papo Hapo")}
                                   </Button>
                                   <Button className="bg-chart-3 hover:bg-chart-2 text-primary-foreground font-bold shadow-md" onClick={() => setIsScheduleOpen(true)} >
                                        <CalendarPlus2 className="w-4 h-4 mr-2" /> {tt("Schedule Meeting", "Panga Kikao")}
                                   </Button>
                              </>
                         )}
                    </div>
               </div>

               {/* ======================================= */}
               {/* MODALS */}
               {/* ======================================= */}
               <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogContent className="sm:max-w-md p-6">
                         <DialogHeader>
                              <DialogTitle className="text-xl font-extrabold">{tt("Invite New Member", "Alika Mwanachama Mpya")}</DialogTitle>
                              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                                   {tt("Send an invitation email to join", "Tuma mwaliko wa barua pepe wa kujiunga na")} {selectedGroup?.name}.
                              </DialogDescription>
                         </DialogHeader>

                         <form className="mt-4 space-y-4" onSubmit={handleInviteSubmit}>
                              <div>
                                   <label htmlFor="invite-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">{tt("Email Address", "Anwani ya Barua Pepe")}</label>
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
                                   <label htmlFor="invite-message" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">{tt("Message (optional)", "Ujumbe (si lazima)")}</label>
                                   <Textarea
                                        id="invite-message"
                                        value={inviteMessage}
                                        onChange={(event) => setInviteMessage(event.target.value)}
                                        placeholder={tt("Welcome to our group.", "Karibu kwenye kikundi chetu.")}
                                        className="min-h-24 rounded-md"
                                   />
                              </div>

                              <div className="flex items-center justify-end gap-3 pt-2">
                                   <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)} disabled={invitationLoading} className="rounded-md font-bold">
                                        {tt("Cancel", "Ghairi")}
                                   </Button>
                                   <Button type="submit" className="rounded-md shadow-md font-bold" disabled={invitationLoading}>
                                        {invitationLoading ? tt("Sending...", "Inatuma...") : tt("Send Invite", "Tuma Mwaliko")}
                                   </Button>
                              </div>
                         </form>
                    </DialogContent>
               </Dialog>

               <Dialog open={isInstantOpen} onOpenChange={setIsInstantOpen}>
                    <DialogContent className="sm:max-w-xl p-6">
                         <DialogHeader>
                              <DialogTitle className="text-xl font-extrabold">{tt("Start Instant Session", "Anzisha Kikao cha Papo Hapo")}</DialogTitle>
                              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                                   {tt("Start a live meeting now for", "Anzisha kikao sasa kwa")} {selectedGroup?.name}. {tt("Members will receive an email to join immediately.", "Wanachama watapokea barua pepe ya kujiunga mara moja.")}
                              </DialogDescription>
                         </DialogHeader>

                         <form className="mt-4 space-y-4" onSubmit={handleInstantMeeting}>
                              <div>
                                   <label htmlFor="instant-title" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">{tt("Title", "Kichwa")}</label>
                                   <Input
                                        id="instant-title"
                                        type="text"
                                        value={instantTitle}
                                        onChange={(event) => setInstantTitle(event.target.value)}
                                        placeholder={`${tt("Instant Session", "Kikao cha Papo Hapo")} - ${selectedGroup?.name || tt("Group", "Kikundi")}`}
                                        className="rounded-md"
                                   />
                              </div>

                              <div>
                                   <label htmlFor="instant-description" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">{tt("Agenda / Context", "Ajenda / Muktadha")}</label>
                                   <Textarea
                                        id="instant-description"
                                        value={instantDescription}
                                        onChange={(event) => setInstantDescription(event.target.value)}
                                        className="min-h-24 rounded-md"
                                        placeholder={tt("Quick context for members joining now", "Maelezo mafupi kwa wanachama wanaojiunga sasa")}
                                   />
                              </div>

                              <div className="flex items-center justify-end gap-3 pt-2">
                                   <Button type="button" variant="ghost" onClick={() => setIsInstantOpen(false)} disabled={loading} className="rounded-md font-bold">
                                        {tt("Cancel", "Ghairi")}
                                   </Button>
                                   <Button type="submit" className="rounded-md shadow-md font-bold" disabled={loading}>
                                        {loading ? tt("Starting...", "Kinaanza...") : tt("Start Now", "Anzisha Sasa")}
                                   </Button>
                              </div>
                         </form>
                    </DialogContent>
               </Dialog>

               <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                    <DialogContent className="sm:max-w-xl p-6">
                         <DialogHeader>
                              <DialogTitle className="text-xl font-extrabold">{tt("Schedule Session", "Panga Kikao")}</DialogTitle>
                              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                                   {tt("Define the date and time for the next formal gathering.", "Weka tarehe na muda wa kikao rasmi kijacho.")}
                              </DialogDescription>
                         </DialogHeader>

                         <form className="mt-4 space-y-4" onSubmit={handleScheduleMeeting}>
                              <div>
                                   <label htmlFor="meeting-title" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">{tt("Title", "Kichwa")}</label>
                                   <Input
                                        id="meeting-title"
                                        type="text"
                                        value={meetingTitle}
                                        onChange={(event) => setMeetingTitle(event.target.value)}
                                        placeholder={tt("Weekly Ledger Reconciliation", "Upatanisho wa Rejista wa Wiki")}
                                        className="rounded-md"
                                        required
                                   />
                              </div>

                              <div>
                                   <label htmlFor="meeting-description" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">{tt("Description", "Maelezo")}</label>
                                   <Textarea
                                        id="meeting-description"
                                        value={meetingDescription}
                                        onChange={(event) => setMeetingDescription(event.target.value)}
                                        className="min-h-24 rounded-md"
                                        placeholder={tt("Agenda summary", "Muhtasari wa ajenda")}
                                   />
                              </div>

                              <div>
                                   <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">{tt("Meeting Date", "Tarehe ya Kikao")}</label>
                                   <DatePicker
                                        value={meetingDate}
                                        onChange={setMeetingDate}
                                        placeholder={tt("Select meeting date", "Chagua tarehe ya kikao")}
                                   />
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                   <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">{tt("Start Time", "Muda wa Kuanza")}</label>
                                        <TimePicker
                                             value={meetingStartTime}
                                             onChange={setMeetingStartTime}
                                        />
                                   </div>

                                   <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground">{tt("End Time (Optional)", "Muda wa Kumaliza (Si Lazima)")}</label>
                                        <TimePicker
                                             value={meetingEndTime}
                                             onChange={setMeetingEndTime}
                                        />
                                   </div>
                              </div>

                              <div className="flex items-center justify-end gap-3 pt-2">
                                   <Button type="button" variant="ghost" onClick={() => setIsScheduleOpen(false)} disabled={loading} className="rounded-md font-bold">
                                        {tt("Cancel", "Ghairi")}
                                   </Button>
                                   <Button type="submit" className="rounded-md shadow-md font-bold" disabled={loading}>
                                        {loading ? tt("Saving...", "Inahifadhi...") : tt("Schedule Meeting", "Panga Kikao")}
                                   </Button>
                              </div>
                         </form>
                    </DialogContent>
               </Dialog>
          </>
     )
}
