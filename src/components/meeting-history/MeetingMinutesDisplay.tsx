"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MeetingMinutes } from "@/store/meeting/meeting.types"
import {
  FileText,
  User,
  Calendar,
  CheckCircle,
  Clock,
  Edit
} from "lucide-react"
import { useLanguage } from "@/components/language/language-provider"

interface MeetingMinutesDisplayProps {
  minutes: MeetingMinutes | null | undefined
}

export function MeetingMinutesDisplay({ minutes }: MeetingMinutesDisplayProps) {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "sw" ? "sw-TZ" : "en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!minutes) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">{tt("No Minutes Available", "Hakuna Kumbukumbu")}</h3>
          <p className="text-muted-foreground">
            {tt("Meeting minutes have not been created for this meeting yet.", "Kumbukumbu za kikao hiki bado hazijaundwa.")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Minutes Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {tt("Meeting Minutes", "Kumbukumbu za Kikao")}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {minutes.prepared_by && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{tt("Prepared by:", "Imeandaliwa na:")} {minutes.prepared_by_email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{tt("Created:", "Imeundwa:")} {formatDate(minutes.created_at)}</span>
                </div>
                {minutes.updated_at !== minutes.created_at && (
                  <div className="flex items-center gap-1">
                    <Edit className="w-4 h-4" />
                    <span>{tt("Updated:", "Imesasishwa:")} {formatDate(minutes.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={minutes.approved ? "default" : "secondary"}>
                {minutes.approved ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {tt("Approved", "Imeidhinishwa")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {tt("Draft", "Rasimu")}
                  </span>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border">
              {minutes.content || (
                <p className="text-muted-foreground italic">
                  {tt("No content has been added to the minutes yet.", "Hakuna maudhui yaliyoongezwa kwenye kumbukumbu bado.")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minutes Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{tt("Minutes Information", "Taarifa za Kumbukumbu")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">{tt("Status & Metadata", "Hali na Taarifa")}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tt("Status:", "Hali:")}</span>
                  <Badge variant={minutes.approved ? "default" : "secondary"}>
                    {minutes.approved ? tt("Approved", "Imeidhinishwa") : tt("Draft", "Rasimu")}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tt("Word Count:", "Idadi ya Maneno:")}</span>
                  <span>{minutes.content.split(/\s+/).length} {tt("words", "maneno")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tt("Character Count:", "Idadi ya Herufi:")}</span>
                  <span>{minutes.content.length} {tt("characters", "herufi")}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">{tt("Timeline", "Mfuatano wa Muda")}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tt("Created:", "Imeundwa:")}</span>
                  <span>{formatDate(minutes.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tt("Last Updated:", "Imesasishwa Mwisho:")}</span>
                  <span>{formatDate(minutes.updated_at)}</span>
                </div>
                {minutes.updated_at !== minutes.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tt("Time Since Creation:", "Muda Tangu Kuundwa:")}</span>
                    <span>
                      {Math.round(
                        (new Date(minutes.updated_at).getTime() - new Date(minutes.created_at).getTime())
                        / (1000 * 60 * 60 * 24)
                      )} {tt("days", "siku")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {minutes.prepared_by && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">{tt("Prepared By", "Imeandaliwa Na")}</h4>
              <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium">{minutes.prepared_by_email}</div>
                    <div className="text-sm text-muted-foreground">
                      {tt("Meeting Host", "Mwenyeji wa Kikao")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
