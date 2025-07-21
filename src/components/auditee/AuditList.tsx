"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card.tsx"
import { Badge } from "../ui/badge.tsx"
import { Button } from "../ui/button.tsx"
import { Input } from "../ui/input.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.tsx"
import { Progress } from "../ui/progress.tsx"
import {
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Filter,
  Plus,
  Eye,
  Edit,
  Brain,
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Search,
  BarChart3,
} from "lucide-react"
import { useAxios } from "../../hooks/useAxios.ts"

interface Audit {
  id: number
  name: string
  financial_audit_type: string
  status: "planned" | "in_progress" | "completed" | "cancelled" | "pending_approval"
  approval_status: "pending" | "approved" | "rejected" | "requires_revision"
  progress: number
  deadline: string | null
  start_date: string | null
  end_date: string | null
  materiality_threshold: number
  estimated_budget: number
  complexity_score: number
  ai_confidence_score: number
  industry_type: string
  compliance_frameworks: string[]
  audit_methodology: string
  documentsTotal: number
  documentsReviewed: number
  findingsCount: number
  riskLevel: "low" | "medium" | "high" | "critical"
  upcomingMeetings: number
  assigned_auditors: string[]
  created_by: string
  created_at: string
  requires_approval: boolean
}

interface FilterOptions {
  status: string
  industry_type: string
  audit_methodology: string
  risk_level: string
  approval_status: string
  search: string
}

const AuditListPage: React.FC = () => {
  const navigate = useNavigate()
  const axiosInstance = useAxios()
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    industry_type: "all",
    audit_methodology: "all",
    risk_level: "all",
    approval_status: "all",
    search: "",
  })

  useEffect(() => {
    fetchAudits()
  }, [filters])

  const fetchAudits = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value)
        }
      })

      const response = await axiosInstance.get(`/api/audits/list?${params.toString()}`)

      if (response.status === 200) {
        setAudits(response.data.audits || [])
      }
    } catch (error) {
      console.error("Error fetching audits:", error)
      setError("Failed to fetch audits. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
      case "in_progress":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
      case "completed":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "cancelled":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      case "pending_approval":
        return "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "pending":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
      case "rejected":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      case "requires_revision":
        return "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "medium":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
      case "high":
        return "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20"
      case "critical":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getComplexityIcon = (score: number) => {
    if (score >= 8) return <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
    if (score >= 6) return <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
    return <CheckCircle className="w-4 h-4 text-[#059669]" />
  }

  const safeReplace = (str: string | undefined | null, search: string, replace: string): string => {
    return str ? str.replace(search, replace) : ""
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Not set"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return "Invalid date"
    }
  }

  const calculateDuration = (startDate: string | null, endDate: string | null): string => {
    if (!startDate || !endDate) return "Not set"
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return `${days} days`
    } catch {
      return "Invalid dates"
    }
  }

  const filteredAudits = audits.filter((audit) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        (audit.name || "").toLowerCase().includes(searchLower) ||
        (audit.financial_audit_type || "").toLowerCase().includes(searchLower) ||
        (audit.created_by || "").toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-[#E2E8F0] rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-[#E2E8F0] rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-10 bg-[#E2E8F0] rounded w-40 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse border-[#E2E8F0]">
                <CardHeader>
                  <div className="h-4 bg-[#E2E8F0] rounded w-3/4"></div>
                  <div className="h-3 bg-[#E2E8F0] rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-2 bg-[#E2E8F0] rounded"></div>
                    <div className="h-8 bg-[#E2E8F0] rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#DC2626]/10 to-[#B91C1C]/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-[#DC2626]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">Error Loading Audits</h3>
            <p className="text-[#64748B] mb-6">{error}</p>
            <Button
              onClick={fetchAudits}
              className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#003366] to-[#004D99] bg-clip-text text-transparent">
              Financial Audits
            </h1>
            <p className="text-[#64748B] text-lg">Manage and monitor your financial audit processes</p>
          </div>
          <Button
            onClick={() => navigate("/audits/create")}
            className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Audit
          </Button>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-[#F8FAFC]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">Total Audits</p>
                  <p className="text-3xl font-bold text-[#1E293B]">{audits.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-[#F8FAFC]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">In Progress</p>
                  <p className="text-3xl font-bold text-[#F59E0B]">
                    {audits.filter((a) => a.status === "in_progress").length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-[#F8FAFC]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">Completed</p>
                  <p className="text-3xl font-bold text-[#059669]">
                    {audits.filter((a) => a.status === "completed").length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-[#F8FAFC]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">High Risk</p>
                  <p className="text-3xl font-bold text-[#DC2626]">
                    {audits.filter((a) => a.riskLevel === "high" || a.riskLevel === "critical").length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card className="border-[#E2E8F0] shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#1E293B]">
              <div className="p-2 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-4 h-4" />
                <Input
                  placeholder="Search audits..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-10 border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366]/20"
                />
              </div>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.approval_status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, approval_status: value }))}
              >
                <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366]">
                  <SelectValue placeholder="Approval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Approvals</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="requires_revision">Needs Revision</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.industry_type}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, industry_type: value }))}
              >
                <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="financial_services">Financial Services</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.audit_methodology}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, audit_methodology: value }))}
              >
                <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366]">
                  <SelectValue placeholder="Methodology" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="risk_based">Risk-Based</SelectItem>
                  <SelectItem value="compliance_based">Compliance-Based</SelectItem>
                  <SelectItem value="substantive">Substantive</SelectItem>
                  <SelectItem value="analytical">Analytical</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.risk_level}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, risk_level: value }))}
              >
                <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366]">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Audit Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAudits.map((audit) => (
            <Card
              key={audit.id}
              className="border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm cursor-pointer group"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-xl font-semibold text-[#1E293B] line-clamp-2 group-hover:text-[#003366] transition-colors duration-200">
                      {audit.name || "Unnamed Audit"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-3 text-[#64748B]">
                      <span className="font-medium">
                        {safeReplace(audit.financial_audit_type, "_", " ") || "Custom"}
                      </span>
                      <span className="w-1 h-1 bg-[#E2E8F0] rounded-full"></span>
                      <span>{safeReplace(audit.industry_type, "_", " ") || "Other"}</span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={`${getStatusColor(audit.status)} border font-medium`}>
                      {safeReplace(audit.status, "_", " ") || "Unknown"}
                    </Badge>
                    {audit.requires_approval && (
                      <Badge className={`${getApprovalStatusColor(audit.approval_status)} border font-medium`}>
                        {safeReplace(audit.approval_status, "_", " ") || "Unknown"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Enhanced Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-[#F59E0B]" />
                      <span className="text-xs font-medium text-[#64748B]">Materiality</span>
                    </div>
                    <div className="text-lg font-bold text-[#1E293B]">
                      ${(audit.materiality_threshold || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-xs font-medium text-[#64748B]">Budget</span>
                    </div>
                    <div className="text-lg font-bold text-[#1E293B]">
                      ${(audit.estimated_budget || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-[#F97316]" />
                      <span className="text-xs font-medium text-[#64748B]">Deadline</span>
                    </div>
                    <div className="text-sm font-semibold text-[#1E293B]">{formatDate(audit.deadline)}</div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-[#8B5CF6]" />
                      <span className="text-xs font-medium text-[#64748B]">Duration</span>
                    </div>
                    <div className="text-sm font-semibold text-[#1E293B]">
                      {calculateDuration(audit.start_date, audit.end_date)}
                    </div>
                  </div>
                </div>

                {/* Enhanced Progress */}
                {audit.status === "in_progress" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-[#1E293B]">Progress</span>
                      <span className="text-sm font-bold text-[#3B82F6]">{audit.progress || 0}%</span>
                    </div>
                    <Progress value={audit.progress || 0} className="h-3 bg-[#E2E8F0]" />
                  </div>
                )}

                {/* Enhanced AI & Complexity Indicators */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#8B5CF6]/5 to-[#3B82F6]/5 rounded-xl border border-[#8B5CF6]/10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-lg">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-[#64748B]">AI Confidence</span>
                        <div className="text-sm font-bold text-[#8B5CF6]">
                          {Math.round((audit.ai_confidence_score || 0) * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-lg">
                        {getComplexityIcon(audit.complexity_score || 0)}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-[#64748B]">Complexity</span>
                        <div className="text-sm font-bold text-[#1E293B]">
                          {(audit.complexity_score || 0).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getRiskColor(audit.riskLevel || "low")} border font-medium`}>
                    {audit.riskLevel || "low"} risk
                  </Badge>
                </div>

                {/* Enhanced Compliance Frameworks */}
                {audit.compliance_frameworks && audit.compliance_frameworks.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#3B82F6]" />
                      Compliance Frameworks
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {audit.compliance_frameworks.map((framework) => (
                        <Badge
                          key={framework}
                          className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 border text-xs font-medium"
                        >
                          {framework.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-[#3B82F6]/5 to-[#1D4ED8]/5 rounded-xl border border-[#3B82F6]/10">
                    <div className="text-xl font-bold text-[#3B82F6]">
                      {audit.documentsReviewed || 0}/{audit.documentsTotal || 0}
                    </div>
                    <div className="text-xs text-[#64748B] font-medium">Documents</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-[#F97316]/5 to-[#EA580C]/5 rounded-xl border border-[#F97316]/10">
                    <div className="text-xl font-bold text-[#F97316]">{audit.findingsCount || 0}</div>
                    <div className="text-xs text-[#64748B] font-medium">Findings</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-[#8B5CF6]/5 to-[#7C3AED]/5 rounded-xl border border-[#8B5CF6]/10">
                    <div className="text-xl font-bold text-[#8B5CF6]">{audit.assigned_auditors?.length || 0}</div>
                    <div className="text-xs text-[#64748B] font-medium">Auditors</div>
                  </div>
                </div>

                {/* Enhanced Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-transparent"
                    onClick={() => navigate(`/audits/${audit.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  {audit.status === "planned" && audit.approval_status === "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/audits/${audit.id}/edit`)}
                      className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#F59E0B]/20 hover:text-[#F59E0B] transition-all duration-200 bg-transparent"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {(audit.upcomingMeetings || 0) > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#059669]/20 hover:text-[#059669] transition-all duration-200 bg-transparent"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      {audit.upcomingMeetings}
                    </Button>
                  )}
                </div>

                {/* Enhanced Created Info */}
                <div className="text-xs text-[#94A3B8] border-t border-[#E2E8F0] pt-3 flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Created by {audit.created_by || "Unknown"} on {formatDate(audit.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Empty State */}
        {filteredAudits.length === 0 && !loading && (
          <Card className="border-[#E2E8F0] shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-[#64748B]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No audits found</h3>
              <p className="text-[#64748B] mb-6">
                {filters.search || Object.values(filters).some((f) => f !== "all" && f !== "")
                  ? "Try adjusting your filters to see more results."
                  : "Get started by creating your first financial audit."}
              </p>
              <Button
                onClick={() => navigate("/audits/create")}
                className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Audit
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default AuditListPage
