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
import { useLanguage } from "@/components/language/language-provider"

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
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
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
        toast.success(tt("Agenda section updated successfully", "Sehemu ya ajenda imesasishwa"))
      } else {
        await meetingServices.createAgendaSection(payload)
        toast.success(tt("Agenda section created successfully", "Sehemu ya ajenda imeundwa"))
      }

      onSuccess?.()
      form.reset()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || tt("Failed to save agenda section", "Imeshindikana kuhifadhi sehemu ya ajenda"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData?.id ? tt("Edit Agenda Section", "Hariri Sehemu ya Ajenda") : tt("Create Agenda Section", "Unda Sehemu ya Ajenda")}
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
                  <FormLabel>{tt("Title", "Kichwa")}</FormLabel>
                  <FormControl>
                    <Input placeholder={tt("Section title", "Kichwa cha sehemu")} {...field} />
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
                  <FormLabel>{tt("Description", "Maelezo")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={tt("Section description (optional)", "Maelezo ya sehemu (si lazima)")}
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
                  <FormLabel>{tt("Order", "Mpangilio")}</FormLabel>
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
                    <FormLabel>{tt("Active", "Inatumika")}</FormLabel>
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
