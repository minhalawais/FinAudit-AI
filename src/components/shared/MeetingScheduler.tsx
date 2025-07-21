"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Calendar, Clock, Users, MapPin, Plus, Edit, Trash2, Video } from "lucide-react"

interface Meeting {
  id: number
  title: string
  meeting_type: "kickoff" | "progress" | "urgent" | "exit" | "ad_hoc"
  scheduled_time: string
  end_time: string | null
  duration_minutes: number
  location: string | null
  notes: string | null
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  attendees: Array<{
    id: number
    user: {
      id: number
      name: string
      email: string
    }
    is_required: boolean
    has_confirmed: boolean
  }>
  agenda_items: Array<{
    id: number
    title: string
    description: string
    time_allocation: number
    is_completed: boolean
  }>
}

interface NewMeeting {
  title: string
  meeting_type: "kickoff" | "progress" | "urgent" | "exit" | "ad_hoc"
  scheduled_time: string
  duration_minutes: number
  location: string
  notes: string
  attendee_emails: string[]
}

const MeetingScheduler: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [newMeeting, setNewMeeting] = useState<NewMeeting>({
    title: "",
    meeting_type: "progress",
    scheduled_time: "",
    duration_minutes: 60,
    location: "",
    notes: "",
    attendee_emails: [],
  })
  const [createLoading, setCreateLoading] = useState(false)

  useEffect(() => {
    if (auditId) {
      fetchMeetings()
    }
  }, [auditId])

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/audits/${auditId}/meetings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setMeetings(data.meetings || [])
    } catch (error) {
      console.error("Error fetching meetings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMeeting = async () => {
    if (!newMeeting.title.trim() || !newMeeting.scheduled_time) {
      alert("Please fill in all required fields")
      return
    }

    setCreateLoading(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/audits/${auditId}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...newMeeting,
          scheduled_time: new Date(newMeeting.scheduled_time).toISOString(),
        }),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewMeeting({
          title: "",
          meeting_type: "progress",
          scheduled_time: "",
          duration_minutes: 60,
          location: "",
          notes: "",
          attendee_emails: [],
        })
        fetchMeetings()
        alert("Meeting scheduled successfully!")
      } else {
        const error = await response.json()
        alert(error.detail || "Failed to schedule meeting")
      }
    } catch (error) {
      alert("Network error occurred")
    } finally {
      setCreateLoading(false)
    }
  }

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case "kickoff":
        return "bg-[#059669] text-white"
      case "progress":
        return "bg-[#F59E0B] text-white"
      case "urgent":
        return "bg-[#DC2626] text-white"
      case "exit":
        return "bg-[#8B5CF6] text-white"
      default:
        return "bg-[#64748B] text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-[#F59E0B] bg-opacity-10 text-[#F59E0B]"
      case "in_progress":
        return "bg-[#3B82F6] bg-opacity-10 text-[#3B82F6]"
      case "completed":
        return "bg-[#059669] bg-opacity-10 text-[#059669]"
      case "cancelled":
        return "bg-[#DC2626] bg-opacity-10 text-[#DC2626]"
      default:
        return "bg-[#64748B] bg-opacity-10 text-[#64748B]"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Meeting Scheduler</h1>
            <p className="text-[#64748B]">Schedule and manage audit meetings</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
          <Calendar className="w-16 h-16 text-[#64748B] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-[#1E293B] mb-2">No meetings scheduled</h3>
          <p className="text-[#64748B] mb-6">Schedule your first meeting to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all"
          >
            Schedule First Meeting
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#1E293B]">{meeting.title}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getMeetingTypeColor(meeting.meeting_type)}`}
                    >
                      {meeting.meeting_type.replace("_", " ").toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(meeting.status)}`}>
                      {meeting.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(meeting.scheduled_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(meeting.scheduled_time).toLocaleTimeString()} ({meeting.duration_minutes} min)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <Users className="w-4 h-4" />
                      <span>{meeting.attendees.length} attendees</span>
                    </div>
                  </div>

                  {meeting.location && (
                    <div className="flex items-center gap-2 text-[#64748B] mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{meeting.location}</span>
                    </div>
                  )}

                  {meeting.notes && <p className="text-[#64748B] mb-4">{meeting.notes}</p>}

                  {/* Attendees */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-[#1E293B]">Attendees:</span>
                    <div className="flex -space-x-2">
                      {meeting.attendees.slice(0, 5).map((attendee) => (
                        <div
                          key={attendee.id}
                          className="w-8 h-8 bg-gradient-to-r from-[#003366] to-[#004D99] rounded-full flex items-center justify-center border-2 border-white text-white text-xs font-medium"
                          title={attendee.user.name}
                        >
                          {attendee.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      ))}
                      {meeting.attendees.length > 5 && (
                        <div className="w-8 h-8 bg-[#64748B] rounded-full flex items-center justify-center border-2 border-white text-white text-xs">
                          +{meeting.attendees.length - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agenda Items */}
                  {meeting.agenda_items.length > 0 && (
                    <div>
                      <h4 className="font-medium text-[#1E293B] mb-2">Agenda ({meeting.agenda_items.length} items)</h4>
                      <div className="space-y-2">
                        {meeting.agenda_items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded">
                            <span className="text-sm text-[#1E293B]">{item.title}</span>
                            <span className="text-xs text-[#64748B]">{item.time_allocation} min</span>
                          </div>
                        ))}
                        {meeting.agenda_items.length > 3 && (
                          <p className="text-sm text-[#64748B] text-center">
                            +{meeting.agenda_items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-[#1E293B] mb-4">Schedule New Meeting</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Meeting Title *</label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Enter meeting title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Meeting Type *</label>
                <select
                  value={newMeeting.meeting_type}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, meeting_type: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="kickoff">Kickoff Meeting</option>
                  <option value="progress">Progress Review</option>
                  <option value="urgent">Urgent Discussion</option>
                  <option value="exit">Exit Meeting</option>
                  <option value="ad_hoc">Ad-hoc Meeting</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={newMeeting.scheduled_time}
                    onChange={(e) => setNewMeeting((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={newMeeting.duration_minutes}
                    onChange={(e) =>
                      setNewMeeting((prev) => ({ ...prev, duration_minutes: Number.parseInt(e.target.value) }))
                    }
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Location</label>
                <input
                  type="text"
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Meeting room, video call link, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Notes</label>
                <textarea
                  value={newMeeting.notes}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Additional meeting notes or agenda items"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMeeting}
                disabled={createLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {createLoading ? "Scheduling..." : "Schedule Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MeetingScheduler
