"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, CheckCircle, Circle, Play, Download, FileText, FileSpreadsheet, ChevronDown } from "lucide-react"
import { toast } from "react-toastify"
import { meetingServices } from "@/api/services/meeting.service"
import type { AgendaItem, AdditionalNote as HistoryAdditionalNote, AgendaMinuteNote as HistoryAgendaMinuteNote } from "@/store/meeting/meeting.types"

export interface AgendaMinuteNote {
  id: string
  agendaItemId: string
  agendaItemTitle: string
  agendaItemDescription?: string
  allocatedMinutes: number
  notes: string
  hostNotes: string
  status: "pending" | "ongoing" | "completed"
  startTime?: string
  endTime?: string
}

interface AgendaMinutesHistoryProps {
  meetingId?: string
  agendaItems: AgendaItem[]
  isHost?: boolean
  minuteNotes?: HistoryAgendaMinuteNote[]
  additionalNotes?: HistoryAdditionalNote[]
}

type AgendaMinuteNoteApi = {
  id: string
  agenda_item_id: string
  notes?: string | null
  host_notes?: string | null
  status?: "pending" | "ongoing" | "completed"
  start_time?: string | null
  end_time?: string | null
}

export function AgendaMinutesHistory({
  meetingId,
  agendaItems,
  isHost = false,
  minuteNotes: initialMinuteNotes,
  additionalNotes = [],
}: AgendaMinutesHistoryProps) {
  const [fetchedMinuteNotes, setFetchedMinuteNotes] = useState<AgendaMinuteNote[]>([])
  const [loading, setLoading] = useState(Boolean(meetingId && !initialMinuteNotes))

  const mappedInitialMinuteNotes = useMemo<AgendaMinuteNote[]>(
    () =>
      (initialMinuteNotes || []).map((note) => ({
        id: note.id,
        agendaItemId: note.agenda_item_id,
        agendaItemTitle: note.agenda_item_title,
        agendaItemDescription: note.agenda_item_description || undefined,
        allocatedMinutes: note.allocated_minutes || 0,
        notes: note.notes || "",
        hostNotes: note.host_notes || "",
        status: note.status || "pending",
        startTime: note.start_time || undefined,
        endTime: note.end_time || undefined,
      })),
    [initialMinuteNotes]
  )

  useEffect(() => {
    if (mappedInitialMinuteNotes.length > 0 || !meetingId) return

    const loadMinuteNotes = async () => {
      if (!meetingId) return

      try {
        setLoading(true)
        const response = await meetingServices.getAgendaMinuteNotes(meetingId)
        if (response.status >= 200 && response.status < 300 && response.data) {
          const notesWithDetails: AgendaMinuteNote[] = response.data.map((note: AgendaMinuteNoteApi) => {
            const agendaItem = agendaItems.find(item => item.id === note.agenda_item_id)
            return {
              id: note.id,
              agendaItemId: note.agenda_item_id,
              agendaItemTitle: agendaItem?.title || "Unknown Agenda Item",
              agendaItemDescription: agendaItem?.description,
              allocatedMinutes: agendaItem?.allocated_minutes || 0,
              notes: note.notes || "",
              hostNotes: note.host_notes || "",
              status: note.status || "pending",
              startTime: note.start_time || undefined,
              endTime: note.end_time || undefined
            }
          })
          setFetchedMinuteNotes(notesWithDetails)
        }
      } catch (error) {
        console.error("Failed to load minute notes:", error)
        toast.error("Failed to load meeting minutes")
      } finally {
        setLoading(false)
      }
    }

    loadMinuteNotes()
  }, [agendaItems, mappedInitialMinuteNotes, meetingId])

  const minuteNotes = mappedInitialMinuteNotes.length > 0 ? mappedInitialMinuteNotes : fetchedMinuteNotes

  const getAgendaStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "ongoing":
        return <Play className="w-4 h-4 text-blue-600" />
      default:
        return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  const getAgendaStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50 dark:bg-green-950/30"
      case "ongoing":
        return "border-blue-200 bg-blue-50 dark:bg-blue-950/30"
      default:
        return "border-gray-200 bg-gray-50 dark:bg-gray-900/50"
    }
  }

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return "Not started"
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60)
    return `${duration} min`
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not recorded"
    return new Date(dateString).toLocaleString()
  }

  const cleanMarkdown = (text: string): string => {
    // Remove markdown formatting
    return text
      .replace(/^#{1,6}\s+/gm, '') // Remove headers (# ## ### etc.)
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold (**text**)
      .replace(/\*(.*?)\*/g, '$1') // Remove italic (*text*)
      .replace(/_(.*?)_/g, '$1') // Remove italic (_text_)
      .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/^\s*[-*+]\s+/gm, '• ') // Convert list items to bullets
      .replace(/^\s*\d+\.\s+/gm, '• ') // Convert numbered lists to bullets
      .replace(/^\s*>\s+/gm, '') // Remove blockquote
      .replace(/---+/g, '') // Remove horizontal rules
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines to max 2
      .trim()
  }

  const generateMinutesText = (includeMarkdown: boolean = true) => {
    const formatFunc = includeMarkdown ? (text: string) => text : cleanMarkdown

    const minutesText = minuteNotes.map(note => {
      const status = note.status.charAt(0).toUpperCase() + note.status.slice(1)
      const duration = formatDuration(note.startTime, note.endTime)

      let section = includeMarkdown
        ? `\n## ${note.agendaItemTitle}\n`
        : `\n${note.agendaItemTitle}\n`

      section += includeMarkdown
        ? `**Status:** ${status} | **Duration:** ${duration} | **Allocated:** ${note.allocatedMinutes} min\n`
        : `Status: ${status} | Duration: ${duration} | Allocated: ${note.allocatedMinutes} min\n`

      if (note.agendaItemDescription) {
        section += includeMarkdown
          ? `**Description:** ${note.agendaItemDescription}\n`
          : `Description: ${note.agendaItemDescription}\n`
      }

      if (note.startTime) {
        section += includeMarkdown
          ? `**Started:** ${formatDateTime(note.startTime)}\n`
          : `Started: ${formatDateTime(note.startTime)}\n`
      }

      if (note.endTime) {
        section += includeMarkdown
          ? `**Ended:** ${formatDateTime(note.endTime)}\n`
          : `Ended: ${formatDateTime(note.endTime)}\n`
      }

      if (note.notes) {
        section += includeMarkdown
          ? `\n**Minutes:**\n${note.notes}\n`
          : `\nMinutes:\n${note.notes}\n`
      }

      if (isHost && note.hostNotes) {
        section += includeMarkdown
          ? `\n**Host Notes:**\n${note.hostNotes}\n`
          : `\nHost Notes:\n${note.hostNotes}\n`
      }

      section += includeMarkdown ? `\n---\n` : `\n${'='.repeat(50)}\n`
      return section
    }).join('')

    const additionalNotesText = additionalNotes.map((note) => {
      let section = includeMarkdown
        ? `\n## ${note.title}\n`
        : `\n${note.title}\n`

      section += includeMarkdown
        ? `**Created:** ${formatDateTime(note.created_at)}\n`
        : `Created: ${formatDateTime(note.created_at)}\n`

      if (note.notes) {
        section += includeMarkdown
          ? `\n**Notes:**\n${note.notes}\n`
          : `\nNotes:\n${note.notes}\n`
      }

      if (isHost && note.host_notes) {
        section += includeMarkdown
          ? `\n**Host Notes:**\n${note.host_notes}\n`
          : `\nHost Notes:\n${note.host_notes}\n`
      }

      if (note.created_by_name || note.created_by_email) {
        section += includeMarkdown
          ? `\n**Created By:** ${note.created_by_name || note.created_by_email}\n`
          : `\nCreated By: ${note.created_by_name || note.created_by_email}\n`
      }

      section += includeMarkdown ? `\n---\n` : `\n${'='.repeat(50)}\n`
      return section
    }).join('')

    const header = includeMarkdown
      ? `# Meeting Minutes - ${new Date().toLocaleDateString()}\n\n`
      : `Meeting Minutes - ${new Date().toLocaleDateString()}\n\n`

    const additionalSection = additionalNotesText ? includeMarkdown
      ? `\n# Additional Notes\n${additionalNotesText}`
      : `\nAdditional Notes\n${additionalNotesText}`
      : ""

    return `${header}${minutesText}${additionalSection}`
  }

  const exportMinutes = (format: 'txt' | 'docx' = 'txt') => {
    try {
      const includeMarkdown = format === 'txt'
      const exportText = generateMinutesText(includeMarkdown)

      const mimeType = format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'text/plain'

      const fileExtension = format === 'docx' ? 'docx' : 'txt'

      const blob = new Blob([exportText], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meeting-minutes-${new Date().toISOString().split('T')[0]}.${fileExtension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Meeting minutes exported as ${format.toUpperCase()} successfully`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export meeting minutes')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading meeting minutes...</div>
      </div>
    )
  }

  if (minuteNotes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No meeting minutes recorded</p>
          {isHost && (
            <p className="text-sm mt-2">
              Minutes will appear here once the meeting is conducted and notes are saved.
            </p>
          )}
        </div>

        {additionalNotes.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {additionalNotes.map((note) => (
                <div key={note.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium">{note.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(note.created_at)}
                        {note.created_by_name || note.created_by_email ? ` by ${note.created_by_name || note.created_by_email}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 whitespace-pre-wrap text-sm">{note.notes}</div>
{isHost && note.host_notes ? (
                     <div className="mt-3 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 p-3 text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                       {note.host_notes}
                     </div>
                   ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Meeting Minutes</h3>
          <p className="text-sm text-muted-foreground">
            {minuteNotes.length} agenda item{minuteNotes.length !== 1 ? 's' : ''} documented
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportMinutes('txt')}>
              <FileText className="w-4 h-4 mr-2" />
              Export as TXT (with Markdown)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportMinutes('docx')}>
              <FileText className="w-4 h-4 mr-2" />
              Export as DOCX (clean format)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        {minuteNotes
          .sort((a, b) => {
            // Sort by agenda item order (assuming agenda items are ordered)
            const aOrder = agendaItems.findIndex(item => item.id === a.agendaItemId)
            const bOrder = agendaItems.findIndex(item => item.id === b.agendaItemId)
            return aOrder - bOrder
          })
          .map((note) => (
            <Card
              key={note.id}
              className={`${getAgendaStatusColor(note.status)}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    {getAgendaStatusIcon(note.status)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium">
                        {note.agendaItemTitle}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(note.startTime, note.endTime)}</span>
                        </div>
                        <span>Allocated: {note.allocatedMinutes} min</span>
                        {note.startTime && (
                          <span>Started: {formatDateTime(note.startTime)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {note.agendaItemDescription && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description:</p>
                    <p className="text-sm">{note.agendaItemDescription}</p>
                  </div>
                )}

{note.notes && (
                   <div>
                     <p className="text-sm font-medium text-muted-foreground mb-2">Meeting Minutes:</p>
                     <div className="bg-white dark:bg-gray-800 p-3 rounded border text-sm whitespace-pre-wrap">
                       {note.notes}
                     </div>
                   </div>
                 )}

                 {isHost && note.hostNotes && (
                   <div>
                     <p className="text-sm font-medium text-muted-foreground mb-2">Host Notes:</p>
                     <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded border border-blue-200 dark:border-blue-800 text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-300">
                       {note.hostNotes}
                     </div>
                   </div>
                 )}

                {!note.notes && !note.hostNotes && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No notes recorded for this agenda item
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {additionalNotes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {additionalNotes.map((note) => (
              <div key={note.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium">{note.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateTime(note.created_at)}
                      {note.created_by_name || note.created_by_email ? ` by ${note.created_by_name || note.created_by_email}` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm">{note.notes}</div>
{isHost && note.host_notes ? (
                       <div className="mt-3 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 p-3 text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                         {note.host_notes}
                       </div>
                     ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
