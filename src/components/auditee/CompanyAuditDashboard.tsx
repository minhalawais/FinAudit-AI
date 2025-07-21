"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  BarChart3,
  Users,
  FileText,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  Eye,
  Clock,
  DollarSign,
  Shield,
  Target,
  Activity,
} from "lucide-react"

interface DashboardStats {
  total_audits: number
  active_audits: number
  completed_audits: number
  pending_submissions: number
  approved_submissions: number
  overdue_actions: number
  critical_findings: number
  total_auditors: number
  total_budget: number
  compliance_score: number
}

interface RecentAudit {
  id: number
  name: string
  status: string
  deadline: string | null
  created_at: string
  assigned_auditors: Array<{
    id: number
    name: string
    role: string
  }>
}

interface UpcomingDeadline {
  id: number
  name: string
  deadline: string
  days_remaining: number
  status: string
}

const CompanyAuditDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/auditor/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()

      setStats(data.stats)
      setRecentAudits(data.recent_audits || [])
      setUpcomingDeadlines(data.upcoming_deadlines || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-[#64748B] bg-opacity-10 text-[#64748B]"
      case "in_progress":
        return "bg-[#F59E0B] bg-opacity-10 text-[#F59E0B]"
      case "completed":
        return "bg-[#059669] bg-opacity-10 text-[#059669]"
      case "cancelled":
        return "bg-[#DC2626] bg-opacity-10 text-[#DC2626]"
      default:
        return "bg-[#64748B] bg-opacity-10 text-[#64748B]"
    }
  }

  const getPriorityColor = (daysRemaining: number) => {
    if (daysRemaining <= 3) return "border-[#DC2626] bg-[#FEF2F2]"
    if (daysRemaining <= 7) return "border-[#F59E0B] bg-[#FEF3C7]"
    return "border-[#059669] bg-[#F0FDF4]"
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
            <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Company Audit Dashboard</h1>
            <p className="text-[#64748B]">Comprehensive overview of your audit portfolio and compliance status</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
              <Search className="w-4 h-4" />
              Search Audits
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" />
              Create Audit
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Audits */}
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#003366] to-[#004D99] rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{stats?.total_audits || 0}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Total Audits</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#059669]">+{stats?.active_audits || 0} active</span>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#059669] to-[#047857] rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{stats?.compliance_score || 0}%</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Compliance Score</h3>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#059669] to-[#047857] h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats?.compliance_score || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Active Auditors */}
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{stats?.total_auditors || 0}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Active Auditors</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#F59E0B]">Across all audits</span>
          </div>
        </div>

        {/* Total Budget */}
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">${(stats?.total_budget || 0).toLocaleString()}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Total Budget</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B5CF6]">Allocated funds</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-[#059669]" />
            <span className="text-lg font-semibold text-[#1E293B]">{stats?.approved_submissions || 0}</span>
          </div>
          <p className="text-[#64748B] text-sm">Approved Submissions</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-[#F59E0B]" />
            <span className="text-lg font-semibold text-[#1E293B]">{stats?.pending_submissions || 0}</span>
          </div>
          <p className="text-[#64748B] text-sm">Pending Reviews</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
            <span className="text-lg font-semibold text-[#1E293B]">{stats?.critical_findings || 0}</span>
          </div>
          <p className="text-[#64748B] text-sm">Critical Findings</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-[#F97316]" />
            <span className="text-lg font-semibold text-[#1E293B]">{stats?.overdue_actions || 0}</span>
          </div>
          <p className="text-[#64748B] text-sm">Overdue Actions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Audits */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="p-6 border-b border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1E293B]">Recent Audits</h2>
              <button className="text-[#003366] hover:text-[#004D99] text-sm font-medium">View All</button>
            </div>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {recentAudits.length > 0 ? (
              recentAudits.map((audit) => (
                <div key={audit.id} className="p-6 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-[#1E293B] mb-1">{audit.name}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}
                      >
                        {audit.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <button className="text-[#64748B] hover:text-[#003366]">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {audit.assigned_auditors.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-[#64748B]" />
                      <span className="text-sm text-[#64748B]">
                        {audit.assigned_auditors.length} auditor{audit.assigned_auditors.length !== 1 ? "s" : ""}{" "}
                        assigned
                      </span>
                    </div>
                  )}

                  {audit.deadline && (
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(audit.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#64748B]">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent audits found</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="p-6 border-b border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1E293B]">Upcoming Deadlines</h2>
              <button className="text-[#003366] hover:text-[#004D99] text-sm font-medium">View Calendar</button>
            </div>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="p-6 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-[#1E293B] mb-1">{deadline.name}</h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deadline.status)}`}
                        >
                          {deadline.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg border-2 ${getPriorityColor(deadline.days_remaining)}`}>
                      <span className="text-sm font-medium">{deadline.days_remaining} days</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(deadline.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#64748B]">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h2 className="text-xl font-semibold text-[#1E293B] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center gap-3 p-4 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[#003366] transition-all group">
            <div className="p-2 bg-[#F8FAFC] rounded-lg group-hover:bg-[#003366] transition-colors">
              <Plus className="w-5 h-5 text-[#003366] group-hover:text-white" />
            </div>
            <span className="font-medium text-[#1E293B]">Create New Audit</span>
          </button>

          <button className="flex items-center gap-3 p-4 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[#F59E0B] transition-all group">
            <div className="p-2 bg-[#F8FAFC] rounded-lg group-hover:bg-[#F59E0B] transition-colors">
              <Users className="w-5 h-5 text-[#F59E0B] group-hover:text-white" />
            </div>
            <span className="font-medium text-[#1E293B]">Invite Auditor</span>
          </button>

          <button className="flex items-center gap-3 p-4 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[#059669] transition-all group">
            <div className="p-2 bg-[#F8FAFC] rounded-lg group-hover:bg-[#059669] transition-colors">
              <FileText className="w-5 h-5 text-[#059669] group-hover:text-white" />
            </div>
            <span className="font-medium text-[#1E293B]">Upload Documents</span>
          </button>

          <button className="flex items-center gap-3 p-4 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[#8B5CF6] transition-all group">
            <div className="p-2 bg-[#F8FAFC] rounded-lg group-hover:bg-[#8B5CF6] transition-colors">
              <Activity className="w-5 h-5 text-[#8B5CF6] group-hover:text-white" />
            </div>
            <span className="font-medium text-[#1E293B]">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CompanyAuditDashboard
