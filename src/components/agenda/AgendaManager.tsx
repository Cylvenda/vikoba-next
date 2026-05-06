import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgendaSectionForm } from "./AgendaSectionForm"
import { AgendaItemForm } from "./AgendaItemForm"
import { meetingServices } from "@/api/services/meeting.service"
import { AgendaSection, AgendaItem } from "@/store/meeting/meeting.types"
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  Circle,
  FileText,
  Layers
} from "lucide-react"
import { toast } from "react-toastify"

interface AgendaManagerProps {
  meetingId: string
  isHost?: boolean
  meetingStatus?: string
}

export function AgendaManager({
  meetingId,
  isHost = false,
  meetingStatus = "scheduled"
}: AgendaManagerProps) {
  const [agendaSections, setAgendaSections] = useState<AgendaSection[]>([])
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("sections")
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingSection, setEditingSection] = useState<AgendaSection | null>(null)
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null)

  const loadAgendaData = async () => {
    setLoading(true)
    try {
      const [sectionsResponse, itemsResponse] = await Promise.all([
        meetingServices.getAgendaSections(meetingId),
        meetingServices.getAgendaItems(meetingId)
      ])

      setAgendaSections(sectionsResponse.data)
      setAgendaItems(itemsResponse.data)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as any).response?.data?.detail
        : "Failed to load agenda data"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSection = () => {
    setEditingSection(null)
    setShowSectionForm(true)
  }

  const handleEditSection = (section: AgendaSection) => {
    setEditingSection(section)
    setShowSectionForm(true)
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this agenda section?")) return

    try {
      await meetingServices.deleteAgendaSection(sectionId)
      toast.success("Agenda section deleted successfully")
      loadAgendaData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as any).response?.data?.detail
        : "Failed to delete agenda section"
      toast.error(errorMessage)
    }
  }

  const handleCreateItem = () => {
    setEditingItem(null)
    setShowItemForm(true)
  }

  const handleEditItem = (item: AgendaItem) => {
    setEditingItem(item)
    setShowItemForm(true)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this agenda item?")) return

    try {
      await meetingServices.deleteAgendaItem(itemId)
      toast.success("Agenda item deleted successfully")
      loadAgendaData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as any).response?.data?.detail
        : "Failed to delete agenda item"
      toast.error(errorMessage)
    }
  }

  const handleToggleItemCompletion = async (item: AgendaItem) => {
    try {
      await meetingServices.updateAgendaItem(item.id, {
        completed: !item.completed
      })
      toast.success(`Agenda item marked as ${!item.completed ? 'completed' : 'incomplete'}`)
      loadAgendaData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update agenda item")
    }
  }

  const getItemsForSection = (sectionId: string) => {
    return agendaItems
      .filter(item => item.section === sectionId)
      .sort((a, b) => a.order - b.order)
  }

  const getUnsectionedItems = () => {
    return agendaItems
      .filter(item => !item.section)
      .sort((a, b) => a.order - b.order)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading agenda...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {showSectionForm && (
        <AgendaSectionForm
          meetingId={meetingId}
          initialData={editingSection || undefined}
          onSuccess={() => {
            setShowSectionForm(false)
            loadAgendaData()
          }}
          onCancel={() => setShowSectionForm(false)}
        />
      )}

      {showItemForm && (
        <AgendaItemForm
          meetingId={meetingId}
          initialData={editingItem || undefined}
          isHost={isHost}
          meetingStatus={meetingStatus}
          onSuccess={() => {
            setShowItemForm(false)
            loadAgendaData()
          }}
          onCancel={() => setShowItemForm(false)}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="meeting-view">Meeting View</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {isHost && (
              <>
                <Button onClick={handleCreateSection} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
                <Button onClick={handleCreateItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value="sections" className="space-y-4">
          {agendaSections.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No agenda sections</h3>
                <p className="text-muted-foreground mb-4">
                  Create sections to organize your agenda items
                </p>
                {isHost && (
                  <Button onClick={handleCreateSection}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Section
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            agendaSections.map((section) => (
              <Card key={section.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {section.order}. {section.title}
                    </CardTitle>
                    <Badge variant={section.is_active ? "default" : "secondary"}>
                      {section.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {isHost && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSection(section)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                {section.description && (
                  <CardContent>
                    <p className="text-muted-foreground">{section.description}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          {agendaItems.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No agenda items</h3>
                <p className="text-muted-foreground mb-4">
                  Add agenda items to structure your meeting
                </p>
                {isHost && (
                  <Button onClick={handleCreateItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            agendaItems.map((item) => (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleItemCompletion(item)}
                      disabled={!isHost && meetingStatus !== "ongoing"}
                    >
                      {item.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="text-base">
                        {item.order}. {item.title}
                      </CardTitle>
                      {item.allocated_minutes > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {item.allocated_minutes} min
                        </div>
                      )}
                    </div>
                  </div>
                  {isHost && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                {(item.description || item.notes) && (
                  <CardContent className="space-y-2">
                    {item.description && (
                      <p className="text-sm">{item.description}</p>
                    )}
                    {item.notes && (
                      <div className="bg-blue-50 p-2 rounded text-sm">
                        <strong>Notes:</strong> {item.notes}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="meeting-view" className="space-y-4">
          <div className="space-y-6">
            {agendaSections
              .filter(section => section.is_active)
              .map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {section.order}. {section.title}
                      </span>
                    </CardTitle>
                    {section.description && (
                      <p className="text-muted-foreground">{section.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {getItemsForSection(section.id).map((item) => (
                      <div key={item.id} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex items-start gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleItemCompletion(item)}
                            disabled={!isHost && meetingStatus !== "ongoing"}
                          >
                            {item.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                            {item.notes && (
                              <div className="bg-yellow-50 p-2 rounded mt-2 text-sm">
                                <strong>Host Notes:</strong> {item.notes}
                              </div>
                            )}
                            {item.allocated_minutes > 0 && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                <Clock className="w-3 h-3" />
                                {item.allocated_minutes} minutes allocated
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

            {getUnsectionedItems().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getUnsectionedItems().map((item) => (
                    <div key={item.id} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex items-start gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleItemCompletion(item)}
                          disabled={!isHost && meetingStatus !== "ongoing"}
                        >
                          {item.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                          {item.notes && (
                            <div className="bg-yellow-50 p-2 rounded mt-2 text-sm">
                              <strong>Host Notes:</strong> {item.notes}
                            </div>
                          )}
                          {item.allocated_minutes > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                              <Clock className="w-3 h-3" />
                              {item.allocated_minutes} minutes allocated
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
