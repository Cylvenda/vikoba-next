import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { meetingServices } from "@/api/services/meeting.service"
import { toast } from "react-toastify"

const agendaSectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  order: z.number().min(1, "Order must be at least 1"),
  is_active: z.boolean().optional(),
})

type AgendaSectionFormData = z.infer<typeof agendaSectionSchema> & {
  id?: string
}

interface AgendaSectionFormProps {
  meetingId: string
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<AgendaSectionFormData>
}

export function AgendaSectionForm({
  meetingId,
  onSuccess,
  onCancel,
  initialData
}: AgendaSectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AgendaSectionFormData>({
    resolver: zodResolver(agendaSectionSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      order: initialData?.order || 1,
      is_active: initialData?.is_active ?? true,
    },
  })

  const handleSubmit = async (data: AgendaSectionFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        meeting: meetingId,
        ...data,
      }

      if (initialData?.id) {
        await meetingServices.updateAgendaSection(initialData.id, payload)
        toast.success("Agenda section updated successfully")
      } else {
        await meetingServices.createAgendaSection(payload)
        toast.success("Agenda section created successfully")
      }

      onSuccess?.()
      form.reset()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save agenda section")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData?.id ? "Edit Agenda Section" : "Create Agenda Section"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Section title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Section description (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Whether this section is active and visible
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

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? (initialData?.id ? "Updating..." : "Creating...")
                  : (initialData?.id ? "Update Section" : "Create Section")
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
