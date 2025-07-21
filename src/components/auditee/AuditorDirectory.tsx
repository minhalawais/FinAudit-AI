"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Star,
  Mail,
  Award,
  Filter,
  MoreVertical,
  Eye,
  MessageSquare,
  Users,
  Shield,
  Clock,
  X,
} from "lucide-react"

interface Auditor {
  id: number
  name: string
  email: string
  specializations: string[]
  rating: number
  completed_audits: number
  current_assignments: number
  last_active: string | null
  status: "active" | "inactive"
}

const AuditorDirectory: React.FC = () => {
  const [auditors, setAuditors] = useState<Auditor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    fetchAuditors()
  }, [])

  const fetchAuditors = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/auditors", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setAuditors(data.auditors || [])
    } catch (error) {
      console.error("Error fetching auditors:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteAuditor = async () => {
    if (!inviteEmail.trim()) return

    setInviteLoading(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/api/auditors/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          message: inviteMessage,
        }),
      })

      if (response.ok) {
        setShowInviteModal(false)
        setInviteEmail("")
        setInviteMessage("")
        alert("Invitation sent successfully!")
      } else {
        const error = await response.json()
        alert(error.detail || "Failed to send invitation")
      }
    } catch (error) {
      alert("Network error occurred")
    } finally {
      setInviteLoading(false)
    }
  }

  const filteredAuditors = auditors.filter((auditor) => {
    const matchesSearch =
      auditor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auditor.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || auditor.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      : "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20"
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "text-[#F59E0B] fill-current" : "text-[#E2E8F0]"}`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E2E8F0] border-t-[#003366]"></div>
          <p className="text-[#64748B] font-medium">Loading auditor directory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#003366] to-[#004D99] bg-clip-text text-transparent">
              Auditor Directory
            </h1>
            <p className="text-[#64748B] text-lg">Manage your network of professional auditors</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-xl hover:shadow-lg hover:from-[#004D99] hover:to-[#0066CC] transition-all duration-200 font-medium"
          >
            <Plus className="w-4 h-4" />
            Invite Auditor
          </button>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="p-6 bg-gradient-to-br from-white to-[#F8FAFC] rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#64748B]">Total Auditors</p>
                <p className="text-3xl font-bold text-[#1E293B]">{auditors.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-white to-[#F8FAFC] rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#64748B]">Active</p>
                <p className="text-3xl font-bold text-[#059669]">
                  {auditors.filter((a) => a.status === "active").length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-white to-[#F8FAFC] rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#64748B]">Avg Rating</p>
                <p className="text-3xl font-bold text-[#F59E0B]">
                  {auditors.length > 0
                    ? (auditors.reduce((sum, a) => sum + a.rating, 0) / auditors.length).toFixed(1)
                    : "0.0"}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-white to-[#F8FAFC] rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#64748B]">Total Audits</p>
                <p className="text-3xl font-bold text-[#8B5CF6]">
                  {auditors.reduce((sum, a) => sum + a.completed_audits, 0)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#E2E8F0] p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-5 h-5" />
            <input
              type="text"
              placeholder="Search auditors by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all duration-200 bg-white"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all duration-200 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-3 border border-[#E2E8F0] rounded-xl text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#003366]/20 transition-all duration-200 bg-white">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Auditors Grid */}
      {filteredAuditors.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#E2E8F0] p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-[#64748B]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No auditors found</h3>
          <p className="text-[#64748B] mb-6">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search criteria"
              : "Start building your auditor network by inviting professionals"}
          </p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-xl hover:shadow-lg hover:from-[#004D99] hover:to-[#0066CC] transition-all duration-200"
          >
            Invite First Auditor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuditors.map((auditor) => (
            <div
              key={auditor.id}
              className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#E2E8F0] p-6 hover:shadow-lg hover:bg-white transition-all duration-300 group"
            >
              {/* Enhanced Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#003366] to-[#004D99] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
                      {auditor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        auditor.status === "active" ? "bg-[#059669]" : "bg-[#64748B]"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1E293B] text-lg">{auditor.name}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(auditor.status)}`}
                    >
                      {auditor.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button className="text-[#64748B] hover:text-[#1E293B] p-2 hover:bg-[#F8FAFC] rounded-lg transition-all duration-200">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Enhanced Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-[#64748B] p-3 bg-[#F8FAFC] rounded-lg">
                  <Mail className="w-4 h-4 text-[#3B82F6]" />
                  <span className="truncate font-medium">{auditor.email}</span>
                </div>
                {auditor.last_active && (
                  <div className="flex items-center gap-3 text-sm text-[#64748B] p-3 bg-[#F8FAFC] rounded-lg">
                    <Clock className="w-4 h-4 text-[#F59E0B]" />
                    <span>Last active: {new Date(auditor.last_active).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Enhanced Rating */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-[#F59E0B]/5 to-[#D97706]/5 rounded-xl border border-[#F59E0B]/10">
                <div className="flex items-center gap-1">{renderStars(auditor.rating)}</div>
                <span className="text-sm font-bold text-[#1E293B]">{auditor.rating.toFixed(1)}</span>
                <span className="text-sm text-[#64748B]">({auditor.completed_audits} audits)</span>
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-[#059669]/5 to-[#047857]/5 rounded-xl border border-[#059669]/10">
                  <div className="text-2xl font-bold text-[#059669]">{auditor.completed_audits}</div>
                  <div className="text-xs text-[#64748B] font-medium">Completed</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-[#F97316]/5 to-[#EA580C]/5 rounded-xl border border-[#F97316]/10">
                  <div className="text-2xl font-bold text-[#F97316]">{auditor.current_assignments}</div>
                  <div className="text-xs text-[#64748B] font-medium">Active</div>
                </div>
              </div>

              {/* Enhanced Specializations */}
              {auditor.specializations.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#3B82F6]" />
                    Specializations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {auditor.specializations.slice(0, 3).map((spec, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#3B82F6]/10 text-[#3B82F6] text-xs rounded-full border border-[#3B82F6]/20 font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                    {auditor.specializations.length > 3 && (
                      <span className="px-3 py-1 bg-[#64748B]/10 text-[#64748B] text-xs rounded-full border border-[#64748B]/20 font-medium">
                        +{auditor.specializations.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Actions */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-[#E2E8F0] rounded-xl text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#003366]/20 hover:text-[#003366] transition-all duration-200 font-medium">
                  <Eye className="w-4 h-4" />
                  View Profile
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-xl hover:from-[#004D99] hover:to-[#0066CC] hover:shadow-lg transition-all duration-200 font-medium">
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1E293B]">Invite Auditor</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-3">Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all duration-200"
                  placeholder="auditor@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-3">Personal Message (Optional)</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all duration-200 resize-none"
                  placeholder="Add a personal message to your invitation..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-3 border border-[#E2E8F0] rounded-xl text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#003366]/20 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteAuditor}
                disabled={inviteLoading || !inviteEmail.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-xl hover:from-[#004D99] hover:to-[#0066CC] hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {inviteLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </div>
                ) : (
                  "Send Invitation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditorDirectory
