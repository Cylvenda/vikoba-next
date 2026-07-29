"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AgendaSection, AgendaItem } from "@/store/meeting/meeting.types"
import {
  Target,
  Clock,
  CheckCircle,
  Circle,
  FileText,
  Layers,
  Timer
} from "lucide-react"
import { useLanguage } from "@/components/language/language-provider"

interface MeetingAgendaHistoryProps {
  agendaSections: AgendaSection[]
  agendaItems: AgendaItem[]
}

export function MeetingAgendaHistory({ agendaSections, agendaItems }: MeetingAgendaHistoryProps) {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  const getItemsForSection = (sectionId: string): AgendaItem[] => {
    return agendaItems
      .filter(item => item.section === sectionId)
      .sort((a, b) => a.order - b.order)
  }

  const getUnsectionedItems = (): AgendaItem[] => {
    return agendaItems
      .filter(item => !item.section)
      .sort((a, b) => a.order - b.order)
  }

  const totalItems = agendaItems.length
  const completedItems = agendaItems.filter(item => item.completed).length
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  const totalAllocatedTime = agendaItems.reduce((sum, item) => sum + item.allocated_minutes, 0)

  // Sort sections by order
  const sortedSections = agendaSections
    .filter(section => section.is_active)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      {/* Agenda Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {tt("Agenda Summary", "Muhtasari wa Ajenda")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalItems}</div>
              <div className="text-sm text-muted-foreground">{tt("Total Items", "Jumla ya Hoja")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedItems}</div>
              <div className="text-sm text-muted-foreground">{tt("Completed", "Zilizokamilika")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">{tt("Completion", "Ukamilishaji")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalAllocatedTime}m</div>
              <div className="text-sm text-muted-foreground">{tt("Allocated Time", "Muda Uliopangwa")}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-green-600 dark:bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-center text-sm text-muted-foreground mt-2">
              {completionPercentage}% {tt("of agenda items completed", "ya hoja za ajenda zimekamilika")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agenda Sections */}
      {sortedSections.length === 0 && getUnsectionedItems().length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">{tt("No Agenda Items", "Hakuna Hoja za Ajenda")}</h3>
            <p className="text-muted-foreground">
              {tt("This meeting did not have any structured agenda items.", "Kikao hiki hakikuwa na hoja za ajenda zilizopangwa.")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedSections.map((section) => (
            <Card key={section.id} className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
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
                  <Badge variant="outline">
                    {getItemsForSection(section.id).length} {tt("items", "hoja")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {getItemsForSection(section.id).map((item) => (
                  <AgendaItemRow key={item.id} item={item} language={language} />
                ))}
                {getItemsForSection(section.id).length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    {tt("No items in this section", "Hakuna hoja katika sehemu hii")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Unsectioned Items */}
          {getUnsectionedItems().length > 0 && (
            <Card className="border-l-4 border-l-gray-400 dark:border-l-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{tt("Additional Items", "Hoja za Ziada")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getUnsectionedItems().map((item) => (
                  <AgendaItemRow key={item.id} item={item} language={language} />
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
  language?: "en" | "sw"
}

function AgendaItemRow({ item, language = "en" }: AgendaItemRowProps) {
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {item.completed ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>

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
                {tt("Completed", "Imekamilika")}
              </Badge>
            )}
          </div>

          {item.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {item.description}
            </p>
          )}

          {/* Notes Section */}
{item.notes && (
          <div className="mt-3 bg-blue-50 dark:bg-blue-950/50 p-3 rounded text-sm">
            <div className="flex items-center mb-1">
              <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400 mr-1" />
              <strong className="text-blue-800 dark:text-blue-300">{tt("Host Notes:", "Maelezo ya Mwenyeji:")}</strong>
            </div>
            <p className="text-blue-700 dark:text-blue-400 whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}

          {/* Completion Details */}
          {item.completed && (
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                <span>{tt("Completed at", "Imekamilika saa")} {item.completed_at ? new Date(item.completed_at).toLocaleString(language === "sw" ? "sw-TZ" : "en-US") : tt("Unknown time", "Muda haujulikani")}</span>
              </div>
              {item.completed_by_email && (
                <div className="flex items-center gap-2">
                  <Timer className="w-3 h-3" />
                  <span>{tt("Completed by", "Imekamilishwa na")} {item.completed_by_email}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
