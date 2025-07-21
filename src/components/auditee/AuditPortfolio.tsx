"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Filter, Calendar, FileText, MoreHorizontal, Eye, Edit, AlertTriangle } from "lucide-react"

interface Audit {
  id: number
  name: string
  description: string
  audit_type: string
  status: string
  start_date: string | null
  end_date: string | null
  deadline: string | null
  created_at: string
  progress: number
  assigned_auditors: Array<{
    id: number
    name: string
    email: string
    role: string
  }>
  requirements_count: number
  completed_requirements: number
  findings_count: number
  critical_findings: number
  estimated_budget: number
  actual_cost: number
}

const AuditPortfolio: React.FC = () => {
  const navigate = useNavigate()
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    fetchAudits()
  }, [statusFilter, typeFilter, sortBy])

  const fetchAudits = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter !== "all" ? statusFilter : "",
        type: typeFilter !== "all" ? typeFilter : "",
        sort: sortBy,
        search: searchTerm,
      })

      const response = await fetch(`http://127.0.0.1:8000/api/audits?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      const data = await response.json()
      setAudits(data.audits || [])
    } catch (error) {
      console.error("Error fetching audits:", error)
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

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-[#059669]"
    if (progress >= 70) return "bg-[#F59E0B]"
    if (progress >= 50) return "bg-[#3B82F6]"
    return "bg-[#DC2626]"
  }

  const filteredAudits = audits.filter((audit) => {
    const matchesSearch =
      audit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Audit Portfolio</h1>
            <p className="text-[#64748B]">Manage all your company's audits</p>
          </div>
          <button
            onClick={() => navigate("/audits/create")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Create New Audit
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-5 h-5" />
              <input
                type="text"
                placeholder="Search audits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="compliance">Compliance</option>
                <option value="financial">Financial</option>
                <option value="operational">Operational</option>
                <option value="it">IT Audit</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              >
                <option value="created_at">Created Date</option>
                <option value="deadline">Deadline</option>
                <option value="progress">Progress</option>
                <option value="name">Name</option>
              </select>

              <button className="flex items-center gap-2 px-4 py-3 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
                <Filter className="w-4 h-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Grid */}
      {filteredAudits.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
          <FileText className="w-16 h-16 text-[#64748B] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-[#1E293B] mb-2">No audits found</h3>
          <p className="text-[#64748B] mb-6">
            {searchTerm || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your search criteria"
              : "Create your first audit to get started"}
          </p>
          <button
            onClick={() => navigate("/audits/create")}
            className="px-6 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all"
          >
            Create First Audit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAudits.map((audit) => (
            <div
              key={audit.id}
              className="bg-white rounded-xl border border-[#E2E8F0] p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#1E293B] mb-2">{audit.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(audit.status)}`}>
                      {audit.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-xs rounded">
                      {audit.audit_type}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <button className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#1E293B]">Progress</span>
                  <span className="text-sm text-[#64748B]">{audit.progress}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(audit.progress)}`}
                    style={{ width: `${audit.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-[#F8FAFC] rounded-lg">
                  <div className="text-lg font-bold text-[#1E293B]">
                    {audit.completed_requirements}/{audit.requirements_count}
                  </div>
                  <div className="text-xs text-[#64748B]">Requirements</div>
                </div>
                <div className="text-center p-3 bg-[#F8FAFC] rounded-lg">
                  <div className="text-lg font-bold text-[#1E293B]">{audit.findings_count}</div>
                  <div className="text-xs text-[#64748B]">Findings</div>
                </div>
              </div>

              {/* Auditors */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#1E293B]">Auditors</span>
                  <span className="text-sm text-[#64748B]">{audit.assigned_auditors.length}</span>
                </div>
                <div className="flex -space-x-2">
                  {audit.assigned_auditors.slice(0, 3).map((auditor) => (
                    <div
                      key={auditor.id}
                      className="w-8 h-8 bg-gradient-to-r from-[#003366] to-[#004D99] rounded-full flex items-center justify-center border-2 border-white text-white text-xs font-medium"
                      title={auditor.name}
                    >
                      {auditor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  ))}
                  {audit.assigned_auditors.length > 3 && (
                    <div className="w-8 h-8 bg-[#64748B] rounded-full flex items-center justify-center border-2 border-white text-white text-xs">
                      +{audit.assigned_auditors.length - 3}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              {audit.deadline && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(audit.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {/* Critical Findings Alert */}
              {audit.critical_findings > 0 && (
                <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#DC2626] border-opacity-20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                    <span className="text-sm font-medium text-[#DC2626]">
                      {audit.critical_findings} Critical Finding{audit.critical_findings > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/audits/${audit.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004D99] transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => navigate(`/audits/${audit.id}/edit`)}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg hover:bg-[#F8FAFC] transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AuditPortfolio
