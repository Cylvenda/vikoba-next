"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Clock, Edit3, Save, X, CheckCircle, Circle, Play, Plus, Trash2, FileText } from "lucide-react"
import { toast } from "react-toastify"
import { meetingServices } from "@/api/services/meeting.service"
import type { AgendaItem } from "@/store/meeting/meeting.types"
import { useLanguage } from "@/components/language/language-provider"

export interface AgendaMinuteNote {
  id?: string
  agendaItemId?: string
  title?: string
  notes: string
  hostNotes: string
  status: "pending" | "ongoing" | "completed"
  startTime?: string
  endTime?: string
}

export interface AdditionalNote {
  id: string
  title: string
  notes: string
  hostNotes: string
  createdByName?: string
  createdByEmail?: string
  createdAt: string
  updatedAt: string
}

type AgendaMinuteNoteResponse = {
  id?: string
  agenda_item_id?: string | null
  title?: string | null
  notes?: string | null
  host_notes?: string | null
  status?: "pending" | "ongoing" | "completed"
  start_time?: string | null
  end_time?: string | null
}

type ApiError = {
  response?: {
    status?: number
  }
}

interface AgendaMinutesPanelProps {
  meetingId: string
  agendaItems: AgendaItem[]
  isHost?: boolean
  onAgendaItemSelect?: (agendaItemId: string) => void
  selectedAgendaItemId?: string | null
}

function getErrorStatus(error: unknown) {
  return (error as ApiError)?.response?.status
}

function createDefaultAgendaMinuteNote(item: AgendaItem): AgendaMinuteNote {
  return {
    agendaItemId: item.id,
    notes: "",
    hostNotes: "",
    status: item.order === 0 ? "ongoing" : "pending"
  }
}

export function AgendaMinutesPanel({
  meetingId,
  agendaItems,
  isHost = false,
  onAgendaItemSelect,
  selectedAgendaItemId
}: AgendaMinutesPanelProps) {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  const [minuteNotes, setMinuteNotes] = useState<Record<string, AgendaMinuteNote>>({})
  const [standaloneNotes, setStandaloneNotes] = useState<AgendaMinuteNote[]>([])
  const [additionalNotes, setAdditionalNotes] = useState<AdditionalNote[]>([])
  const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null)
  const [editingStandaloneId, setEditingStandaloneId] = useState<string | null>(null)
  const [editingAdditionalId, setEditingAdditionalId] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState("")
  const [tempHostNotes, setTempHostNotes] = useState("")
  const [tempStandaloneTitle, setTempStandaloneTitle] = useState("")
  const [tempAdditionalTitle, setTempAdditionalTitle] = useState("")
  const [tempAdditionalNotes, setTempAdditionalNotes] = useState("")
  const [tempAdditionalHostNotes, setTempAdditionalHostNotes] = useState("")
  const [showAdditionalForm, setShowAdditionalForm] = useState(false)
  const [showAdditionalNotes, setShowAdditionalNotes] = useState(false)
  const [showStandaloneForm, setShowStandaloneForm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load existing minute notes from API
  useEffect(() => {
    const loadMinuteNotes = async () => {
      if (!meetingId) return

      try {
        const response = await meetingServices.getAgendaMinuteNotes(meetingId)
        if (response.status >= 200 && response.status < 300 && response.data) {
          const notesMap: Record<string, AgendaMinuteNote> = {}
          const standaloneList: AgendaMinuteNote[] = []
          response.data.forEach((note: AgendaMinuteNoteResponse) => {
            const mappedNote: AgendaMinuteNote = {
              id: note.id,
              agendaItemId: note.agenda_item_id || undefined,
              title: note.title || undefined,
              notes: note.notes || "",
              hostNotes: note.host_notes || "",
              status: note.status || "pending",
              startTime: note.start_time || undefined,
              endTime: note.end_time || undefined
            }
            if (note.agenda_item_id) {
              notesMap[note.agenda_item_id] = mappedNote
            } else {
              standaloneList.push(mappedNote)
            }
          })
          setMinuteNotes(notesMap)
          setStandaloneNotes(standaloneList)
        }
      } catch (error: unknown) {
        console.error("Failed to load minute notes:", error)
        // Handle 404 errors gracefully - use local storage fallback
        if (getErrorStatus(error) === 404) {
          // Backend not available, use local storage as fallback
          const storedNotes = localStorage.getItem(`agenda_minutes_${meetingId}`)
          if (storedNotes) {
            try {
              const parsedNotes = JSON.parse(storedNotes)
              setMinuteNotes(parsedNotes)
            } catch (parseError) {
              console.error("Failed to parse stored notes:", parseError)
            }
          }
        } else {
          toast.error(language === "sw" ? "Imeshindikana kupakia kumbukumbu za kikao" : "Failed to load meeting minutes")
        }
      }
    }

    loadMinuteNotes()

    // Load additional notes
    const loadAdditionalNotes = async () => {
      if (!meetingId) return

      try {
        const response = await meetingServices.getAdditionalNotes(meetingId)
        if (response.status >= 200 && response.status < 300 && response.data) {
          setAdditionalNotes(response.data)
        }
      } catch (error: unknown) {
        console.error("Failed to load additional notes:", error)
        // Handle 404 errors gracefully - use local storage fallback
        if (getErrorStatus(error) === 404) {
          // Backend not available, use local storage as fallback
          const storedNotes = localStorage.getItem(`additional_notes_${meetingId}`)
          if (storedNotes) {
            try {
              const parsedNotes = JSON.parse(storedNotes)
              setAdditionalNotes(parsedNotes)
            } catch (parseError) {
              console.error("Failed to parse stored additional notes:", parseError)
            }
          }
        } else {
          toast.error(language === "sw" ? "Imeshindikana kupakia maelezo ya ziada" : "Failed to load additional notes")
        }
      }
    }

    loadAdditionalNotes()
  }, [language, meetingId])

  const handleStartAgendaItem = (agendaItemId: string) => {
    if (!isHost) return

    const startedAt = new Date().toISOString()
    setMinuteNotes(prev => {
      const updated = { ...prev }
      const currentAgendaItem = agendaItems.find(item => item.id === agendaItemId)
      Object.keys(updated).forEach(id => {
        if (id === agendaItemId) {
          updated[id] = {
            ...(updated[id] || (currentAgendaItem ? createDefaultAgendaMinuteNote(currentAgendaItem) : prev[id])),
            status: "ongoing",
            startTime: updated[id]?.startTime || startedAt,
            endTime: undefined
          }
          return
        }

        if (updated[id].status === "ongoing") {
          updated[id] = {
            ...updated[id],
            status: "pending",
            endTime: undefined
          }
        }
      })
      if (!updated[agendaItemId] && currentAgendaItem) {
        updated[agendaItemId] = {
          ...createDefaultAgendaMinuteNote(currentAgendaItem),
          status: "ongoing",
          startTime: startedAt,
          endTime: undefined
        }
      }
      return updated
    })

    onAgendaItemSelect?.(agendaItemId)
  }

  const handleCompleteAgendaItem = (agendaItemId: string) => {
    if (!isHost) return

    const agendaItem = agendaItems.find(item => item.id === agendaItemId)
    if (!agendaItem) return

    setMinuteNotes(prev => ({
      ...prev,
      [agendaItemId]: {
        ...(prev[agendaItemId] || createDefaultAgendaMinuteNote(agendaItem)),
        status: "completed",
        endTime: new Date().toISOString()
      }
    }))
  }

  const handleEditNotes = (agendaItemId: string) => {
    if (!isHost) return

    const currentNotes = minuteNotes[agendaItemId]
    if (!currentNotes) return
    setEditingAgendaId(agendaItemId)
    setTempNotes(currentNotes.notes)
    setTempHostNotes(currentNotes.hostNotes)
  }

  const handleSaveNotes = async (agendaItemId: string) => {
    if (!meetingId || !isHost) return

    try {
      const agendaItem = agendaItems.find(item => item.id === agendaItemId)
      if (!agendaItem) return

      const notes = minuteNotes[agendaItemId] || createDefaultAgendaMinuteNote(agendaItem)
      const response = await meetingServices.saveAgendaMinuteNote(meetingId, {
        agenda_item_id: agendaItemId,
        notes: tempNotes,
        host_notes: tempHostNotes,
        status: notes.status,
        start_time: notes.startTime,
        end_time: notes.endTime
      })

      if (response.status >= 200 && response.status < 300) {
        setMinuteNotes(prev => ({
          ...prev,
          [agendaItemId]: {
            ...prev[agendaItemId],
            notes: tempNotes,
            hostNotes: tempHostNotes
          }
        }))
        setEditingAgendaId(null)
        setTempNotes("")
        setTempHostNotes("")
        toast.success(tt("Notes saved successfully", "Maelezo yamehifadhiwa"))
      } else {
        toast.error(tt("Failed to save notes", "Imeshindikana kuhifadhi maelezo"))
      }
    } catch (error: unknown) {
      console.error("Error saving notes:", error)
      // Handle 404 errors gracefully - use local storage fallback
      if (getErrorStatus(error) === 404) {
        // Backend not available, save to local storage
        const agendaItem = agendaItems.find(item => item.id === agendaItemId)
        if (!agendaItem) return
        const updatedNotes = {
          ...minuteNotes,
          [agendaItemId]: {
            ...(minuteNotes[agendaItemId] || createDefaultAgendaMinuteNote(agendaItem)),
            notes: tempNotes,
            hostNotes: tempHostNotes
          }
        }
        setMinuteNotes(updatedNotes)
        localStorage.setItem(`agenda_minutes_${meetingId}`, JSON.stringify(updatedNotes))
        setEditingAgendaId(null)
        setTempNotes("")
        setTempHostNotes("")
        toast.success(tt("Notes saved locally (backend not available)", "Maelezo yamehifadhiwa kwenye kifaa"))
      } else {
        toast.error(tt("Failed to save notes", "Imeshindikana kuhifadhi maelezo"))
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingAgendaId(null)
    setTempNotes("")
    setTempHostNotes("")
  }

  // Standalone Notes Functions (for meetings without agenda items)
  const handleCreateStandaloneNote = async () => {
    if (!meetingId || !isHost || !tempStandaloneTitle.trim()) return

    try {
      const response = await meetingServices.saveAgendaMinuteNote(meetingId, {
        title: tempStandaloneTitle.trim(),
        notes: tempNotes.trim(),
        host_notes: tempHostNotes.trim(),
        status: "pending"
      })

      if (response.status >= 200 && response.status < 300 && response.data) {
        const newNote: AgendaMinuteNote = {
          id: response.data.id,
          title: tempStandaloneTitle.trim(),
          notes: tempNotes.trim(),
          hostNotes: tempHostNotes.trim(),
          status: "pending"
        }
        setStandaloneNotes(prev => [newNote, ...prev])
        setTempStandaloneTitle("")
        setTempNotes("")
        setTempHostNotes("")
        setShowStandaloneForm(false)
        toast.success(tt("Note created successfully", "Maelezo yameundwa"))
      } else {
        toast.error(tt("Failed to create note", "Imeshindikana kuunda maelezo"))
      }
    } catch (error: unknown) {
      console.error("Error creating standalone note:", error)
      toast.error(tt("Failed to create note", "Imeshindikana kuunda maelezo"))
    }
  }

  const handleEditStandaloneNote = (note: AgendaMinuteNote) => {
    if (!isHost) return
    setEditingStandaloneId(note.id || null)
    setTempStandaloneTitle(note.title || "")
    setTempNotes(note.notes)
    setTempHostNotes(note.hostNotes)
  }

  const handleSaveStandaloneNote = async (noteId: string) => {
    if (!meetingId || !isHost) return

    try {
      const response = await meetingServices.updateAgendaMinuteNote(meetingId, noteId, {
        title: tempStandaloneTitle.trim(),
        notes: tempNotes.trim(),
        host_notes: tempHostNotes.trim()
      })

      if (response.status >= 200 && response.status < 300) {
        setStandaloneNotes(prev => prev.map(n =>
          n.id === noteId ? { ...n, title: tempStandaloneTitle.trim(), notes: tempNotes.trim(), hostNotes: tempHostNotes.trim() } : n
        ))
        setEditingStandaloneId(null)
        setTempStandaloneTitle("")
        setTempNotes("")
        setTempHostNotes("")
        toast.success(tt("Note updated successfully", "Maelezo yamesasishwa"))
      } else {
        toast.error(tt("Failed to update note", "Imeshindikana kusasisha maelezo"))
      }
    } catch (error: unknown) {
      console.error("Error updating standalone note:", error)
      toast.error(tt("Failed to update note", "Imeshindikana kusasisha maelezo"))
    }
  }

  const handleCancelStandaloneEdit = () => {
    setEditingStandaloneId(null)
    setTempStandaloneTitle("")
    setTempNotes("")
    setTempHostNotes("")
    setShowStandaloneForm(false)
  }

  // Additional Notes Functions
  const handleCreateAdditionalNote = async () => {
    if (!meetingId || !isHost || !tempAdditionalTitle.trim()) return

    try {
      const response = await meetingServices.createAdditionalNote(meetingId, {
        title: tempAdditionalTitle.trim(),
        notes: tempAdditionalNotes.trim(),
        host_notes: tempAdditionalHostNotes.trim()
      })

      if (response.status >= 200 && response.status < 300) {
        setAdditionalNotes(prev => [response.data, ...prev])
        setTempAdditionalTitle("")
        setTempAdditionalNotes("")
        setTempAdditionalHostNotes("")
        setShowAdditionalForm(false)
        toast.success(tt("Additional note created successfully", "Maelezo ya ziada yameundwa"))
      } else {
        toast.error(tt("Failed to create additional note", "Imeshindikana kuunda maelezo ya ziada"))
      }
    } catch (error: unknown) {
      console.error("Error creating additional note:", error)
      // Handle 404 errors gracefully - use local storage fallback
      if (getErrorStatus(error) === 404) {
        // Backend not available, save to local storage
        const newNote: AdditionalNote = {
          id: `local_${Date.now()}`,
          title: tempAdditionalTitle.trim(),
          notes: tempAdditionalNotes.trim(),
          hostNotes: tempAdditionalHostNotes.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const updatedNotes = [newNote, ...additionalNotes]
        setAdditionalNotes(updatedNotes)
        localStorage.setItem(`additional_notes_${meetingId}`, JSON.stringify(updatedNotes))

        setTempAdditionalTitle("")
        setTempAdditionalNotes("")
        setTempAdditionalHostNotes("")
        setShowAdditionalForm(false)
        toast.success(tt("Additional note saved locally (backend not available)", "Maelezo ya ziada yamehifadhiwa kwenye kifaa"))
      } else {
        toast.error(tt("Failed to create additional note", "Imeshindikana kuunda maelezo ya ziada"))
      }
    }
  }

  const handleEditAdditionalNote = (note: AdditionalNote) => {
    if (!isHost) return

    setEditingAdditionalId(note.id)
    setTempAdditionalTitle(note.title)
    setTempAdditionalNotes(note.notes)
    setTempAdditionalHostNotes(note.hostNotes)
  }

  const handleUpdateAdditionalNote = async (noteId: string) => {
    if (!meetingId || !isHost || !tempAdditionalTitle.trim()) return

    try {
      const response = await meetingServices.updateAdditionalNote(meetingId, noteId, {
        title: tempAdditionalTitle.trim(),
        notes: tempAdditionalNotes.trim(),
        host_notes: tempAdditionalHostNotes.trim()
      })

      if (response.status >= 200 && response.status < 300) {
        setAdditionalNotes(prev => prev.map(note =>
          note.id === noteId ? response.data : note
        ))
        setEditingAdditionalId(null)
        setTempAdditionalTitle("")
        setTempAdditionalNotes("")
        setTempAdditionalHostNotes("")
        toast.success(tt("Additional note updated successfully", "Maelezo ya ziada yamesasishwa"))
      } else {
        toast.error(tt("Failed to update additional note", "Imeshindikana kusasisha maelezo ya ziada"))
      }
    } catch (error: unknown) {
      console.error("Error updating additional note:", error)
      // Handle 404 errors gracefully - use local storage fallback
      if (getErrorStatus(error) === 404) {
        // Backend not available, update local storage
        const updatedNotes = additionalNotes.map(note =>
          note.id === noteId
            ? {
              ...note,
              title: tempAdditionalTitle.trim(),
              notes: tempAdditionalNotes.trim(),
              hostNotes: tempAdditionalHostNotes.trim(),
              updatedAt: new Date().toISOString()
            }
            : note
        )

        setAdditionalNotes(updatedNotes)
        localStorage.setItem(`additional_notes_${meetingId}`, JSON.stringify(updatedNotes))

        setEditingAdditionalId(null)
        setTempAdditionalTitle("")
        setTempAdditionalNotes("")
        setTempAdditionalHostNotes("")
        toast.success(tt("Additional note updated locally (backend not available)", "Maelezo ya ziada yamesasishwa kwenye kifaa"))
      } else {
        toast.error(tt("Failed to update additional note", "Imeshindikana kusasisha maelezo ya ziada"))
      }
    }
  }

  const handleDeleteAdditionalNote = async (noteId: string) => {
    if (!meetingId || !isHost) return

    try {
      const response = await meetingServices.deleteAdditionalNote(meetingId, noteId)

      if (response.status >= 200 && response.status < 300) {
        setAdditionalNotes(prev => prev.filter(note => note.id !== noteId))
        toast.success(tt("Additional note deleted successfully", "Maelezo ya ziada yamefutwa"))
      } else {
        toast.error(tt("Failed to delete additional note", "Imeshindikana kufuta maelezo ya ziada"))
      }
    } catch (error: unknown) {
      console.error("Error deleting additional note:", error)
      // Handle 404 errors gracefully - use local storage fallback
      if (getErrorStatus(error) === 404) {
        // Backend not available, update local storage
        const updatedNotes = additionalNotes.filter(note => note.id !== noteId)
        setAdditionalNotes(updatedNotes)
        localStorage.setItem(`additional_notes_${meetingId}`, JSON.stringify(updatedNotes))
        toast.success(tt("Additional note deleted locally (backend not available)", "Maelezo ya ziada yamefutwa kwenye kifaa"))
      } else {
        toast.error(tt("Failed to delete additional note", "Imeshindikana kufuta maelezo ya ziada"))
      }
    }
  }

  const handleCancelAdditionalEdit = () => {
    setEditingAdditionalId(null)
    setShowAdditionalForm(false)
    setTempAdditionalTitle("")
    setTempAdditionalNotes("")
    setTempAdditionalHostNotes("")
  }

  const getAgendaStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      case "ongoing":
        return <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      default:
        return <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
    }
  }

  const getAgendaStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-500/10"
      case "ongoing":
        return "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-500/10"
      default:
        return "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    }
  }

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return ""
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60)
    return `${duration} min`
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-md">
      <div className="flex shrink-0 items-center justify-between gap-3 pb-4">
        <Button
          size="sm"
          onClick={() => setShowAdditionalNotes(!showAdditionalNotes)}
        >
          {showAdditionalNotes ? tt("Hide Notes", "Ficha Maelezo") : tt("Show Notes", "Onyesha Maelezo")}
        </Button>
        <div className="flex gap-2 items-center justify-between">

          {isHost && (
            <Button
              size="sm"
              onClick={async () => {
                if (!meetingId) return

                setLoading(true)
                try {
                  const notesArray = Object.values(minuteNotes)
                    .filter((note): note is AgendaMinuteNote & { agendaItemId: string } => Boolean(note.agendaItemId))
                    .map((note) => ({
                      agenda_item_id: note.agendaItemId,
                      notes: note.notes,
                      host_notes: note.hostNotes,
                      status: note.status,
                      start_time: note.startTime,
                      end_time: note.endTime,
                    }))

                  const response = await meetingServices.saveAllAgendaMinuteNotes(meetingId, notesArray)
                  if (response.status >= 200 && response.status < 300) {
                    toast.success(tt("All minutes saved successfully", "Kumbukumbu zote zimehifadhiwa"))
                  } else {
                    toast.error(tt("Failed to save some minutes", "Baadhi ya kumbukumbu hazikuhifadhiwa"))
                  }
                } catch (error: unknown) {
                  console.error("Error saving all notes:", error)
                  // Handle 404 errors gracefully - use local storage fallback
                  if (getErrorStatus(error) === 404) {
                    // Backend not available, save to local storage
                    localStorage.setItem(`agenda_minutes_${meetingId}`, JSON.stringify(minuteNotes))
                    toast.success(tt("All minutes saved locally (backend not available)", "Kumbukumbu zote zimehifadhiwa kwenye kifaa"))
                  } else {
                    toast.error(tt("Failed to save minutes", "Imeshindikana kuhifadhi kumbukumbu"))
                  }
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              {loading ? tt("Saving...", "Inahifadhi...") : tt("Save All", "Hifadhi Zote")}
            </Button>
          )}
        </div>
      </div>

      <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-3 pr-1">
          {agendaItems.map((agendaItem) => {
            const notes = minuteNotes[agendaItem.id] || createDefaultAgendaMinuteNote(agendaItem)

            const isSelected = selectedAgendaItemId === agendaItem.id
            const isEditing = editingAgendaId === agendaItem.id

            return (
              <Card
                key={agendaItem.id}
                className={`rounded-sm! cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-blue-300 dark:border-blue-600' : 'border-gray-200 dark:border-gray-700'
                  } ${getAgendaStatusColor(notes.status)}`}
                onClick={() => onAgendaItemSelect?.(agendaItem.id)}
              >
                <CardContent className="p-4 rounded-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      {getAgendaStatusIcon(notes.status)}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{agendaItem.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span>{tt("Order:", "Mpangilio:")} {agendaItem.order + 1}</span>
                          {notes.startTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(notes.startTime, notes.endTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isHost && (
                        <>
                          {notes.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartAgendaItem(agendaItem.id)
                              }}
                              className="text-xs"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              {tt("Start", "Anza")}
                            </Button>
                          )}

                          {notes.status === "ongoing" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCompleteAgendaItem(agendaItem.id)
                              }}
                              className="text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {tt("Complete", "Kamilisha")}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditNotes(agendaItem.id)
                            }}
                            className="text-xs"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes Display */}
                  {isEditing ? (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Minutes", "Kumbukumbu")}</label>
                        <Textarea
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder={tt("Enter meeting minutes...", "Ingiza kumbukumbu za kikao...")}
                          className="app-scrollbar min-h-20 text-sm mt-1"
                        />
                      </div>

                      {isHost && (
                        <div>
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Host Comments", "Maoni ya Mwenyeji")}</label>
                          <Textarea
                            value={tempHostNotes}
                            onChange={(e) => setTempHostNotes(e.target.value)}
                            placeholder={tt("Add private host comments and observations...", "Ongeza maoni binafsi ya mwenyeji...")}
                            className="app-scrollbar min-h-15 text-sm mt-1 border-blue-200 dark:border-blue-700 focus:border-blue-400 dark:focus:border-blue-500"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveNotes(agendaItem.id)}
                          className="text-xs"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          {tt("Save", "Hifadhi")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          {tt("Cancel", "Ghairi")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.notes && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{tt("Minutes:", "Kumbukumbu:")}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notes.notes}</p>
                        </div>
                      )}

                      {isHost && notes.hostNotes && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{tt("Host Comments:", "Maoni ya Mwenyeji:")}</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap bg-blue-50 dark:bg-blue-500/10 p-2 rounded border border-blue-200 dark:border-blue-700">
                            {notes.hostNotes}
                          </p>
                        </div>
                      )}

                      {!notes.notes && !notes.hostNotes && (
                        <div className="text-center py-3 text-gray-600 dark:text-gray-400 text-sm">
                          <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p>{tt("No minutes recorded yet", "Bado hakuna kumbukumbu")}</p>
                          {isHost && (
                            <p className="text-xs mt-1">
                              {tt("Click the edit button to add minutes and comments", "Bofya hariri kuongeza kumbukumbu na maoni")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {/* Standalone Notes Section (for meetings without agenda items) */}
          {agendaItems.length === 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">{tt("Meeting Notes", "Maelezo ya Kikao")}</h4>
                {isHost && !showStandaloneForm && (
                  <Button
                    size="sm"
                    onClick={() => setShowStandaloneForm(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {tt("Add Note", "Ongeza Maelezo")}
                  </Button>
                )}
              </div>

              {/* Create Standalone Note Form */}
              {showStandaloneForm && (
                <Card className="mb-4 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-500/10">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Title", "Kichwa")}</label>
                        <Input
                          value={tempStandaloneTitle}
                          onChange={(e) => setTempStandaloneTitle(e.target.value)}
                          placeholder={tt("Note title or topic...", "Kichwa au mada ya maelezo...")}
                          className="text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Notes", "Maelezo")}</label>
                        <Textarea
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder={tt("Enter meeting notes...", "Ingiza maelezo ya kikao...")}
                          className="app-scrollbar min-h-20 text-sm mt-1"
                        />
                      </div>
                      {isHost && (
                        <div>
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Host Notes", "Maelezo ya Mwenyeji")}</label>
                          <Textarea
                            value={tempHostNotes}
                            onChange={(e) => setTempHostNotes(e.target.value)}
                            placeholder={tt("Add private host notes...", "Ongeza maelezo binafsi ya mwenyeji...")}
                            className="app-scrollbar min-h-15 text-sm mt-1 border-blue-200 dark:border-blue-700 focus:border-blue-400 dark:focus:border-blue-500"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleCreateStandaloneNote}
                          disabled={!tempStandaloneTitle.trim()}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          {tt("Create", "Unda")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelStandaloneEdit}
                        >
                          <X className="w-3 h-3 mr-1" />
                          {tt("Cancel", "Ghairi")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Standalone Notes List */}
              <div className="space-y-3">
                {standaloneNotes.map((note) => (
                  <Card key={note.id} className="border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-500/10">
                    <CardContent className="p-4">
                      {editingStandaloneId === note.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Title", "Kichwa")}</label>
                            <Input
                              value={tempStandaloneTitle}
                              onChange={(e) => setTempStandaloneTitle(e.target.value)}
                              className="text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Notes", "Maelezo")}</label>
                            <Textarea
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              className="app-scrollbar min-h-20 text-sm mt-1"
                            />
                          </div>
                          {isHost && (
                            <div>
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Host Notes", "Maelezo ya Mwenyeji")}</label>
                              <Textarea
                                value={tempHostNotes}
                                onChange={(e) => setTempHostNotes(e.target.value)}
                                className="app-scrollbar min-h-15 text-sm mt-1 border-blue-200 dark:border-blue-700 focus:border-blue-400 dark:focus:border-blue-500"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => note.id && handleSaveStandaloneNote(note.id)}
                              disabled={!tempStandaloneTitle.trim()}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              {tt("Update", "Sasisha")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelStandaloneEdit}
                            >
                              <X className="w-3 h-3 mr-1" />
                              {tt("Cancel", "Ghairi")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h5 className="font-medium text-sm">{note.title}</h5>
                            {isHost && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditStandaloneNote(note)}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          {note.notes && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{tt("Notes:", "Maelezo:")}</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.notes}</p>
                            </div>
                          )}
                          {isHost && note.hostNotes && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{tt("Host Notes:", "Maelezo ya Mwenyeji:")}</p>
                              <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap bg-blue-50 dark:bg-blue-500/10 p-2 rounded border border-blue-200 dark:border-blue-700">
                                {note.hostNotes}
                              </p>
                            </div>
                          )}
                          {!note.notes && !note.hostNotes && (
                            <div className="text-center py-2 text-gray-600 dark:text-gray-400 text-sm">
                              <p>{tt("No content yet", "Bado hakuna maudhui")}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {standaloneNotes.length === 0 && !showStandaloneForm && (
                  <div className="text-center py-6 text-gray-600 dark:text-gray-400 text-sm">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{tt("No meeting notes yet", "Bado hakuna maelezo ya kikao")}</p>
                    {isHost && (
                      <p className="text-xs mt-1">
                        {tt("Click Add Note to create meeting notes.", "Bofya Ongeza Maelezo kuunda maelezo ya kikao.")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Additional Notes Section */}
        {showAdditionalNotes && (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">{tt("Additional Notes", "Maelezo ya Ziada")}</h4>
              {isHost && (
                <Button
                  size="sm"
                  onClick={() => setShowAdditionalForm(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {tt("Add Note", "Ongeza Maelezo")}
                </Button>
              )}
            </div>

            {/* Add Additional Note Form */}
            {showAdditionalForm && (
              <Card className="mb-4 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-500/10">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Title", "Kichwa")}</label>
                      <Input
                        value={tempAdditionalTitle}
                        onChange={(e) => setTempAdditionalTitle(e.target.value)}
                        placeholder={tt("Note title or topic...", "Kichwa au mada ya maelezo...")}
                        className="text-sm mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Notes", "Maelezo")}</label>
                      <Textarea
                        value={tempAdditionalNotes}
                        onChange={(e) => setTempAdditionalNotes(e.target.value)}
                        placeholder={tt("Enter additional notes...", "Ingiza maelezo ya ziada...")}
                        className="app-scrollbar min-h-20 text-sm mt-1"
                      />
                    </div>

                    {isHost && (
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Host Notes", "Maelezo ya Mwenyeji")}</label>
                        <Textarea
                          value={tempAdditionalHostNotes}
                          onChange={(e) => setTempAdditionalHostNotes(e.target.value)}
                          placeholder={tt("Add private host notes...", "Ongeza maelezo binafsi ya mwenyeji...")}
                          className="app-scrollbar min-h-15 text-sm mt-1"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreateAdditionalNote}
                        disabled={!tempAdditionalTitle.trim()}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {tt("Create", "Unda")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelAdditionalEdit}
                      >
                        <X className="w-3 h-3 mr-1" />
                        {tt("Cancel", "Ghairi")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Notes List */}
            <div className="space-y-3">
              {additionalNotes.map((note) => (
                <Card key={note.id} className="border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-500/10">
                  <CardContent className="p-4">
                    {editingAdditionalId === note.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Title", "Kichwa")}</label>
                          <Input
                            value={tempAdditionalTitle}
                            onChange={(e) => setTempAdditionalTitle(e.target.value)}
                            className="text-sm mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Notes", "Maelezo")}</label>
                          <Textarea
                            value={tempAdditionalNotes}
                            onChange={(e) => setTempAdditionalNotes(e.target.value)}
                            className="app-scrollbar min-h-20 text-sm mt-1"
                          />
                        </div>

                        {isHost && (
                          <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tt("Host Notes", "Maelezo ya Mwenyeji")}</label>
                            <Textarea
                              value={tempAdditionalHostNotes}
                              onChange={(e) => setTempAdditionalHostNotes(e.target.value)}
                              className="app-scrollbar min-h-15 text-sm mt-1"
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateAdditionalNote(note.id)}
                            disabled={!tempAdditionalTitle.trim()}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            {tt("Update", "Sasisha")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelAdditionalEdit}
                          >
                            <X className="w-3 h-3 mr-1" />
                            {tt("Cancel", "Ghairi")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h5 className="font-medium text-sm">{note.title}</h5>
                          <div className="flex gap-1">
                            {isHost && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditAdditionalNote(note)}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteAdditionalNote(note.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {note.notes && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{tt("Notes:", "Maelezo:")}</p>
                            <p className="text-sm">{note.notes}</p>
                          </div>
                        )}

                        {isHost && note.hostNotes && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{tt("Host Notes:", "Maelezo ya Mwenyeji:")}</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">{note.hostNotes}</p>
                          </div>
                        )}

                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {tt("Created:", "Imeundwa:")} {new Date(note.createdAt).toLocaleString()}
                          {note.createdByName && (
                            <span> {tt("by", "na")} {note.createdByName}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {additionalNotes.length === 0 && !showAdditionalForm && (
                <div className="text-center py-4 text-gray-600 dark:text-gray-400 text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{tt("No additional notes yet", "Bado hakuna maelezo ya ziada")}</p>
                  {isHost && (
                    <p className="text-xs mt-1">
                      {tt("Click Add Note to create additional notes for topics outside the agenda.", "Bofya Ongeza Maelezo kuunda maelezo ya mada zilizo nje ya ajenda.")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
