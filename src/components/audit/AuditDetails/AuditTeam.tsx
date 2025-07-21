"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Button } from "../../ui/button.tsx"
import { Users, Mail, Plus, UserCheck, Award, Clock, Shield, Star, X, Trash2 } from "lucide-react"
import { useAxios } from "../../../hooks/useAxios.ts"

interface TeamMember {
  id: number
  name: string
  email: string
  role: string
  specializations: string[]
  assigned_at: string | null
  status: string
  workload: number
  hourly_rate: number | null
  certifications: string[]
  availability: string
}

interface AvailableAuditor {
  id: number
  name: string
  email: string
  specializations: string[]
  certifications: string[]
  hourly_rate: number | null
  availability: string
  current_workload: number
}

interface AuditTeamProps {
  auditId: number
  auditData: any
}

const AuditTeam: React.FC<AuditTeamProps> = ({ auditId, auditData }) => {
  const axios = useAxios()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [availableAuditors, setAvailableAuditors] = useState<AvailableAuditor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingMember, setAddingMember] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
    fetchAvailableAuditors()
  }, [auditId])

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get(`/api/audits/${auditId}/team`)
      setTeamMembers(response.data.team_members || [])
    } catch (error) {
      console.error("Error fetching team members:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableAuditors = async () => {
    try {
      const response = await axios.get("/api/audits/available-auditors/all")
      setAvailableAuditors(response.data.auditors || [])
    } catch (error) {
      console.error("Error fetching available auditors:", error)
    }
  }

  const handleAddTeamMember = async (auditorId: number, role = "auditor") => {
    setAddingMember(true)
    try {
      await axios.post(`/api/audits/${auditId}/team/add`, {
        auditor_id: auditorId,
        role: role,
      })

      // Refresh team members
      await fetchTeamMembers()
      await fetchAvailableAuditors()
      setShowAddModal(false)
      alert("Team member added successfully!")
    } catch (error: any) {
      console.error("Error adding team member:", error)
      alert(error.response?.data?.detail || "Failed to add team member")
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveTeamMember = async (memberId: number) => {
    //if (!confirm("Are you sure you want to remove this team member?")) return

    try {
      await axios.delete(`/api/audits/${auditId}/team/${memberId}`)

      // Refresh team members
      await fetchTeamMembers()
      await fetchAvailableAuditors()
      alert("Team member removed successfully!")
    } catch (error: any) {
      console.error("Error removing team member:", error)
      alert(error.response?.data?.detail || "Failed to remove team member")
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "lead_auditor":
        return "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20"
      case "senior_auditor":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
      case "auditor":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "junior_auditor":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
      case "specialist":
        return "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "lead_auditor":
        return <Star className="w-4 h-4" />
      case "senior_auditor":
        return <Award className="w-4 h-4" />
      case "specialist":
        return <Shield className="w-4 h-4" />
      default:
        return <UserCheck className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[#E2E8F0] rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-[#E2E8F0] rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent">
              Audit Team
            </h2>
            <p className="text-[#64748B] mt-1">Manage your audit team members and their roles</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {teamMembers.length === 0 ? (
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-[#64748B]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No team members assigned</h3>
            <p className="text-[#64748B] mb-6">Add auditors to your team to get started with collaborative auditing</p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Team Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <Card
              key={member.id}
              className="border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl flex items-center justify-center text-white font-semibold shadow-lg group-hover:scale-110 transition-transform duration-200">
                        {member.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#059669] to-[#047857] rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-[#1E293B] mb-1">{member.name}</CardTitle>
                      <p className="text-sm text-[#64748B] flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getRoleColor(member.role)} border font-medium flex items-center gap-1`}>
                      {getRoleIcon(member.role)}
                      {member.role.replace("_", " ").toUpperCase()}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveTeamMember(member.id)}
                      className="text-[#DC2626] hover:text-[#DC2626] hover:bg-[#DC2626]/10 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Enhanced Role Information */}
                <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getRoleColor(member.role).replace("/10", "/20")}`}>
                      {getRoleIcon(member.role)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {member.role.replace("_", " ").toUpperCase()}
                      </p>
                      <p className="text-xs text-[#64748B]">Primary role in this audit</p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Specializations */}
                {member.specializations && member.specializations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#3B82F6]" />
                      Specializations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.specializations.map((spec: string, specIndex: number) => (
                        <Badge
                          key={specIndex}
                          className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 border text-xs"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Certifications */}
                {member.certifications && member.certifications.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#F59E0B]" />
                      Certifications
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.certifications.map((cert: string, certIndex: number) => (
                        <Badge
                          key={certIndex}
                          className="bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 border text-xs"
                        >
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workload and Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-[#059669]/5 to-[#047857]/5 rounded-xl border border-[#059669]/10">
                    <div className="text-lg font-bold text-[#059669]">{member.workload}</div>
                    <div className="text-xs text-[#64748B] font-medium">Active Audits</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-[#F97316]/5 to-[#EA580C]/5 rounded-xl border border-[#F97316]/10">
                    <div className="text-lg font-bold text-[#F97316]">
                      {member.hourly_rate ? `$${member.hourly_rate}` : "N/A"}
                    </div>
                    <div className="text-xs text-[#64748B] font-medium">Hourly Rate</div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-transparent"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Contact
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#8B5CF6]/20 hover:text-[#8B5CF6] transition-all duration-200 bg-transparent"
                  >
                    <UserCheck className="w-4 h-4" />
                  </Button>
                </div>

                {/* Enhanced Assignment Date */}
                {member.assigned_at && (
                  <div className="pt-3 border-t border-[#E2E8F0]">
                    <p className="text-xs text-[#94A3B8] flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Assigned {new Date(member.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enhanced Team Statistics */}
      <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[#1E293B]">
            <div className="p-2 bg-gradient-to-br from-[#059669] to-[#047857] rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            Team Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-[#3B82F6]/5 to-[#1D4ED8]/5 rounded-xl border border-[#3B82F6]/10 hover:shadow-sm transition-all duration-200">
              <div className="p-3 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#3B82F6] mb-2">{teamMembers.length}</div>
              <div className="text-sm font-medium text-[#64748B]">Total Members</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-[#8B5CF6]/5 to-[#7C3AED]/5 rounded-xl border border-[#8B5CF6]/10 hover:shadow-sm transition-all duration-200">
              <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#8B5CF6] mb-2">
                {teamMembers.filter((a) => a.role === "lead_auditor").length}
              </div>
              <div className="text-sm font-medium text-[#64748B]">Lead Auditors</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-[#059669]/5 to-[#047857]/5 rounded-xl border border-[#059669]/10 hover:shadow-sm transition-all duration-200">
              <div className="p-3 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#059669] mb-2">
                {teamMembers.filter((a) => a.role === "senior_auditor").length}
              </div>
              <div className="text-sm font-medium text-[#64748B]">Senior Auditors</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-[#F59E0B]/5 to-[#D97706]/5 rounded-xl border border-[#F59E0B]/10 hover:shadow-sm transition-all duration-200">
              <div className="p-3 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#F59E0B] mb-2">{teamMembers.length > 0 ? "100%" : "0%"}</div>
              <div className="text-sm font-medium text-[#64748B]">Availability</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <h2 className="text-2xl font-bold text-[#1E293B]">Add Team Member</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availableAuditors.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-[#64748B]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No available auditors</h3>
                  <p className="text-[#64748B]">All auditors are either already assigned or unavailable.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableAuditors.map((auditor) => (
                    <div
                      key={auditor.id}
                      className="border border-[#E2E8F0] rounded-xl p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-lg flex items-center justify-center text-white font-semibold">
                            {auditor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#1E293B]">{auditor.name}</h3>
                            <p className="text-sm text-[#64748B]">{auditor.email}</p>
                          </div>
                        </div>
                        <Badge className="bg-[#059669]/10 text-[#059669] border-[#059669]/20 border text-xs">
                          {auditor.availability}
                        </Badge>
                      </div>

                      {auditor.specializations.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-[#1E293B] mb-2">Specializations</p>
                          <div className="flex flex-wrap gap-1">
                            {auditor.specializations.slice(0, 3).map((spec, index) => (
                              <Badge
                                key={index}
                                className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 border text-xs"
                              >
                                {spec}
                              </Badge>
                            ))}
                            {auditor.specializations.length > 3 && (
                              <Badge className="bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20 border text-xs">
                                +{auditor.specializations.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-[#64748B]">Workload: {auditor.current_workload} active audits</div>
                        <Button
                          size="sm"
                          onClick={() => handleAddTeamMember(auditor.id)}
                          disabled={addingMember}
                          className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white"
                        >
                          {addingMember ? "Adding..." : "Add to Team"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditTeam
