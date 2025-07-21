"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  MessageSquare,
  User,
  Calendar,
  Filter,
  Search,
} from "lucide-react"

interface Finding {
  id: number
  title: string
  description: string
  severity: "critical" | "major" | "minor" | "informational"
  recommendation: string
  status: string
  due_date: string | null
  created_by: {
    id: number
    name: string
  }
  created_at: string
  resolved_at: string | null
  resolved_by: {
    id: number
    name: string
  } | null
  action_items: Array<{
    id: number
    description: string
    assigned_to: {
      id: number
      name: string
    }
    due_date: string
    status: string
  }>
  comments: Array<{
    id: number
    comment: string
    user: {
      id: number
      name: string
    }
    created_at: string
    is_internal: boolean
  }>
}

interface NewFinding {
  title: string
  description: string
  severity: "critical" | "major" | "minor" | "informational"
  recommendation: string
  due_date: string
}

const FindingsManager: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>()
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [newFinding, setNewFinding] = useState<NewFinding>({
    title: "",
    description: "",
    severity: "minor",
    recommendation: "",
    due_date: "",
  })
  const [createLoading, setCreateLoading] = useState(false)

  useEffect(() => {
    if (auditId) {
      fetchFindings()
    }
  }, [auditId])

  const fetchFindings = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/audits/${auditId}/findings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setFindings(data.findings || [])
    } catch (error) {
      console.error("Error fetching findings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFinding = async () => {
    if (!newFinding.title.trim() || !newFinding.description.trim()) {
      alert("Please fill in all required fields")
      return
    }

    setCreateLoading(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/audits/${auditId}/findings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...newFinding,
          due_date: newFinding.due_date ? new Date(newFinding.due_date).toISOString() : null,
        }),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewFinding({
          title: "",
          description: "",
          severity: "minor",
          recommendation: "",
          due_date: "",
        })
        fetchFindings()
        alert("Finding created successfully!")
      } else {
        const error = await response.json()
        alert(error.detail || "Failed to create finding")
      }
    } catch (error) {
      alert("Network error occurred")
    } finally {
      setCreateLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-[#DC2626] text-white"
      case "major":
        return "bg-[#F59E0B] text-white"
      case "minor":
        return "bg-[#059669] text-white"
      case "informational":
        return "bg-[#3B82F6] text-white"
      default:
        return "bg-[#64748B] text-white"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />
      case "major":
        return <AlertTriangle className="w-4 h-4" />
      case "minor":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const filteredFindings = findings.filter((finding) => {
    const matchesSearch =
      finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === "all" || finding.severity === severityFilter
    const matchesStatus = statusFilter === "all" || finding.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Findings Management</h1>
            <p className="text-[#64748B]">Create and manage audit findings and recommendations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Finding
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-5 h-5" />
            <input
              type="text"
              placeholder="Search findings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="informational">Informational</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-3 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-[#64748B] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-[#1E293B] mb-2">No findings found</h3>
          <p className="text-[#64748B] mb-6">
            {searchTerm || severityFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your search criteria"
              : "Create your first finding to get started"}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all"
          >
            Create First Finding
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFindings.map((finding) => (
            <div key={finding.id} className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#1E293B]">{finding.title}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getSeverityColor(finding.severity)}`}
                    >
                      {getSeverityIcon(finding.severity)}
                      {finding.severity.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-xs rounded">
                      {finding.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[#64748B] mb-4">{finding.description}</p>

                  {finding.recommendation && (
                    <div className="mb-4">
                      <h4 className="font-medium text-[#1E293B] mb-1">Recommendation</h4>
                      <p className="text-[#64748B] text-sm">{finding.recommendation}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-sm text-[#64748B]">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Created by {finding.created_by.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(finding.created_at).toLocaleDateString()}</span>
                    </div>
                    {finding.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Due: {new Date(finding.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setSelectedFinding(finding)}
                    className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Items */}
              {finding.action_items.length > 0 && (
                <div className="border-t border-[#E2E8F0] pt-4">
                  <h4 className="font-medium text-[#1E293B] mb-3">Action Items ({finding.action_items.length})</h4>
                  <div className="space-y-2">
                    {finding.action_items.slice(0, 3).map((action) => (
                      <div key={action.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-[#1E293B]">{action.description}</p>
                          <p className="text-xs text-[#64748B]">
                            Assigned to {action.assigned_to.name} • Due:{" "}
                            {new Date(action.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-white border border-[#E2E8F0] text-[#64748B] text-xs rounded">
                          {action.status}
                        </span>
                      </div>
                    ))}
                    {finding.action_items.length > 3 && (
                      <p className="text-sm text-[#64748B] text-center">
                        +{finding.action_items.length - 3} more action items
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Finding Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-[#1E293B] mb-4">Create New Finding</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Title *</label>
                <input
                  type="text"
                  value={newFinding.title}
                  onChange={(e) => setNewFinding((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Enter finding title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Severity *</label>
                <select
                  value={newFinding.severity}
                  onChange={(e) => setNewFinding((prev) => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="informational">Informational</option>
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Description *</label>
                <textarea
                  value={newFinding.description}
                  onChange={(e) => setNewFinding((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Describe the finding in detail"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Recommendation</label>
                <textarea
                  value={newFinding.recommendation}
                  onChange={(e) => setNewFinding((prev) => ({ ...prev, recommendation: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Provide recommendations to address this finding"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Due Date</label>
                <input
                  type="date"
                  value={newFinding.due_date}
                  onChange={(e) => setNewFinding((prev) => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
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
                onClick={handleCreateFinding}
                disabled={createLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {createLoading ? "Creating..." : "Create Finding"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FindingsManager
