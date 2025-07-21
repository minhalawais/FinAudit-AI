"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Building,
  TrendingUp,
  Eye,
  MessageSquare,
  Star,
} from "lucide-react"

interface AuditorStats {
  assigned_audits: number
  pending_reviews: number
  completed_audits: number
  findings_created: number
}

interface Assignment {
  id: number
  audit: {
    id: number
    name: string
    status: string
    deadline: string | null
    company_name: string
    budget: number | null
  }
  role: string
  assigned_at: string
}

const AuditorDashboard: React.FC = () => {
  const [stats, setStats] = useState<AuditorStats | null>(null)
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([])
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
      setRecentAssignments(data.recent_assignments || [])
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "lead_auditor":
        return "bg-[#003366] text-white"
      case "reviewer":
        return "bg-[#F59E0B] text-white"
      case "specialist":
        return "bg-[#8B5CF6] text-white"
      default:
        return "bg-[#64748B] text-white"
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
            <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Auditor Dashboard</h1>
            <p className="text-[#64748B]">Manage your audit assignments and track your progress</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all">
              <TrendingUp className="w-4 h-4" />
              Performance
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Assigned Audits */}
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#003366] to-[#004D99] rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{stats?.assigned_audits || 0}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Active Assignments</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#059669]">Current workload</span>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{stats?.pending_reviews || 0}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Pending Reviews</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#F59E0B]">Awaiting action</span>
          </div>
        </div>

        {/* Completed Audits */}
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#059669] to-[#047857] rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{stats?.completed_audits || 0}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Completed Audits</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#059669]">Total finished</span>
          </div>
        </div>

        {/* Findings Created */}
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{stats?.findings_created || 0}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Findings Created</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#DC2626]">Issues identified</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Assignments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="p-6 border-b border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1E293B]">Recent Assignments</h2>
              <button className="text-[#003366] hover:text-[#004D99] text-sm font-medium">View All</button>
            </div>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {recentAssignments.length > 0 ? (
              recentAssignments.map((assignment) => (
                <div key={assignment.id} className="p-6 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-[#1E293B]">{assignment.audit.name}</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.audit.status)}`}
                        >
                          {assignment.audit.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-[#64748B] mb-2">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span>{assignment.audit.company_name}</span>
                        </div>
                        {assignment.audit.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(assignment.audit.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(assignment.role)}`}
                        >
                          {assignment.role.replace("_", " ").toUpperCase()}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#64748B]">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent assignments found</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Performance */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[#003366] transition-all group">
                <div className="p-2 bg-[#F8FAFC] rounded-lg group-hover:bg-[#003366] transition-colors">
                  <FileText className="w-4 h-4 text-[#003366] group-hover:text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">Review Documents</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[#F59E0B] transition-all group">
                <div className="p-2 bg-[#F8FAFC] rounded-lg group-hover:bg-[#F59E0B] transition-colors">
                  <AlertTriangle className="w-4 h-4 text-[#F59E0B] group-hover:text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">Create Finding</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[#059669] transition-all group">
                <div className="p-2 bg-[#F8FAFC] rounded-lg group-hover:bg-[#059669] transition-colors">
                  <TrendingUp className="w-4 h-4 text-[#059669] group-hover:text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">Generate Report</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] hover:border-[#8B5CF6] transition-all group">
                <div className="p-2 bg-[#F8FAFC] rounded-lg group-hover:bg-[#8B5CF6] transition-colors">
                  <MessageSquare className="w-4 h-4 text-[#8B5CF6] group-hover:text-white" />
                </div>
                <span className="font-medium text-[#1E293B]">Message Client</span>
              </button>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Performance Summary</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Overall Rating</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < 4 ? "text-[#F59E0B] fill-current" : "text-[#E2E8F0]"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-[#1E293B]">4.2</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">On-time Delivery</span>
                <span className="text-sm font-medium text-[#059669]">95%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Quality Score</span>
                <span className="text-sm font-medium text-[#003366]">8.7/10</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Client Satisfaction</span>
                <span className="text-sm font-medium text-[#F59E0B]">4.5/5</span>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#003366] hover:bg-[#F1F5F9] transition-colors">
              View Detailed Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuditorDashboard
