"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { meetingServices } from "@/api/services/meeting.service"
import { MinuteSection } from "@/store/meeting/meeting.types"
import { CheckCircle, Circle, Edit, Save, X, FileText, Play } from "lucide-react"
import { toast } from "react-toastify"

interface MinuteSectionsPanelProps {
  meetingId: string
  isHost?: boolean
  meetingStatus?: string
}

export function MinuteSectionsPanel({
  meetingId,
  isHost = false,
  meetingStatus = "scheduled"
}: MinuteSectionsPanelProps) {
  const [minuteSections, setMinuteSections] = useState<MinuteSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesContent, setNotesContent] = useState("")
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [workingNotes, setWorkingNotes] = useState("")

  const loadMinuteSections = async () => {
    setLoading(true)
    try {
      const response = await meetingServices.getMinuteSections(meetingId)
      setMinuteSections(response.data)

      // If no minute sections exist and agenda exists, auto-create them
      if (response.data.length === 0) {
        await createMinuteSectionsFromAgenda()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to load minute sections"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMinuteSections()
  }, [meetingId])

  const createMinuteSectionsFromAgenda = async () => {
    try {
      const response = await meetingServices.createMinuteSections(meetingId)
      setMinuteSections(response.data)
      toast.success("Minute sections created from agenda successfully")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to create minute sections"
      toast.error(errorMessage)
    }
  }

  const handleToggleCompletion = async (section: MinuteSection) => {
    if (!isHost && meetingStatus !== "ongoing") return

    try {
      await meetingServices.updateMinuteSection(meetingId, section.id, {
        is_completed: !section.is_completed
      })
      toast.success(`Section marked as ${!section.is_completed ? 'completed' : 'incomplete'}`)
      loadMinuteSections()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to update section"
      toast.error(errorMessage)
    }
  }

  const handleSelectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId)
    const section = minuteSections.find(s => s.id === sectionId)
    if (section) {
      setWorkingNotes(section.notes || "")
    }
  }

  const handleSetActiveWorking = async (section: MinuteSection) => {
    if (!isHost && meetingStatus !== "ongoing") return

    try {
      await meetingServices.updateMinuteSection(meetingId, section.id, {
        is_active_working: true
      })
      toast.success(`Now working with: ${section.title}`)
      setSelectedSectionId(section.id)
      loadMinuteSections()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to set active section"
      toast.error(errorMessage)
    }
  }

  const handleEditNotes = (sectionId: string, currentNotes: string) => {
    setEditingNotes(sectionId)
    setNotesContent(currentNotes || "")
  }

  const handleSaveWorkingNotes = async () => {
    if (!selectedSectionId) return

    try {
      await meetingServices.updateMinuteSection(meetingId, selectedSectionId, {
        notes: workingNotes
      })
      toast.success("Working notes saved successfully")
      loadMinuteSections()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to save working notes"
      toast.error(errorMessage)
    }
  }

  const handleSaveNotes = async (sectionId: string) => {
    try {
      await meetingServices.updateMinuteSection(meetingId, sectionId, {
        notes: notesContent
      })
      toast.success("Notes updated successfully")
      setEditingNotes(null)
      setNotesContent("")
      loadMinuteSections()
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
          <div className="text-center">Loading minute sections...</div>
        </CardContent>
      </Card>
    )
  }

  const totalSections = minuteSections.length
  const completedSections = minuteSections.filter(section => section.is_completed).length

  return (
    <Card className="border-none bg-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Meeting Minutes Sections
          </div>
          <div className="text-sm text-muted-foreground">
            {completedSections} of {totalSections} completed
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalSections === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No minute sections</h3>
            <p className="text-muted-foreground mb-4">
              This meeting doesn&apos;t have any minute sections yet. They will be created automatically from agenda sections.
            </p>
            {isHost && (
              <Button onClick={createMinuteSectionsFromAgenda}>
                Create from Agenda
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalSections > 0 ? (completedSections / totalSections) * 100 : 0}%` }}
              />
            </div>

            {/* Agenda Guide and Working Area */}
            <div className="space-y-4">
              {/* Agenda Guide Line */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Agenda Guide
                </h3>
                <div className="space-y-2">
                  {minuteSections.map((section, index) => (
                    <div
                      key={section.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedSectionId === section.id
                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10"
                        : section.is_completed
                          ? "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-500/10"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      onClick={() => isHost && handleSelectSection(section.id)}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 text-xs flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{section.title}</h4>
                          {section.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {section.is_completed && (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                          {section.is_active_working && (
                            <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                          {!section.is_completed && !section.is_active_working && (
                            <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dedicated Working Area */}
              {selectedSectionId && (
                <div className="border-2 border-blue-500 dark:border-blue-400 rounded-lg p-4 bg-blue-50 dark:bg-blue-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Working on: {minuteSections.find(s => s.id === selectedSectionId)?.title}
                    </h3>
                    {isHost && meetingStatus === "ongoing" && (
                      <Button
                        size="sm"
                        onClick={() => handleToggleCompletion(minuteSections.find(s => s.id === selectedSectionId)!)}
                        className="flex items-center gap-2"
                      >
                        {minuteSections.find(s => s.id === selectedSectionId)?.is_completed ? (
                          <>
                            <Circle className="w-4 h-4" />
                            Reopen
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Mark Done
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Working Notes Textarea */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Working Notes</h4>
                      {isHost && meetingStatus === "ongoing" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveWorkingNotes}
                            disabled={!workingNotes.trim()}
                            className="flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save Notes
                          </Button>
                        </div>
                      )}
                    </div>
                    <Textarea
                      value={workingNotes}
                      onChange={(e) => setWorkingNotes(e.target.value)}
                      placeholder="Add detailed notes for this agenda section..."
                      className="min-h-32 w-full"
                      disabled={!isHost || meetingStatus !== "ongoing"}
                    />
                    <div className="text-xs text-muted-foreground">
                      {workingNotes.length} characters
                    </div>
                  </div>

                  {/* Section Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Section:</strong> {minuteSections.find(s => s.id === selectedSectionId)?.title}</p>
                      {minuteSections.find(s => s.id === selectedSectionId)?.description && (
                        <p className="mt-1"><strong>Description:</strong> {minuteSections.find(s => s.id === selectedSectionId)?.description}</p>
                      )}
                      {minuteSections.find(s => s.id === selectedSectionId)?.is_completed && (
                        <p className="mt-1">
                          <strong>Status:</strong> <span className="text-green-600 dark:text-green-400">Completed</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions when no section selected */}
              {!selectedSectionId && minuteSections.length > 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">Select a section to work on</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any agenda section above to start working on it and add notes.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
