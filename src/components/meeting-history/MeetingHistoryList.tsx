import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface MeetingHistoryListProps {
  onMeetingSelect?: (meetingId: string) => void
  groupId?: string
}

export function MeetingHistoryList({ onMeetingSelect, groupId }: MeetingHistoryListProps) {
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
        : "Failed to load meeting history"
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading meeting history...</div>
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
            Meeting History Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start date"
            />

            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End date"
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
              <h3 className="text-lg font-medium mb-2">No meetings found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter || startDate || endDate
                  ? "Try adjusting your filters"
                  : "No meetings have been scheduled yet"}
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

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
