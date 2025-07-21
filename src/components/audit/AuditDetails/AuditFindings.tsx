"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card.tsx"
import { Button } from "../../ui/button.tsx"
import { Input } from "../../ui/input.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select.tsx"
import { Alert, AlertDescription } from "../../ui/alert.tsx"
import {
  Plus,
  FileText,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Bot,
  Filter,
  Eye,
  Edit,
  MessageSquare,
  Calendar,
  User,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Search,
  Download,
} from "lucide-react"
import CreateFindingModal from "./CreateFindingModal.tsx"
import FindingWorkflowTracker from "./FindingWorkflowTracker.tsx"

interface Finding {
  id: number
  finding_id: string
  title: string
  description: string
  finding_type: string
  severity: "critical" | "major" | "minor" | "informational"
  status: "open" | "in_progress" | "resolved" | "closed"
  priority_level: string
  finding_source: string
  assigned_to?: string
  due_date?: string
  target_completion_date?: string
  created_at: string
  resolved_at?: string
  closed_at?: string
  audit: {
    id: number
    name: string
  }
  creator: string
  resolver?: string
  reference: {
    type: "document" | "meeting" | null
    id?: number
    title?: string
    document_type?: string
    meeting_type?: string
  }
  comments_count: number
  impact_assessment?: string
  root_cause_analysis?: string
  management_response?: string
  remediation_plan?: string
}

interface DashboardStats {
  total_findings: number
  open_findings: number
  in_progress_findings: number
  resolved_findings: number
  closed_findings: number
  critical_findings: number
  major_findings: number
  minor_findings: number
  manual_findings: number
  ai_detected_findings: number
  overdue_findings: number
  completion_rate: number
}

interface EnhancedAuditFindingsProps {
  auditId?: number
}

export default function AuditFindings({ auditId }: EnhancedAuditFindingsProps) {
  const [findings, setFindings] = useState<Finding[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    severity: "all",
    finding_type: "all",
    finding_source: "all",
    assigned_to: "",
    search: "",
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadDashboardStats()
    loadFindings()
  }, [auditId, filters, currentPage])

  const loadDashboardStats = async () => {
    try {
      const params = new URLSearchParams()
      if (auditId) params.append("audit_id", auditId.toString())

      const response = await fetch(`http://127.0.0.1:8000/api/findings/dashboard/stats?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardStats(data.stats)
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
    }
  }

  const loadFindings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: "20",
      })

      if (auditId) params.append("audit_id", auditId.toString())

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "all") params.append(key, value)
      })

      const response = await fetch(`http://127.0.0.1:8000/api/findings/?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFindings(data.findings)
        setTotalPages(data.pagination.pages)
      } else {
        throw new Error("Failed to load findings")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-md"
      case "major":
        return "bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white shadow-md"
      case "minor":
        return "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-md"
      case "informational":
        return "bg-gradient-to-r from-[#003366] to-[#004D99] text-white shadow-md"
      default:
        return "bg-gradient-to-r from-[#64748B] to-[#475569] text-white shadow-md"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-50 text-[#DC2626] border-red-200 shadow-sm"
      case "in_progress":
        return "bg-orange-50 text-[#F97316] border-orange-200 shadow-sm"
      case "resolved":
        return "bg-emerald-50 text-[#059669] border-emerald-200 shadow-sm"
      case "closed":
        return "bg-slate-50 text-[#64748B] border-slate-200 shadow-sm"
      default:
        return "bg-gray-50 text-[#64748B] border-gray-200 shadow-sm"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
      case "in_progress":
        return <Clock className="w-4 h-4 text-[#F97316]" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-[#059669]" />
      case "closed":
        return <XCircle className="w-4 h-4 text-[#64748B]" />
      default:
        return <Clock className="w-4 h-4 text-[#94A3B8]" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-50 text-[#DC2626] border-red-200 shadow-sm"
      case "high":
        return "bg-orange-50 text-[#F97316] border-orange-200 shadow-sm"
      case "medium":
        return "bg-amber-50 text-[#F59E0B] border-amber-200 shadow-sm"
      case "low":
        return "bg-emerald-50 text-[#059669] border-emerald-200 shadow-sm"
      default:
        return "bg-slate-50 text-[#64748B] border-slate-200 shadow-sm"
    }
  }

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#003366] to-[#004D99] text-white p-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Audit Findings Dashboard</h2>
            <p className="text-blue-100 text-lg">Comprehensive overview of all audit findings and their status</p>
          </div>
          <BarChart3 className="w-16 h-16 text-blue-200" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-xl transition-all duration-300 border-[#E2E8F0] bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748B] font-medium mb-1">Total Findings</p>
                <p className="text-3xl font-bold text-[#1E293B]">{dashboardStats?.total_findings || 0}</p>
                <p className="text-sm text-[#94A3B8] mt-1">All findings</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#003366] to-[#004D99] rounded-xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-[#E2E8F0] bg-gradient-to-br from-white to-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748B] font-medium mb-1">Open Findings</p>
                <p className="text-3xl font-bold text-[#DC2626]">{dashboardStats?.open_findings || 0}</p>
                <p className="text-sm text-[#94A3B8] mt-1">Require attention</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-xl">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-[#E2E8F0] bg-gradient-to-br from-white to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748B] font-medium mb-1">Critical Findings</p>
                <p className="text-3xl font-bold text-[#F97316]">{dashboardStats?.critical_findings || 0}</p>
                <p className="text-sm text-[#94A3B8] mt-1">High priority</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl">
                <Target className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border-[#E2E8F0] bg-gradient-to-br from-white to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748B] font-medium mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-[#059669]">{dashboardStats?.completion_rate || 0}%</p>
                <p className="text-sm text-[#94A3B8] mt-1">Resolved findings</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[#E2E8F0] bg-gradient-to-br from-white to-[#F8FAFC] hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748B] font-medium mb-2">In Progress</p>
                <p className="text-2xl font-bold text-[#F97316]">{dashboardStats?.in_progress_findings || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-[#F97316]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-gradient-to-br from-white to-[#F8FAFC] hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748B] font-medium mb-2">AI Detected</p>
                <p className="text-2xl font-bold text-[#003366]">{dashboardStats?.ai_detected_findings || 0}</p>
              </div>
              <Bot className="h-8 w-8 text-[#003366]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-gradient-to-br from-white to-[#F8FAFC] hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#64748B] font-medium mb-2">Overdue</p>
                <p className="text-2xl font-bold text-[#DC2626]">{dashboardStats?.overdue_findings || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-[#DC2626]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
        <CardHeader className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Activity className="h-6 w-6" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-3 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white px-6 py-3 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              New Finding
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-3 border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#003366] px-6 py-3 transition-all duration-200 bg-transparent"
            >
              <Filter className="h-5 w-5" />
              Advanced Filters
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-3 border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#003366] px-6 py-3 transition-all duration-200 bg-transparent"
            >
              <Download className="h-5 w-5" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderFindings = () => (
    <div className="space-y-8">
      {/* Filters */}
      <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8] w-5 h-5" />
              <Input
                placeholder="Search findings..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[160px] border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E2E8F0] shadow-xl">
                <SelectItem value="all" className="hover:bg-[#F1F5F9]">
                  All Status
                </SelectItem>
                <SelectItem value="open" className="hover:bg-[#F1F5F9]">
                  Open
                </SelectItem>
                <SelectItem value="in_progress" className="hover:bg-[#F1F5F9]">
                  In Progress
                </SelectItem>
                <SelectItem value="resolved" className="hover:bg-[#F1F5F9]">
                  Resolved
                </SelectItem>
                <SelectItem value="closed" className="hover:bg-[#F1F5F9]">
                  Closed
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
              <SelectTrigger className="w-[160px] border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E2E8F0] shadow-xl">
                <SelectItem value="all" className="hover:bg-[#F1F5F9]">
                  All Severity
                </SelectItem>
                <SelectItem value="critical" className="hover:bg-[#F1F5F9]">
                  Critical
                </SelectItem>
                <SelectItem value="major" className="hover:bg-[#F1F5F9]">
                  Major
                </SelectItem>
                <SelectItem value="minor" className="hover:bg-[#F1F5F9]">
                  Minor
                </SelectItem>
                <SelectItem value="informational" className="hover:bg-[#F1F5F9]">
                  Informational
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.finding_source}
              onValueChange={(value) => setFilters({ ...filters, finding_source: value })}
            >
              <SelectTrigger className="w-[160px] border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E2E8F0] shadow-xl">
                <SelectItem value="all" className="hover:bg-[#F1F5F9]">
                  All Sources
                </SelectItem>
                <SelectItem value="manual" className="hover:bg-[#F1F5F9]">
                  Manual
                </SelectItem>
                <SelectItem value="ai_detected" className="hover:bg-[#F1F5F9]">
                  AI Detected
                </SelectItem>
                <SelectItem value="system_generated" className="hover:bg-[#F1F5F9]">
                  System
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E2E8F0] border-t-[#003366]"></div>
          </div>
        ) : findings.length === 0 ? (
          <Card className="border-[#E2E8F0] shadow-lg">
            <CardContent className="p-16 text-center bg-gradient-to-br from-white to-[#F8FAFC]">
              <AlertTriangle className="w-16 h-16 text-[#94A3B8] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-[#1E293B] mb-3">No findings found</h3>
              <p className="text-[#64748B] mb-8 text-lg">No audit findings match your current filters.</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white px-8 py-3 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Finding
              </Button>
            </CardContent>
          </Card>
        ) : (
          findings.map((finding) => (
            <Card
              key={finding.id}
              className="hover:shadow-xl transition-all duration-300 border-[#E2E8F0] bg-gradient-to-br from-white to-[#F8FAFC]"
            >
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <h3 className="font-bold text-xl text-[#1E293B]">{finding.title}</h3>
                      {finding.finding_source === "ai_detected" && (
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1 shadow-sm"
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          AI Detected
                        </Badge>
                      )}
                    </div>

                    <p className="text-[#64748B] mb-4 line-clamp-2 text-lg leading-relaxed">{finding.description}</p>

                    <div className="flex items-center space-x-6 text-sm text-[#64748B] mb-4">
                      <span className="font-medium">ID: {finding.finding_id}</span>
                      <span>Type: {finding.finding_type}</span>
                      {finding.assigned_to && <span>Assigned: {finding.assigned_to}</span>}
                      {finding.due_date && (
                        <span className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full">
                          <Calendar className="h-4 w-4 text-[#F59E0B]" />
                          Due: {new Date(finding.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                        <MessageSquare className="h-4 w-4 text-[#003366]" />
                        {finding.comments_count} comments
                      </span>
                    </div>

                    {/* Reference Information */}
                    {finding.reference.type && (
                      <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-4 border border-blue-100">
                        {finding.reference.type === "document" ? (
                          <FileText className="h-5 w-5 text-[#003366]" />
                        ) : (
                          <Users className="h-5 w-5 text-[#059669]" />
                        )}
                        <span className="font-medium text-[#1E293B]">
                          Referenced from {finding.reference.type}: {finding.reference.title}
                          {finding.reference.document_type && ` (${finding.reference.document_type})`}
                          {finding.reference.meeting_type && ` (${finding.reference.meeting_type})`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-[#64748B]">
                      <span className="flex items-center gap-2 bg-[#F8FAFC] px-3 py-2 rounded-full">
                        <User className="h-3 w-3" />
                        Created by {finding.creator}
                      </span>
                      <span>•</span>
                      <span>{new Date(finding.created_at).toLocaleDateString()}</span>
                      {finding.resolved_at && (
                        <>
                          <span>•</span>
                          <span className="text-[#059669] font-medium">
                            Resolved {new Date(finding.resolved_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-4 ml-6">
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getSeverityColor(finding.severity)} px-4 py-2 font-semibold`}>
                        {finding.severity}
                      </Badge>
                      <Badge className={`${getStatusColor(finding.status)} border px-4 py-2 font-semibold`}>
                        {getStatusIcon(finding.status)}
                        <span className="ml-2">{finding.status.replace("_", " ")}</span>
                      </Badge>
                    </div>

                    <Badge className={`${getPriorityColor(finding.priority_level)} border text-sm px-3 py-1`}>
                      {finding.priority_level} priority
                    </Badge>

                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFinding(finding)
                          setShowDetailsModal(true)
                        }}
                        className="border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#003366] transition-all duration-200"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFinding(finding)
                          setShowWorkflowModal(true)
                        }}
                        className="border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#003366] transition-all duration-200"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Workflow
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 py-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#003366] px-6 py-2"
          >
            Previous
          </Button>
          <div className="flex items-center px-6 py-2 text-sm text-[#1E293B] bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#003366] px-6 py-2"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] p-6">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#1E293B] mb-2">Enhanced Audit Findings</h1>
            <p className="text-[#64748B] text-xl">Comprehensive finding management with workflow tracking</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-3 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              New Finding
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-[#DC2626] bg-red-50 shadow-lg">
            <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
            <AlertDescription className="text-[#DC2626] font-medium text-lg">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-[#E2E8F0] shadow-md">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#003366] data-[state=active]:to-[#004D99] data-[state=active]:text-white text-[#64748B] font-semibold py-3"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="findings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#003366] data-[state=active]:to-[#004D99] data-[state=active]:text-white text-[#64748B] font-semibold py-3"
            >
              All Findings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-8">
            {renderDashboard()}
          </TabsContent>

          <TabsContent value="findings" className="mt-8">
            {renderFindings()}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <CreateFindingModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          auditId={auditId || 0}
          onFindingCreated={() => {
            loadFindings()
            loadDashboardStats()
          }}
        />

        {selectedFinding && showWorkflowModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-[#E2E8F0]">
              <div className="p-8 border-b border-[#E2E8F0] bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Finding Workflow: {selectedFinding.title}</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowWorkflowModal(false)}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    <XCircle className="h-6 w-6" />
                  </Button>
                </div>
              </div>
              <div className="p-8">
                <FindingWorkflowTracker
                  findingId={selectedFinding.id}
                  currentStatus={selectedFinding.status}
                  onStatusUpdate={() => {
                    loadFindings()
                    loadDashboardStats()
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Finding Details Modal */}
        {selectedFinding && showDetailsModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-[#E2E8F0]">
              <div className="p-8 border-b border-[#E2E8F0] bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedFinding.title}</h2>
                    <p className="text-blue-100 text-lg">{selectedFinding.finding_id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDetailsModal(false)}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    <XCircle className="h-6 w-6" />
                  </Button>
                </div>
              </div>
              <div className="p-8 space-y-8 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9]">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                    <h3 className="font-bold mb-4 text-[#1E293B] text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#003366]" />
                      Finding Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={getSeverityColor(selectedFinding.severity)}>{selectedFinding.severity}</Badge>
                        <Badge className={`${getStatusColor(selectedFinding.status)} border`}>
                          {getStatusIcon(selectedFinding.status)}
                          <span className="ml-2">{selectedFinding.status.replace("_", " ")}</span>
                        </Badge>
                        <Badge className={`${getPriorityColor(selectedFinding.priority_level)} border`}>
                          {selectedFinding.priority_level} priority
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-[#64748B]">
                          <strong className="text-[#1E293B]">Type:</strong> {selectedFinding.finding_type}
                        </p>
                        <p className="text-[#64748B]">
                          <strong className="text-[#1E293B]">Source:</strong> {selectedFinding.finding_source}
                        </p>
                        {selectedFinding.assigned_to && (
                          <p className="text-[#64748B]">
                            <strong className="text-[#1E293B]">Assigned to:</strong> {selectedFinding.assigned_to}
                          </p>
                        )}
                        {selectedFinding.due_date && (
                          <p className="text-[#64748B]">
                            <strong className="text-[#1E293B]">Due date:</strong>{" "}
                            {new Date(selectedFinding.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                    <h3 className="font-bold mb-4 text-[#1E293B] text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#059669]" />
                      Reference Information
                    </h3>
                    {selectedFinding.reference.type ? (
                      <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        {selectedFinding.reference.type === "document" ? (
                          <FileText className="h-6 w-6 text-[#003366] mt-0.5" />
                        ) : (
                          <Users className="h-6 w-6 text-[#059669] mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold text-[#1E293B]">{selectedFinding.reference.title}</p>
                          <p className="text-sm text-[#64748B] mt-1">
                            {selectedFinding.reference.type === "document" ? "Document" : "Meeting"}
                            {selectedFinding.reference.document_type && ` - ${selectedFinding.reference.document_type}`}
                            {selectedFinding.reference.meeting_type && ` - ${selectedFinding.reference.meeting_type}`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[#94A3B8] text-sm">No reference information available</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                  <h3 className="font-bold mb-4 text-[#1E293B] text-lg">Description</h3>
                  <p className="text-[#1E293B] bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] p-6 rounded-xl leading-relaxed">
                    {selectedFinding.description}
                  </p>
                </div>

                {/* Analysis Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {selectedFinding.impact_assessment && (
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                      <h3 className="font-bold mb-4 text-[#1E293B] text-lg">Impact Assessment</h3>
                      <p className="text-[#1E293B] bg-blue-50 p-6 rounded-xl text-sm leading-relaxed">
                        {selectedFinding.impact_assessment}
                      </p>
                    </div>
                  )}

                  {selectedFinding.root_cause_analysis && (
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                      <h3 className="font-bold mb-4 text-[#1E293B] text-lg">Root Cause Analysis</h3>
                      <p className="text-[#1E293B] bg-amber-50 p-6 rounded-xl text-sm leading-relaxed">
                        {selectedFinding.root_cause_analysis}
                      </p>
                    </div>
                  )}
                </div>

                {/* Remediation Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {selectedFinding.remediation_plan && (
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                      <h3 className="font-bold mb-4 text-[#1E293B] text-lg">Remediation Plan</h3>
                      <p className="text-[#1E293B] bg-emerald-50 p-6 rounded-xl text-sm leading-relaxed">
                        {selectedFinding.remediation_plan}
                      </p>
                    </div>
                  )}

                  {selectedFinding.management_response && (
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                      <h3 className="font-bold mb-4 text-[#1E293B] text-lg">Management Response</h3>
                      <p className="text-[#1E293B] bg-purple-50 p-6 rounded-xl text-sm leading-relaxed">
                        {selectedFinding.management_response}
                      </p>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                  <h3 className="font-bold mb-4 text-[#1E293B] text-lg">Timeline</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                      <Calendar className="h-5 w-5 text-[#94A3B8]" />
                      <span className="font-medium text-[#1E293B]">
                        Created: {new Date(selectedFinding.created_at).toLocaleString()}
                      </span>
                      <span className="text-[#64748B]">by {selectedFinding.creator}</span>
                    </div>
                    {selectedFinding.resolved_at && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-[#059669]" />
                        <span className="font-medium text-[#1E293B]">
                          Resolved: {new Date(selectedFinding.resolved_at).toLocaleString()}
                        </span>
                        {selectedFinding.resolver && (
                          <span className="text-[#64748B]">by {selectedFinding.resolver}</span>
                        )}
                      </div>
                    )}
                    {selectedFinding.closed_at && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <XCircle className="h-5 w-5 text-[#64748B]" />
                        <span className="font-medium text-[#1E293B]">
                          Closed: {new Date(selectedFinding.closed_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-[#E2E8F0]">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false)
                      setShowWorkflowModal(true)
                    }}
                    className="border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#003366] px-6 py-3"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Manage Workflow
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#003366] px-6 py-3 bg-transparent"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
