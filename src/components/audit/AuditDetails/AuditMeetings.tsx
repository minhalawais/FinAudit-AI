"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Button } from "../../ui/button.tsx"
import {
  Calendar,
  Clock,
  Plus,
  Video,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useAxios } from "../../../hooks/useAxios.ts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../ui/dialog.tsx"
import { Input } from "../../ui/input.tsx"
import { Textarea } from "../../ui/textarea.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select.tsx"
import { Label } from "../../ui/label.tsx"
import { useToast } from "../../../utils/toast.tsx"

interface Meeting {
  id: number
  title: string
  meeting_type: string
  scheduled_time: string
  status: string
  duration_minutes?: number
  location?: string
  meeting_url?: string
  recording_url?: string
  notes?: string
  meeting_objectives?: string
  meeting_outcomes?: string
  is_recurring?: boolean
  attendees: {
    id: number
    user: {
      id: number
      name: string
      email: string
      role: string
    }
    has_confirmed: boolean
    attended: boolean
  }[]
  agenda_items: {
    id: number
    title: string
    description: string
    time_allocation: number
    is_completed: boolean
  }[]
  has_minutes: boolean
}

interface AuditMeetingsProps {
  auditId: number
  currentUserRole: string
}

const AuditMeetings: React.FC<AuditMeetingsProps> = ({ auditId }) => {
  const currentUserRole = localStorage.getItem("userRole") || ""

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [meetingToCompleteId, setMeetingToCompleteId] = useState<number | null>(null)
  const [meetingOutcomes, setMeetingOutcomes] = useState<string>("")
  const [meetingNotes, setMeetingNotes] = useState<string>("")
  const [meetingRecordingUrl, setMeetingRecordingUrl] = useState<string>("")
  const [expandedMeetingId, setExpandedMeetingId] = useState<number | null>(null)
  const axios = useAxios()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    meeting_type: "kickoff",
    scheduled_time: "",
    duration_minutes: 60,
    location: "",
    meeting_url: "",
    meeting_objectives: "",
    is_recurring: false,
    attendee_emails: [] as string[],
    agenda_items: [] as Array<{ title: string; description: string; time_allocation: number }>,
  })

  useEffect(() => {
    fetchMeetings()
  }, [auditId])

  const fetchMeetings = async () => {
    try {
      const response = await axios.get(`/api/audits/${auditId}/meetings`)
      setMeetings(response.data.meetings || [])
    } catch (error: any) {
      console.error("Error fetching meetings:", error)
      const errorMessage = error.response?.data?.detail || "Failed to fetch meetings"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "scheduled":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
      case "cancelled":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case "kickoff":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "review":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
      case "closing":
        return "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20"
      default:
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
    }
  }

  const handleCreateMeeting = async () => {
    try {
      const response = await axios.post(`/api/audits/${auditId}/meetings`, formData)
      setMeetings([...meetings, response.data.meeting])
      setShowCreateModal(false)
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      })
    } catch (error: any) {
      console.error("Error creating meeting:", error)
      const errorMessage = error.response?.data?.detail || "Failed to schedule meeting"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCompleteMeeting = (meetingId: number) => {
    setMeetingToCompleteId(meetingId)
    setShowCompleteModal(true)
    const meeting = meetings.find((m) => m.id === meetingId)
    if (meeting) {
      setMeetingOutcomes(meeting.meeting_outcomes || "")
      setMeetingNotes(meeting.notes || "")
      setMeetingRecordingUrl(meeting.recording_url || "")
    }
  }

  const handleConfirmCompleteMeeting = async () => {
    if (meetingToCompleteId === null) return

    try {
      const response = await axios.post(`/api/audits/meetings/${meetingToCompleteId}/complete`, {
        meeting_outcomes: meetingOutcomes,
        notes: meetingNotes,
        recording_url: meetingRecordingUrl,
      })
      setMeetings(
        meetings.map((m) =>
          m.id === meetingToCompleteId
            ? {
                ...m,
                status: "completed",
                meeting_outcomes: meetingOutcomes,
                notes: meetingNotes,
                recording_url: meetingRecordingUrl,
              }
            : m,
        ),
      )
      setShowCompleteModal(false)
      setMeetingToCompleteId(null)
      setMeetingOutcomes("")
      setMeetingNotes("")
      setMeetingRecordingUrl("")
      toast({
        title: "Success",
        description: "Meeting marked as completed with outcomes",
      })
    } catch (error: any) {
      console.error("Error completing meeting:", error)
      const errorMessage = error.response?.data?.detail || "Failed to complete meeting"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCancelMeeting = async (meetingId: number) => {
    try {
      await axios.put(`/api/audits/meetings/${meetingId}`, { status: "cancelled" })
      setMeetings(meetings.map((m) => (m.id === meetingId ? { ...m, status: "cancelled" } : m)))
      toast({
        title: "Success",
        description: "Meeting cancelled successfully",
      })
    } catch (error: any) {
      console.error("Error cancelling meeting:", error)
      const errorMessage = error.response?.data?.detail || "Failed to cancel meeting"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const toggleExpandMeeting = (meetingId: number) => {
    setExpandedMeetingId(expandedMeetingId === meetingId ? null : meetingId)
  }

  const canManageMeetings = () => {
    return currentUserRole === "admin" || currentUserRole === "auditor"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#E2E8F0] border-t-[#003366]"></div>
          <p className="text-[#64748B] font-medium">Loading meetings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#003366] to-[#004D99] bg-clip-text text-transparent">
            Audit Meetings
          </h2>
          <p className="text-[#64748B] mt-2">Schedule and manage audit meetings with your team</p>
        </div>
        {canManageMeetings() && (
          <Button
            className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        )}
      </div>

      {meetings.length === 0 ? (
        <Card className="border-[#E2E8F0] shadow-sm rounded-xl bg-white">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-[#64748B]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No meetings scheduled</h3>
            <p className="text-[#64748B] mb-6">Schedule meetings to coordinate with your audit team</p>
            {canManageMeetings() && (
              <Button
                className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white shadow-md"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule First Meeting
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {meetings.map((meeting) => (
            <Card
              key={meeting.id}
              className="border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 bg-white rounded-xl overflow-hidden"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CardTitle className="text-xl font-semibold text-[#1E293B]">{meeting.title}</CardTitle>
                      <Badge className={`${getMeetingTypeColor(meeting.meeting_type)} border font-medium`}>
                        {meeting.meeting_type.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-[#64748B]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(meeting.scheduled_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(meeting.scheduled_time).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{meeting.attendees.length} attendees</span>
                      </div>
                      {meeting.has_minutes && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>Minutes available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(meeting.status)} border font-medium`}>
                      {meeting.status.toUpperCase()}
                    </Badge>

                    <div className="flex gap-2">
                      {meeting.meeting_url && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white rounded-md shadow-sm"
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-white rounded-md"
                        onClick={() => {
                          setSelectedMeeting(meeting)
                          setShowDetailsModal(true)
                        }}
                      >
                        Details
                      </Button>
                      {canManageMeetings() && meeting.status === "scheduled" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-white rounded-md"
                            onClick={() => handleCompleteMeeting(meeting.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#DC2626]/20 text-[#DC2626] hover:text-[#DC2626] transition-all duration-200 bg-white rounded-md"
                            onClick={() => handleCancelMeeting(meeting.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedMeetingId === meeting.id && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {meeting.meeting_objectives && (
                      <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                        <h4 className="font-medium text-[#1E293B] mb-2">Objectives</h4>
                        <p className="text-sm text-[#64748B]">{meeting.meeting_objectives}</p>
                      </div>
                    )}

                    <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <h4 className="font-medium text-[#1E293B] mb-2">Agenda</h4>
                      <div className="space-y-3">
                        {meeting.agenda_items.map((item) => (
                          <div key={item.id} className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 mt-2 rounded-full ${item.is_completed ? "bg-[#059669]" : "bg-[#94A3B8]"}`}
                            ></div>
                            <div>
                              <p className="text-sm font-medium text-[#1E293B]">{item.title}</p>
                              {item.description && <p className="text-xs text-[#64748B] mt-1">{item.description}</p>}
                              <p className="text-xs text-[#64748B] mt-1">{item.time_allocation} mins</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <h4 className="font-medium text-[#1E293B] mb-2">Attendees</h4>
                      <div className="space-y-3">
                        {meeting.attendees.map((attendee) => (
                          <div key={attendee.id} className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${attendee.attended ? "bg-[#059669]" : attendee.has_confirmed ? "bg-[#3B82F6]" : "bg-[#94A3B8]"}`}
                            ></div>
                            <div>
                              <p className="text-sm font-medium text-[#1E293B]">{attendee.user.name}</p>
                              <p className="text-xs text-[#64748B]">
                                {attendee.user.email} • {attendee.user.role}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}

              <CardContent className="pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#3B82F6] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-md"
                  onClick={() => toggleExpandMeeting(meeting.id)}
                >
                  {expandedMeetingId === meeting.id ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show more
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Meeting Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-2xl rounded-xl shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1E293B]">Schedule New Meeting</DialogTitle>
            <DialogDescription className="text-[#64748B]">
              Fill in the details to schedule a new audit meeting
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[#1E293B] font-medium">
                  Meeting Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_type" className="text-[#1E293B] font-medium">
                  Meeting Type
                </Label>
                <Select
                  value={formData.meeting_type}
                  onValueChange={(value) => setFormData({ ...formData, meeting_type: value })}
                >
                  <SelectTrigger className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30">
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0] shadow-lg rounded-lg">
                    <SelectItem value="kickoff" className="hover:bg-[#F1F5F9]">
                      Kickoff
                    </SelectItem>
                    <SelectItem value="progress" className="hover:bg-[#F1F5F9]">
                      Progress
                    </SelectItem>
                    <SelectItem value="review" className="hover:bg-[#F1F5F9]">
                      Review
                    </SelectItem>
                    <SelectItem value="closing" className="hover:bg-[#F1F5F9]">
                      Closing
                    </SelectItem>
                    <SelectItem value="ad_hoc" className="hover:bg-[#F1F5F9]">
                      Ad-hoc
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_time" className="text-[#1E293B] font-medium">
                  Date & Time
                </Label>
                <Input
                  id="scheduled_time"
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_minutes" className="text-[#1E293B] font-medium">
                  Duration (minutes)
                </Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_minutes: Number.parseInt(e.target.value) || 60 })
                  }
                  className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-[#1E293B] font-medium">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Physical location or room"
                  className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_url" className="text-[#1E293B] font-medium">
                  Meeting URL
                </Label>
                <Input
                  id="meeting_url"
                  value={formData.meeting_url}
                  onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                  placeholder="Zoom, Teams, or Google Meet link"
                  className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_objectives" className="text-[#1E293B] font-medium">
                Objectives
              </Label>
              <Textarea
                id="meeting_objectives"
                value={formData.meeting_objectives}
                onChange={(e) => setFormData({ ...formData, meeting_objectives: e.target.value })}
                placeholder="What are the main objectives of this meeting?"
                className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30 min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#1E293B] font-medium">Agenda Items</Label>
              {formData.agenda_items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Input
                      placeholder="Agenda item title"
                      value={item.title}
                      onChange={(e) => {
                        const newAgenda = [...formData.agenda_items]
                        newAgenda[index].title = e.target.value
                        setFormData({ ...formData, agenda_items: newAgenda })
                      }}
                      className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30"
                    />
                  </div>
                  <div className="col-span-5 space-y-1">
                    <Input
                      placeholder="Description (optional)"
                      value={item.description}
                      onChange={(e) => {
                        const newAgenda = [...formData.agenda_items]
                        newAgenda[index].description = e.target.value
                        setFormData({ ...formData, agenda_items: newAgenda })
                      }}
                      className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30"
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Input
                      type="number"
                      placeholder="Mins"
                      value={item.time_allocation}
                      onChange={(e) => {
                        const newAgenda = [...formData.agenda_items]
                        newAgenda[index].time_allocation = Number.parseInt(e.target.value) || 10
                        setFormData({ ...formData, agenda_items: newAgenda })
                      }}
                      className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#DC2626] hover:text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg"
                      onClick={() => {
                        const newAgenda = [...formData.agenda_items]
                        newAgenda.splice(index, 1)
                        setFormData({ ...formData, agenda_items: newAgenda })
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 rounded-lg border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 bg-white"
                onClick={() =>
                  setFormData({
                    ...formData,
                    agenda_items: [...formData.agenda_items, { title: "", description: "", time_allocation: 10 }],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Agenda Item
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1E293B] font-medium">Attendees</Label>
              <div className="flex flex-wrap gap-2">
                {formData.attendee_emails.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-[#F1F5F9] px-3 py-1 rounded-full border border-[#E2E8F0]"
                  >
                    <span className="text-sm text-[#1E293B]">{email}</span>
                    <button
                      onClick={() => {
                        const newAttendees = [...formData.attendee_emails]
                        newAttendees.splice(index, 1)
                        setFormData({ ...formData, attendee_emails: newAttendees })
                      }}
                      className="text-[#64748B] hover:text-[#DC2626] ml-1"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add attendee email"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) {
                      if (!formData.attendee_emails.includes(e.currentTarget.value)) {
                        setFormData({
                          ...formData,
                          attendee_emails: [...formData.attendee_emails, e.currentTarget.value],
                        })
                        e.currentTarget.value = ""
                      }
                    }
                  }}
                  className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30"
                />
                <Button
                  variant="outline"
                  className="rounded-lg border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 bg-white"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Invite
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 bg-white"
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white rounded-lg shadow-md"
              onClick={handleCreateMeeting}
            >
              Schedule Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-3xl rounded-xl shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1E293B]">{selectedMeeting?.title}</DialogTitle>
            <DialogDescription className="text-[#64748B]">
              {selectedMeeting?.meeting_type.toUpperCase()} Meeting •{" "}
              {selectedMeeting && new Date(selectedMeeting.scheduled_time).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedMeeting && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-[#1E293B]">Status</Label>
                  <Badge className={`${getStatusColor(selectedMeeting.status)} w-fit rounded-full px-3 py-1 text-sm`}>
                    {selectedMeeting.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-[#1E293B]">Duration</Label>
                  <p className="text-[#64748B]">{selectedMeeting.duration_minutes} minutes</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-[#1E293B]">Location</Label>
                  <p className="text-[#64748B]">{selectedMeeting.location || "Virtual meeting"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-[#1E293B]">Meeting URL</Label>
                  {selectedMeeting.meeting_url ? (
                    <a
                      href={selectedMeeting.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3B82F6] hover:underline flex items-center gap-1"
                    >
                      <Video className="w-4 h-4" /> Join meeting
                    </a>
                  ) : (
                    <p className="text-[#64748B]">No meeting link provided</p>
                  )}
                </div>
                {selectedMeeting.recording_url && (
                  <div className="space-y-2">
                    <Label className="font-semibold text-[#1E293B]">Recording URL</Label>
                    <a
                      href={selectedMeeting.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3B82F6] hover:underline flex items-center gap-1"
                    >
                      <Video className="w-4 h-4" /> View Recording
                    </a>
                  </div>
                )}
              </div>

              {selectedMeeting.meeting_objectives && (
                <div className="space-y-2">
                  <Label className="font-semibold text-[#1E293B]">Objectives</Label>
                  <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <p className="text-sm text-[#64748B]">{selectedMeeting.meeting_objectives}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-semibold text-[#1E293B]">Agenda</Label>
                <div className="space-y-3">
                  {selectedMeeting.agenda_items.map((item) => (
                    <div key={item.id} className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-[#1E293B]">{item.title}</h4>
                        <span className="text-sm text-[#64748B]">{item.time_allocation} mins</span>
                      </div>
                      {item.description && <p className="text-sm text-[#64748B] mt-1">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-[#1E293B]">
                  Attendees ({selectedMeeting.attendees.length})
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {selectedMeeting.attendees.map((attendee) => (
                    <div key={attendee.id} className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${attendee.attended ? "bg-[#059669]" : attendee.has_confirmed ? "bg-[#3B82F6]" : "bg-[#94A3B8]"}`}
                        ></div>
                        <div>
                          <p className="font-medium text-[#1E293B]">{attendee.user.name}</p>
                          <p className="text-sm text-[#64748B]">{attendee.user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedMeeting.meeting_outcomes && (
                <div className="space-y-2">
                  <Label className="font-semibold text-[#1E293B]">Outcomes</Label>
                  <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <p className="text-sm text-[#64748B]">{selectedMeeting.meeting_outcomes}</p>
                  </div>
                </div>
              )}

              {selectedMeeting.notes && (
                <div className="space-y-2">
                  <Label className="font-semibold text-[#1E293B]">Notes</Label>
                  <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <p className="text-sm text-[#64748B]">{selectedMeeting.notes}</p>
                  </div>
                </div>
              )}

              <DialogFooter className="flex justify-end gap-2">
                {selectedMeeting.has_minutes && (
                  <Button
                    variant="outline"
                    className="rounded-lg border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 bg-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Minutes
                  </Button>
                )}
                {canManageMeetings() && (
                  <Button className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white rounded-lg shadow-md">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Meeting
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Meeting Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="sm:max-w-xl rounded-xl shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1E293B]">Complete Meeting</DialogTitle>
            <DialogDescription className="text-[#64748B]">
              Provide outcomes and any additional notes for the completed meeting.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meetingOutcomes" className="text-[#1E293B] font-medium">
                Meeting Outcomes
              </Label>
              <Textarea
                id="meetingOutcomes"
                value={meetingOutcomes}
                onChange={(e) => setMeetingOutcomes(e.target.value)}
                placeholder="Summarize the key outcomes and decisions from this meeting."
                className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30 min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingNotes" className="text-[#1E293B] font-medium">
                Additional Notes
              </Label>
              <Textarea
                id="meetingNotes"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Any other relevant notes or observations."
                className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30 min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingRecordingUrl" className="text-[#1E293B] font-medium">
                Meeting Recording URL (Optional)
              </Label>
              <Input
                id="meetingRecordingUrl"
                value={meetingRecordingUrl}
                onChange={(e) => setMeetingRecordingUrl(e.target.value)}
                placeholder="Link to the meeting recording (e.g., Zoom, Teams, Google Meet)."
                className="rounded-lg border-[#E2E8F0] focus:border-[#003366] focus:ring-1 focus:ring-[#003366]/30"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCompleteModal(false)}
              className="rounded-lg border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 bg-white"
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white rounded-lg shadow-md"
              onClick={handleConfirmCompleteMeeting}
            >
              Confirm Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AuditMeetings