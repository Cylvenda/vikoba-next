import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MeetingAuditLog } from "@/store/meeting/meeting.types"
import {
  History,
  User,
  Calendar,
  Activity,
  Info
} from "lucide-react"

interface MeetingAuditLogDisplayProps {
  auditLogs: MeetingAuditLog[]
}

export function MeetingAuditLogDisplay({ auditLogs }: MeetingAuditLogDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionColor = (action: string) => {
    if (action.includes('created') || action.includes('started')) {
      return "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300"
    }
    if (action.includes('ended') || action.includes('deleted')) {
      return "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
    }
    if (action.includes('updated') || action.includes('completed')) {
      return "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300"
    }
    return "bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300"
  }

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return <Activity className="w-4 h-4" />
    if (action.includes('started')) return <Activity className="w-4 h-4" />
    if (action.includes('ended')) return <Activity className="w-4 h-4" />
    if (action.includes('updated')) return <Activity className="w-4 h-4" />
    if (action.includes('deleted')) return <Activity className="w-4 h-4" />
    return <History className="w-4 h-4" />
  }

  const formatActionText = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const groupLogsByDate = (logs: MeetingAuditLog[]) => {
    const grouped: Record<string, MeetingAuditLog[]> = {}

    logs.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(log)
    })

    return grouped
  }

  const groupedLogs = groupLogsByDate(auditLogs)
  const sortedDates = Object.keys(groupedLogs).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )

  const actionSummary = auditLogs.reduce((summary, log) => {
    const actionType = log.action.split('_')[0]
    summary[actionType] = (summary[actionType] || 0) + 1
    return summary
  }, {} as Record<string, number>)

  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Activity Log</h3>
          <p className="text-muted-foreground">
            No activity has been recorded for this meeting yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{auditLogs.length}</div>
              <div className="text-sm text-muted-foreground">Total Actions</div>
            </div>
            {Object.entries(actionSummary).slice(0, 3).map(([action, count]) => (
              <div key={action} className="text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground capitalize">{action}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium">{date}</h3>
                  <Badge variant="outline">
                    {groupedLogs[date].length} actions
                  </Badge>
                </div>

                <div className="space-y-2 pl-6">
                  {groupedLogs[date].map((log) => (
                    <div key={log.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getActionIcon(log.action)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getActionColor(log.action)}>
                              {formatActionText(log.action)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(log.created_at)}
                            </span>
                          </div>

                          {log.user_email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                              <User className="w-3 h-3" />
                              <span>{log.user_email}</span>
                            </div>
                          )}

                          {/* Metadata Display */}
                          {Object.keys(log.metadata).length > 0 && (
                            <details className="cursor-pointer">
                              <summary className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-2">
                                View details
                              </summary>
                              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                                {Object.entries(log.metadata).map(([key, value]) => (
                                  <div key={key} className="mb-1">
                                    <span className="font-medium">{key}:</span>
                                    <span className="ml-2 text-muted-foreground">
                                      {typeof value === 'object'
                                        ? JSON.stringify(value, null, 2)
                                        : String(value)
                                      }
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Activity Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Most Common Actions</h4>
              <div className="space-y-2">
                {Object.entries(actionSummary)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([action, count]) => (
                    <div key={action} className="flex justify-between">
                      <span className="capitalize">{action}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Timeline Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Activity:</span>
                  <span>{formatDate(auditLogs[auditLogs.length - 1]?.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Activity:</span>
                  <span>{formatDate(auditLogs[0]?.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Days:</span>
                  <span>{sortedDates.length}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
