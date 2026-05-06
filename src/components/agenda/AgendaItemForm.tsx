import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { meetingServices } from "@/api/services/meeting.service"
import { AgendaSection } from "@/store/meeting/meeting.types"
import { toast } from "react-toastify"

const agendaItemSchema = z.object({
  section: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
  order: z.number().min(1, "Order must be at least 1"),
  allocated_minutes: z.number().min(0, "Allocated minutes must be at least 0"),
  completed: z.boolean().optional(),
})

type AgendaItemFormData = z.infer<typeof agendaItemSchema>

interface AgendaItemFormProps {
  meetingId: string
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<AgendaItemFormData> & { id?: string }
  isHost?: boolean
  meetingStatus?: string
}

export function AgendaItemForm({
  meetingId,
  onSuccess,
  onCancel,
  initialData,
  isHost = false,
  meetingStatus = "scheduled"
}: AgendaItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agendaSections, setAgendaSections] = useState<AgendaSection[]>([])

  const form = useForm<AgendaItemFormData>({
    resolver: zodResolver(agendaItemSchema),
    defaultValues: {
      section: initialData?.section || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      notes: initialData?.notes || "",
      order: initialData?.order || 1,
      allocated_minutes: initialData?.allocated_minutes || 0,
      completed: initialData?.completed || false,
    },
  })

  useEffect(() => {
    const loadAgendaSections = async () => {
      try {
        const response = await meetingServices.getAgendaSections(meetingId)
        setAgendaSections(response.data.filter(section => section.is_active))
      } catch (error) {
        console.error("Failed to load agenda sections:", error)
      }
    }
    loadAgendaSections()
  }, [meetingId])

  const handleSubmit = async (data: AgendaItemFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        meeting: meetingId,
        ...data,
      }

      if (initialData?.id) {
        await meetingServices.updateAgendaItem(initialData.id, payload)
        toast.success("Agenda item updated successfully")
      } else {
        await meetingServices.createAgendaItem(payload)
        toast.success("Agenda item created successfully")
      }

      onSuccess?.()
      form.reset()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save agenda item")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canEditAllFields = isHost || meetingStatus === "scheduled"
  const canEditCompletionAndNotes = meetingStatus === "ongoing"

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData?.id ? "Edit Agenda Item" : "Create Agenda Item"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {agendaSections.length > 0 && canEditAllFields && (
              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a section (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No section</SelectItem>
                        {agendaSections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.order}. {section.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {canEditAllFields && (
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Agenda item title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {canEditAllFields && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Item description (optional)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes for this agenda item (visible during meeting)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canEditAllFields && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allocated_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allocated Minutes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {(canEditAllFields || canEditCompletionAndNotes) && (
              <FormField
                control={form.control}
                name="completed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Completed</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Mark this agenda item as completed
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? (initialData?.id ? "Updating..." : "Creating...")
                  : (initialData?.id ? "Update Item" : "Create Item")
                }
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
