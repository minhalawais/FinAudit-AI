"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select.tsx"
import { useAxios } from "../../../hooks/useAxios.ts"
import {
  Clock,
  User,
  Bot,
  Settings,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  Filter,
  Play,
  UserPlus,
  UserMinus,
  Upload,
  MessageSquare,
  Shield,
  Building,
  Star,
  Activity,
} from "lucide-react"

interface TimelineEvent {
  id: string
  action: string
  description: string
  actor: string
  actor_type: string
  timestamp: string
  metadata: Record<string, any>
  category: string
  severity: string
}

interface AuditTimelineProps {
  auditId: number
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ auditId }) => {
  const { request, loading } = useAxios()
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    fetchTimeline()
  }, [auditId, categoryFilter, limit])

  const fetchTimeline = async () => {
    try {
      const response = await request({
        url: `/api/audits/${auditId}/timeline`,
        method: "GET",
        params: {
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          limit,
        },
      })
      setTimeline(response.data.timeline)
    } catch (err) {
      console.error("Error fetching timeline:", err)
    }
  }

  const getActorIcon = (actorType: string) => {
    switch (actorType) {
      case "user":
        return <User className="w-4 h-4" />
      case "ai":
        return <Bot className="w-4 h-4" />
      case "system":
        return <Settings className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: string, action: string) => {
    // More specific icons based on action
    if (action.includes("Created")) {
      return <Star className="w-4 h-4" />
    }
    if (action.includes("Started")) {
      return <Play className="w-4 h-4" />
    }
    if (action.includes("Completed")) {
      return <CheckCircle className="w-4 h-4" />
    }
    if (action.includes("Added") || action.includes("Assigned")) {
      return <UserPlus className="w-4 h-4" />
    }
    if (action.includes("Removed")) {
      return <UserMinus className="w-4 h-4" />
    }
    if (action.includes("Submitted")) {
      return <Upload className="w-4 h-4" />
    }
    if (action.includes("Approved")) {
      return <CheckCircle className="w-4 h-4" />
    }
    if (action.includes("Rejected")) {
      return <AlertTriangle className="w-4 h-4" />
    }
    if (action.includes("Scheduled")) {
      return <Calendar className="w-4 h-4" />
    }
    if (action.includes("AI")) {
      return <Bot className="w-4 h-4" />
    }
    if (action.includes("Validation")) {
      return <Shield className="w-4 h-4" />
    }
    if (action.includes("Finding")) {
      return <AlertTriangle className="w-4 h-4" />
    }
    if (action.includes("Meeting")) {
      return <MessageSquare className="w-4 h-4" />
    }

    // Default category icons
    switch (category) {
      case "document":
        return <FileText className="w-4 h-4" />
      case "team":
        return <Users className="w-4 h-4" />
      case "meeting":
        return <Calendar className="w-4 h-4" />
      case "finding":
        return <AlertTriangle className="w-4 h-4" />
      case "audit":
        return <Building className="w-4 h-4" />
      case "system":
        return <Settings className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "warning":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
      case "error":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      case "info":
      default:
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "document":
        return "bg-[#3B82F6]/5 border-[#3B82F6]/20"
      case "team":
        return "bg-[#8B5CF6]/5 border-[#8B5CF6]/20"
      case "meeting":
        return "bg-[#059669]/5 border-[#059669]/20"
      case "finding":
        return "bg-[#F97316]/5 border-[#F97316]/20"
      case "audit":
        return "bg-[#003366]/5 border-[#003366]/20"
      case "system":
        return "bg-[#64748B]/5 border-[#64748B]/20"
      default:
        return "bg-[#F8FAFC] border-[#E2E8F0]"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`
    } else {
      return "Just now"
    }
  }

  const getActionDescription = (event: TimelineEvent) => {
    const { metadata } = event

    // Enhanced descriptions with metadata
    if (event.action === "Audit Created" && metadata.materiality_threshold) {
      return `${event.description} with materiality threshold of $${metadata.materiality_threshold.toLocaleString()}`
    }

    if (event.action === "Team Member Added" && metadata.role) {
      return `${metadata.auditor_name} joined the audit team as ${metadata.role.replace("_", " ")}`
    }

    if (event.action === "Document Submitted" && metadata.revision_round) {
      return `${event.description} (Revision ${metadata.revision_round})`
    }

    if (event.action === "Meeting Scheduled" && metadata.scheduled_time) {
      const meetingDate = new Date(metadata.scheduled_time)
      return `${event.description} for ${meetingDate.toLocaleDateString()} at ${meetingDate.toLocaleTimeString()}`
    }

    if (event.action === "Audit Finding Created" && metadata.severity) {
      return `${metadata.severity.toUpperCase()} finding identified: ${metadata.finding_title}`
    }

    if (event.action === "AI Document Validation" && metadata.validation_score) {
      return `AI validation completed with ${(metadata.validation_score * 100).toFixed(1)}% score`
    }

    return event.description
  }

  if (loading) {
    return (
      <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#E2E8F0] rounded-xl"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-[#E2E8F0] rounded w-3/4"></div>
                  <div className="h-3 bg-[#E2E8F0] rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Filters */}
      <Card className="border-[#E2E8F0] shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg">
                <Filter className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-[#1E293B]">Filter by:</span>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 border-[#E2E8F0] focus:border-[#003366]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="audit">Audit Events</SelectItem>
                <SelectItem value="document">Document Events</SelectItem>
                <SelectItem value="team">Team Events</SelectItem>
                <SelectItem value="meeting">Meeting Events</SelectItem>
                <SelectItem value="finding">Finding Events</SelectItem>
                <SelectItem value="system">System Events</SelectItem>
              </SelectContent>
            </Select>

            <Select value={limit.toString()} onValueChange={(value) => setLimit(Number.parseInt(value))}>
              <SelectTrigger className="w-32 border-[#E2E8F0] focus:border-[#003366]">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 items</SelectItem>
                <SelectItem value="50">50 items</SelectItem>
                <SelectItem value="100">100 items</SelectItem>
                <SelectItem value="200">200 items</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Timeline */}
      <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[#1E293B]">
            <div className="p-2 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            Complete Audit Timeline
            <Badge className="bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] border text-xs">
              {timeline.length} events
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {timeline.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-[#64748B]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No Timeline Events</h3>
              <p className="text-[#64748B]">No events found for the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {timeline.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Enhanced Timeline line */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-16 bg-gradient-to-b from-[#E2E8F0] to-transparent"></div>
                  )}

                  <div className="flex items-start gap-6">
                    {/* Enhanced Event icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 ${getCategoryColor(event.category)} flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200`}
                    >
                      {getCategoryIcon(event.category, event.action)}
                    </div>

                    {/* Enhanced Event content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="text-sm font-semibold text-[#1E293B]">{event.action}</h4>
                            <Badge className={`${getSeverityColor(event.severity)} border text-xs font-medium`}>
                              {event.severity.toUpperCase()}
                            </Badge>
                            <Badge className="bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] border text-xs">
                              {event.category}
                            </Badge>
                          </div>

                          <p className="text-sm text-[#64748B] leading-relaxed">{getActionDescription(event)}</p>

                          <div className="flex items-center gap-6 text-xs text-[#94A3B8]">
                            <div className="flex items-center gap-2 bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0]">
                              {getActorIcon(event.actor_type)}
                              <span className="font-medium">{event.actor}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0]">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(event.timestamp)}</span>
                            </div>
                          </div>

                          {/* Enhanced Metadata Display */}
                          {event.metadata?.details && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-[#F8FAFC] to-white rounded-lg text-xs text-[#64748B] border border-[#E2E8F0]">
                              <div className="flex items-start gap-2">
                                <Info className="w-3 h-3 mt-0.5 text-[#3B82F6]" />
                                <span>{event.metadata.details}</span>
                              </div>
                            </div>
                          )}

                          {/* Additional metadata for specific event types */}
                          {event.category === "document" && event.metadata?.verification_status && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="text-[#94A3B8]">Status:</span>
                              <Badge
                                className={`${getSeverityColor(
                                  event.metadata.verification_status === "approved"
                                    ? "success"
                                    : event.metadata.verification_status === "rejected"
                                      ? "error"
                                      : "warning",
                                )} border text-xs`}
                              >
                                {event.metadata.verification_status.toUpperCase()}
                              </Badge>
                            </div>
                          )}

                          {event.category === "meeting" && event.metadata?.meeting_type && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="text-[#94A3B8]">Type:</span>
                              <Badge className="bg-[#059669]/10 text-[#059669] border-[#059669]/20 border text-xs">
                                {event.metadata.meeting_type.toUpperCase()}
                              </Badge>
                            </div>
                          )}

                          {event.category === "finding" && event.metadata?.severity && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="text-[#94A3B8]">Severity:</span>
                              <Badge
                                className={`${getSeverityColor(
                                  event.metadata.severity === "critical"
                                    ? "error"
                                    : event.metadata.severity === "major"
                                      ? "warning"
                                      : "info",
                                )} border text-xs`}
                              >
                                {event.metadata.severity.toUpperCase()}
                              </Badge>
                            </div>
                          )}

                          {event.category === "system" && event.metadata?.validation_score && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="text-[#94A3B8]">AI Score:</span>
                              <Badge className="bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20 border text-xs">
                                {(event.metadata.validation_score * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-[#94A3B8] bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0]">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditTimeline
