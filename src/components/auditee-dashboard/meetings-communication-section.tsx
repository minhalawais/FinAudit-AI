import { ListCard } from "./list-card.tsx"
import { ChartCard } from "./chart-card.tsx"
import { DonutChart } from "./donut-chart.tsx" // Corrected import path
import { Calendar, MessageSquare, Clock, Users } from "lucide-react"
import { StatusBadge } from "./status-badge.tsx"

interface MeetingsCommunicationProps {
  upcomingMeetings: {
    title: string
    meeting_type: string
    scheduled_time: string
    meeting_id: number
    audit_name: string
    audit_id: number
  }[]
  meetingStatusDistribution: {
    status: string
    count: number
  }[]
  avgMeetingDuration: number
  meetingsWithActionItemsPercentage: number
  meetingAttendanceRate: number
  unreadMessagesCount: number
}

export function MeetingsCommunicationSection({
  upcomingMeetings,
  meetingStatusDistribution,
  avgMeetingDuration,
  meetingsWithActionItemsPercentage,
  meetingAttendanceRate,
  unreadMessagesCount,
}: MeetingsCommunicationProps) {
  const meetingStatusChartData = meetingStatusDistribution.map((item) => {
    let color = "#64748B"
    switch (item.status) {
      case "scheduled":
        color = "#003366"
        break
      case "in_progress":
        color = "#F59E0B"
        break
      case "completed":
        color = "#059669"
        break
      case "cancelled":
        color = "#DC2626"
        break
    }
    return { label: item.status, value: item.count, color: color }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ListCard
        title="Upcoming Meetings"
        emptyMessage="No upcoming meetings."
        emptyIcon={Calendar}
        className="lg:col-span-1"
      >
        <div className="space-y-4">
          {upcomingMeetings.map((meeting, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-lg hover:bg-[#F1F5F9] transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#003366] to-[#004D99] rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#1E293B]">{meeting.title}</p>
                <p className="text-sm text-[#64748B]">
                  Audit: {meeting.audit_name} | Type: {meeting.meeting_type.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">{new Date(meeting.scheduled_time).toLocaleString()}</p>
              </div>
              <StatusBadge status={meeting.meeting_type} />
            </div>
          ))}
        </div>
      </ListCard>

      <ChartCard title="Meeting Status Distribution">
        <div className="flex justify-center mb-4">
          <DonutChart data={meetingStatusChartData} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          {meetingStatusChartData.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-[#1E293B] capitalize">{item.label.replace(/_/g, " ")}:</span>
              <span className="font-medium text-[#64748B]">{item.value}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Average Meeting Duration">
        <div className="flex flex-col items-center justify-center h-full py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <p className="text-4xl font-bold text-[#F59E0B]">{avgMeetingDuration} min</p>
          <p className="text-sm text-[#64748B] mt-2">Avg. length of completed meetings.</p>
        </div>
      </ChartCard>

      <ChartCard title="Meetings with Action Items">
        <div className="flex flex-col items-center justify-center h-full py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#059669] to-[#047857] rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <p className="text-4xl font-bold text-[#059669]">{meetingsWithActionItemsPercentage.toFixed(1)}%</p>
          <p className="text-sm text-[#64748B] mt-2">Of completed meetings generated action items.</p>
        </div>
      </ChartCard>

      <ChartCard title="Meeting Attendance Rate">
        <div className="flex flex-col items-center justify-center h-full py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#003366] to-[#004D99] rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="text-4xl font-bold text-[#003366]">{meetingAttendanceRate.toFixed(1)}%</p>
          <p className="text-sm text-[#64748B] mt-2">Avg. attendance rate for meetings.</p>
        </div>
      </ChartCard>

      <ChartCard title="Unread Messages">
        <div className="flex flex-col items-center justify-center h-full py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <p className="text-4xl font-bold text-[#F97316]">{unreadMessagesCount}</p>
          <p className="text-sm text-[#64748B] mt-2">New messages in your conversations.</p>
        </div>
      </ChartCard>
    </div>
  )
}
