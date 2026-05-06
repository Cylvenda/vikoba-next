import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { meetingServices } from "@/api/services/meeting.service"
import { AgendaSection, AgendaItem } from "@/store/meeting/meeting.types"
import {
  Clock,
  CheckCircle,
  Circle,
  Edit,
  Save,
  X,
  FileText,
  Layers
} from "lucide-react"
import { toast } from "react-toastify"

interface MeetingAgendaPanelProps {
  meetingId: string
  isHost?: boolean
  meetingStatus?: string
}

export function MeetingAgendaPanel({
  meetingId,
  isHost = false,
  meetingStatus = "scheduled"
}: MeetingAgendaPanelProps) {
  const [agendaSections, setAgendaSections] = useState<AgendaSection[]>([])
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesContent, setNotesContent] = useState("")

  const loadAgendaData = async () => {
    setLoading(true)
    try {
      const [sectionsResponse, itemsResponse] = await Promise.all([
        meetingServices.getAgendaSections(meetingId),
        meetingServices.getAgendaItems(meetingId)
      ])

      setAgendaSections(sectionsResponse.data.filter(section => section.is_active))
      setAgendaItems(itemsResponse.data)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to load agenda data"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgendaData()
  }, [meetingId])

  const getItemsForSection = (sectionId: string): AgendaItem[] => {
    return agendaItems
      .filter((item: AgendaItem) => item.section === sectionId)
      .sort((a: AgendaItem, b: AgendaItem) => a.order - b.order)
  }

  const getUnsectionedItems = (): AgendaItem[] => {
    return agendaItems
      .filter((item: AgendaItem) => !item.section)
      .sort((a: AgendaItem, b: AgendaItem) => a.order - b.order)
  }

  const handleToggleCompletion = async (item: AgendaItem) => {
    if (!isHost && meetingStatus !== "ongoing") return

    try {
      await meetingServices.updateAgendaItem(item.id, {
        completed: !item.completed
      })
      toast.success(`Item marked as ${!item.completed ? 'completed' : 'incomplete'}`)
      loadAgendaData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to update agenda item"
      toast.error(errorMessage)
    }
  }

  const handleEditNotes = (itemId: string, currentNotes: string) => {
    setEditingNotes(itemId)
    setNotesContent(currentNotes || "")
  }

  const handleSaveNotes = async (itemId: string) => {
    try {
      await meetingServices.updateAgendaItem(itemId, {
        notes: notesContent
      })
      toast.success("Notes updated successfully")
      setEditingNotes(null)
      setNotesContent("")
      loadAgendaData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to update notes"
      toast.error(errorMessage)
    }
  }

  const handleCancelEdit = () => {
    setEditingNotes(null)
    setNotesContent("")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading meeting agenda...</div>
        </CardContent>
      </Card>
    )
  }

  const totalSections = agendaSections.length
  const totalItems = agendaItems.length
  const completedItems = agendaItems.filter(item => item.completed).length
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Meeting Agenda
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{totalSections} sections</span>
            <span>{totalItems} items</span>
            <span>{completedItems} completed</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-center text-sm text-muted-foreground mt-2">
            {Math.round(progressPercentage)}% complete
          </div>
        </CardContent>
      </Card>

      {/* Agenda Sections */}
      {agendaSections.length === 0 && getUnsectionedItems().length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No agenda items</h3>
            <p className="text-muted-foreground">
              {"This meeting doesn't have any agenda items yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {agendaSections.map((section) => (
            <Card key={section.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="font-bold">{section.order}. {section.title}</span>
                    </CardTitle>
                    {section.description && (
                      <p className="text-muted-foreground text-sm mt-1">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {getItemsForSection(section.id).map((item) => (
                  <AgendaItemRow
                    key={item.id}
                    item={item}
                    isHost={isHost}
                    meetingStatus={meetingStatus}
                    editingNotes={editingNotes}
                    notesContent={notesContent}
                    onToggleCompletion={handleToggleCompletion}
                    onEditNotes={handleEditNotes}
                    onSaveNotes={handleSaveNotes}
                    onCancelEdit={handleCancelEdit}
                    onNotesChange={setNotesContent}
                  />
                ))}
                {getItemsForSection(section.id).length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No items in this section
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Unsectioned Items */}
          {getUnsectionedItems().length > 0 && (
            <Card className="border-l-4 border-l-gray-400">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getUnsectionedItems().map((item) => (
                  <AgendaItemRow
                    key={item.id}
                    item={item}
                    isHost={isHost}
                    meetingStatus={meetingStatus}
                    editingNotes={editingNotes}
                    notesContent={notesContent}
                    onToggleCompletion={handleToggleCompletion}
                    onEditNotes={handleEditNotes}
                    onSaveNotes={handleSaveNotes}
                    onCancelEdit={handleCancelEdit}
                    onNotesChange={setNotesContent}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

interface AgendaItemRowProps {
  item: AgendaItem
  isHost: boolean
  meetingStatus: string
  editingNotes: string | null
  notesContent: string
  onToggleCompletion: (item: AgendaItem) => void
  onEditNotes: (itemId: string, currentNotes: string) => void
  onSaveNotes: (itemId: string) => void
  onCancelEdit: () => void
  onNotesChange: (content: string) => void
}

function AgendaItemRow({
  item,
  isHost,
  meetingStatus,
  editingNotes,
  notesContent,
  onToggleCompletion,
  onEditNotes,
  onSaveNotes,
  onCancelEdit,
  onNotesChange
}: AgendaItemRowProps) {
  const canEditCompletion = isHost || meetingStatus === "ongoing"
  const canEditNotes = isHost || meetingStatus === "ongoing"

  return (
    <div className="border rounded-lg p-3 bg-background">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleCompletion(item)}
          disabled={!canEditCompletion}
          className="mt-1"
        >
          {item.completed ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
              {item.title}
            </h4>
            {item.allocated_minutes > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.allocated_minutes}m
              </Badge>
            )}
            {item.completed && (
              <Badge variant="default" className="bg-green-600">
                Completed
              </Badge>
            )}
          </div>

          {item.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {item.description}
            </p>
          )}

          {/* Notes Section */}
          <div className="mt-3">
            {editingNotes === item.id ? (
              <div className="space-y-2">
                <Textarea
                  value={notesContent}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Add host notes for this agenda item..."
                  className="min-h-20 resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onSaveNotes(item.id)}>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={onCancelEdit}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {item.notes ? (
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-blue-800">Host Notes:</strong>
                      {canEditNotes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditNotes(item.id, item.notes || "")}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-blue-700 whitespace-pre-wrap">{item.notes}</p>
                  </div>
                ) : (
                  canEditNotes && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditNotes(item.id, "")}
                      className="text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Add Notes
                    </Button>
                  )
                )}
              </div>
            )}
          </div>

          {item.completed_at && (
            <div className="text-xs text-muted-foreground mt-2">
              Completed by {item.completed_by_email} at {new Date(item.completed_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
