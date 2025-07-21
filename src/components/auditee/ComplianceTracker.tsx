"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  FileText,
  Calendar,
  BarChart3,
  RefreshCw,
} from "lucide-react"

interface ComplianceData {
  overall_score: number
  total_requirements: number
  completed_requirements: number
  pending_requirements: number
  overdue_requirements: number
  critical_findings: number
  resolved_findings: number
  action_items: {
    total: number
    completed: number
    overdue: number
  }
  compliance_trends: Array<{
    month: string
    score: number
  }>
  gap_analysis: Array<{
    category: string
    current_score: number
    target_score: number
    gap: number
    priority: "high" | "medium" | "low"
  }>
  upcoming_deadlines: Array<{
    id: number
    title: string
    deadline: string
    days_remaining: number
    type: string
  }>
}

interface DashboardMetrics {
  total_audits: number
  average_compliance_score: number
  active_findings: number
  overdue_requirements: number
  compliance_trend: "improving" | "declining" | "stable"
}

const ComplianceTracker: React.FC = () => {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState("6months")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchComplianceData()
    fetchDashboardMetrics()
  }, [selectedTimeframe])

  const fetchComplianceData = async () => {
    try {
      setError(null)
      const response = await fetch(
        `http://127.0.0.1:8000/api/compliance/company-status?timeframe=${selectedTimeframe}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setComplianceData(data)
    } catch (error) {
      console.error("Error fetching compliance data:", error)
      setError("Failed to load compliance data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/compliance/dashboard-metrics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardMetrics(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchComplianceData(), fetchDashboardMetrics()])
    setRefreshing(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#059669]"
    if (score >= 70) return "text-[#F59E0B]"
    return "text-[#DC2626]"
  }

  const getScoreBackground = (score: number) => {
    if (score >= 90) return "from-[#059669] to-[#047857]"
    if (score >= 70) return "from-[#F59E0B] to-[#D97706]"
    return "from-[#DC2626] to-[#B91C1C]"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-[#DC2626] text-white"
      case "medium":
        return "bg-[#F59E0B] text-white"
      case "low":
        return "bg-[#059669] text-white"
      default:
        return "bg-[#64748B] text-white"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-[#059669]" />
      case "declining":
        return <TrendingDown className="w-4 h-4 text-[#DC2626]" />
      default:
        return <Minus className="w-4 h-4 text-[#64748B]" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "text-[#059669]"
      case "declining":
        return "text-[#DC2626]"
      default:
        return "text-[#64748B]"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E2E8F0] border-t-[#003366]"></div>
          <p className="text-[#64748B] font-medium">Loading compliance data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#DC2626]/10 to-[#B91C1C]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-[#DC2626]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Error Loading Compliance Data</h2>
          <p className="text-[#64748B] mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-xl hover:shadow-lg hover:from-[#004D99] hover:to-[#0066CC] transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!complianceData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">No Compliance Data</h2>
          <p className="text-[#64748B]">Unable to load compliance information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent">
                Compliance Tracker
              </h1>
              <p className="text-[#64748B] text-lg mt-1">Monitor your organization's compliance status and progress</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[#003366]/20 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all duration-200"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dashboard Metrics Row */}
      {dashboardMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#1E293B]">{dashboardMetrics.total_audits}</span>
            </div>
            <h3 className="text-[#64748B] text-sm font-medium mb-1">Active Audits</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#3B82F6]">Last 6 months</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#059669] to-[#047857] rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-bold ${getScoreColor(dashboardMetrics.average_compliance_score)}`}>
                {dashboardMetrics.average_compliance_score}%
              </span>
            </div>
            <h3 className="text-[#64748B] text-sm font-medium mb-1">Avg Compliance Score</h3>
            <div className="flex items-center gap-2">
              {getTrendIcon(dashboardMetrics.compliance_trend)}
              <span className={`text-xs font-medium ${getTrendColor(dashboardMetrics.compliance_trend)}`}>
                {dashboardMetrics.compliance_trend.charAt(0).toUpperCase() + dashboardMetrics.compliance_trend.slice(1)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#1E293B]">{dashboardMetrics.active_findings}</span>
            </div>
            <h3 className="text-[#64748B] text-sm font-medium mb-1">Active Findings</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#DC2626]">Requires attention</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#1E293B]">{dashboardMetrics.overdue_requirements}</span>
            </div>
            <h3 className="text-[#64748B] text-sm font-medium mb-1">Overdue Requirements</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#F59E0B]">Past deadline</span>
            </div>
          </div>
        </div>
      )}

      {/* Overall Compliance Score */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 mb-8 shadow-sm">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-40 h-40 mb-6">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" stroke="#E2E8F0" strokeWidth="12" fill="none" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(complianceData.overall_score / 100) * 440} 440`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(complianceData.overall_score)}`}>
                  {complianceData.overall_score}%
                </div>
                <div className="text-sm text-[#64748B] font-medium">Overall Compliance</div>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-[#1E293B] mb-3">Compliance Status Overview</h2>
          <p className="text-[#64748B] text-lg">
            {complianceData.overall_score >= 90
              ? "Excellent compliance status - keep up the great work!"
              : complianceData.overall_score >= 70
                ? "Good compliance with some areas for improvement"
                : "Compliance requires immediate attention and action"}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#059669] to-[#047857] rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-[#1E293B]">{complianceData.completed_requirements}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-2">Completed Requirements</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#E2E8F0] rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#059669] to-[#047857] h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${complianceData.total_requirements > 0 ? (complianceData.completed_requirements / complianceData.total_requirements) * 100 : 0}%`,
                }}
              ></div>
            </div>
            <span className="text-xs text-[#059669] font-medium">
              {complianceData.total_requirements > 0
                ? Math.round((complianceData.completed_requirements / complianceData.total_requirements) * 100)
                : 0}
              %
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-[#1E293B]">{complianceData.pending_requirements}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-2">Pending Requirements</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#F59E0B] font-medium">Awaiting completion</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-[#1E293B]">{complianceData.critical_findings}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-2">Critical Findings</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#DC2626] font-medium">High priority issues</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-[#1E293B]">{complianceData.action_items.overdue}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-2">Overdue Actions</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B5CF6] font-medium">
              {complianceData.action_items.completed}/{complianceData.action_items.total} completed
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gap Analysis */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B]">Compliance Gap Analysis</h3>
          </div>
          <div className="space-y-4">
            {complianceData.gap_analysis.length === 0 ? (
              <div className="text-center py-8 text-[#64748B]">
                <Shield className="w-12 h-12 mx-auto mb-4 text-[#94A3B8]" />
                <p>No gap analysis data available</p>
              </div>
            ) : (
              complianceData.gap_analysis.map((gap, index) => (
                <div
                  key={index}
                  className="border border-[#E2E8F0] rounded-lg p-4 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-[#1E293B]">{gap.category}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(gap.priority)}`}>
                      {gap.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#64748B] mb-3">
                    <span>
                      Current: <span className="font-semibold text-[#1E293B]">{gap.current_score}%</span>
                    </span>
                    <span>
                      Target: <span className="font-semibold text-[#1E293B]">{gap.target_score}%</span>
                    </span>
                    <span>
                      Gap: <span className="font-semibold text-[#DC2626]">{gap.gap}%</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] rounded-full h-3 relative">
                    <div
                      className="bg-gradient-to-r from-[#059669] to-[#047857] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${gap.current_score}%` }}
                    ></div>
                    <div
                      className="absolute top-0 w-1 h-3 bg-[#DC2626] rounded-full"
                      style={{ left: `${gap.target_score}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-[#64748B] mt-1">
                    <span>0%</span>
                    <span>Target: {gap.target_score}%</span>
                    <span>100%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B]">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-4">
            {complianceData.upcoming_deadlines.length === 0 ? (
              <div className="text-center py-8 text-[#64748B]">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-[#94A3B8]" />
                <p>No upcoming deadlines</p>
              </div>
            ) : (
              complianceData.upcoming_deadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className={`border-l-4 pl-4 py-3 rounded-r-lg transition-all duration-200 hover:shadow-sm ${
                    deadline.days_remaining <= 3
                      ? "border-[#DC2626] bg-gradient-to-r from-[#FEF2F2] to-white"
                      : deadline.days_remaining <= 7
                        ? "border-[#F59E0B] bg-gradient-to-r from-[#FEF3C7] to-white"
                        : "border-[#059669] bg-gradient-to-r from-[#F0FDF4] to-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#1E293B] mb-1">{deadline.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(deadline.deadline).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {deadline.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${
                          deadline.days_remaining <= 3
                            ? "text-[#DC2626]"
                            : deadline.days_remaining <= 7
                              ? "text-[#F59E0B]"
                              : "text-[#059669]"
                        }`}
                      >
                        {deadline.days_remaining}
                      </div>
                      <div className="text-xs text-[#64748B] font-medium">
                        {deadline.days_remaining === 1 ? "day left" : "days left"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Compliance Trends */}
      <div className="mt-8 bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-[#1E293B]">Compliance Trends</h3>
        </div>
        {complianceData.compliance_trends.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-[#94A3B8]" />
            <p>No trend data available</p>
          </div>
        ) : (
          <div className="h-80 flex items-end justify-between gap-2 px-4">
            {complianceData.compliance_trends.map((trend, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full max-w-12">
                  <div
                    className={`w-full bg-gradient-to-t ${getScoreBackground(trend.score)} rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer`}
                    style={{ height: `${Math.max((trend.score / 100) * 250, 20)}px` }}
                    title={`${trend.month}: ${trend.score}%`}
                  ></div>
                </div>
                <div className="text-center mt-3">
                  <div
                    className={`text-sm font-bold ${getScoreColor(trend.score)} group-hover:scale-110 transition-transform duration-200`}
                  >
                    {trend.score}%
                  </div>
                  <div className="text-xs text-[#64748B] font-medium mt-1">{trend.month}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ComplianceTracker
