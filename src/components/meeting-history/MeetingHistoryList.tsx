import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker, formatDateToString, parseDateString } from "@/components/ui/date-picker"
import { meetingServices } from "@/api/services/meeting.service"
import { MeetingListHistory, MeetingStatus } from "@/store/meeting/meeting.types"
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  FileText,
  Filter,
  Search,
  Eye,
  TrendingUp
} from "lucide-react"
import { toast } from "react-toastify"
import { useLanguage } from "@/components/language/language-provider"

interface MeetingHistoryListProps {
  onMeetingSelect?: (meetingId: string) => void
  groupId?: string
}

export function MeetingHistoryList({ onMeetingSelect, groupId }: MeetingHistoryListProps) {
  const { language } = useLanguage()
  const tt = (en: string, sw: string) => language === "sw" ? sw : en
  const [meetings, setMeetings] = useState<MeetingListHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const loadMeetings = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const response = await meetingServices.getMeetingHistoryList(params)
      setMeetings(response.data)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as any).response?.data?.detail
        : tt("Failed to load meeting history", "Imeshindikana kupakia historia ya mikutano")
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMeetings()
  }, [statusFilter, startDate, endDate])

  const filteredMeetings = meetings.filter((meeting: MeetingListHistory) => {
    const matchesSearch = searchTerm === "" ||
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGroup = !groupId || meeting.group === groupId

    return matchesSearch && matchesGroup
  })

  const getStatusColor = (status: MeetingStatus) => {
    switch (status) {
      case "scheduled": return "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300"
      case "ongoing": return "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300"
      case "ended": return "bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300"
      case "cancelled": return "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
      default: return "bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status: MeetingStatus) => {
    switch (status) {
      case "scheduled": return <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case "ongoing": return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
      case "ended": return <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      case "cancelled": return <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
      default: return <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "sw" ? "sw-TZ" : "en-US", {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(language === "sw" ? "sw-TZ" : "en-US", {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">{tt("Loading meeting history...", "Inapakia historia ya mikutano...")}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {tt("Meeting History Filters", "Vichujio vya Historia ya Mikutano")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tt("Search meetings...", "Tafuta mikutano...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={tt("Filter by status", "Chuja kwa hali")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{tt("All Statuses", "Hali Zote")}</SelectItem>
                <SelectItem value="scheduled">{tt("Scheduled", "Imepangwa")}</SelectItem>
                <SelectItem value="ongoing">{tt("Ongoing", "Inaendelea")}</SelectItem>
                <SelectItem value="ended">{tt("Ended", "Imemalizika")}</SelectItem>
                <SelectItem value="cancelled">{tt("Cancelled", "Imeghairiwa")}</SelectItem>
              </SelectContent>
            </Select>

            <DatePicker
              value={parseDateString(startDate)}
              onChange={(date) => setStartDate(formatDateToString(date))}
              placeholder={tt("Start date", "Tarehe ya kuanza")}
            />

            <DatePicker
              value={parseDateString(endDate)}
              onChange={(date) => setEndDate(formatDateToString(date))}
              placeholder={tt("End date", "Tarehe ya mwisho")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Meeting List */}
      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">{tt("No meetings found", "Hakuna mikutano iliyopatikana")}</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter || startDate || endDate
                  ? tt("Try adjusting your filters", "Jaribu kubadilisha vichujio")
                  : tt("No meetings have been scheduled yet", "Hakuna mikutano iliyopangwa bado")}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{meeting.title}</h3>
                      <Badge className={getStatusColor(meeting.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(meeting.status)}
                          {meeting.status}
                        </span>
                      </Badge>
                    </div>

                    {meeting.description && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {meeting.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 gap-4 text-sm min-[400px]:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(meeting.scheduled_start)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{formatTime(meeting.scheduled_start)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {meeting.present_attendees}/{meeting.total_attendees} present
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {meeting.agenda_completion_percentage}% complete
                        </span>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {meeting.meeting_duration_minutes > 0 && (
                        <Badge variant="outline">
                          Duration: {meeting.meeting_duration_minutes}m
                        </Badge>
                      )}

                      {meeting.agenda_items_count > 0 && (
                        <Badge variant="outline">
                          {meeting.agenda_items_count} agenda items
                        </Badge>
                      )}

                      {meeting.has_minutes && (
                        <Badge variant="outline">
                          <FileText className="w-3 h-3 mr-1" />
                          Minutes available
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMeetingSelect?.(meeting.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
