"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "../../ui/Card.tsx"
import { Button } from "../../ui/button.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Input } from "../../ui/input.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select.tsx"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog.tsx"
import { Label } from "../../ui/label.tsx"
import { Alert, AlertDescription } from "../../ui/alert.tsx"
import { useAxios } from "../../../hooks/useAxios.ts"
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Mail,
  Award,
  Clock,
  Search,
  AlertCircle,
  CheckCircle,
  Shield,
  Star,
  TrendingUp,
  UserCheck,
} from "lucide-react"

interface TeamMember {
  id: number
  name: string
  email: string
  role: string
  specializations: string[]
  assigned_at: string
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

interface AuditTeamManagementProps {
  auditId: number
}

const AuditTeamManagement: React.FC<AuditTeamManagementProps> = ({ auditId }) => {
  const { request, loading, error } = useAxios()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [availableAuditors, setAvailableAuditors] = useState<AvailableAuditor[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [success, setSuccess] = useState("")

  const [addForm, setAddForm] = useState({
    auditor_id: "",
    role: "auditor",
  })

  const [editForm, setEditForm] = useState({
    role: "",
  })

  const roles = [
    { value: "lead_auditor", label: "Lead Auditor" },
    { value: "senior_auditor", label: "Senior Auditor" },
    { value: "auditor", label: "Auditor" },
    { value: "junior_auditor", label: "Junior Auditor" },
    { value: "specialist", label: "Specialist" },
  ]

  useEffect(() => {
    fetchTeamMembers()
    fetchAvailableAuditors()
  }, [auditId])

  const fetchTeamMembers = async () => {
    try {
      const response = await request({
        url: `/api/audits/${auditId}/team`,
        method: "GET",
      })
      setTeamMembers(response.data.team_members)
    } catch (err) {
      console.error("Error fetching team members:", err)
    }
  }

  const fetchAvailableAuditors = async () => {
    try {
      const response = await request({
        url: "/api/audits/available-auditors/all",
        method: "GET",
      })
      setAvailableAuditors(response.data.auditors)
    } catch (err) {
      console.error("Error fetching available auditors:", err)
    }
  }

  const addTeamMember = async () => {
    try {
      await request({
        url: `/api/audits/${auditId}/team/add`,
        method: "POST",
        data: addForm,
      })

      setSuccess("Team member added successfully!")
      setIsAddDialogOpen(false)
      setAddForm({ auditor_id: "", role: "auditor" })
      fetchTeamMembers()
      fetchAvailableAuditors()

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error adding team member:", err)
    }
  }

  const removeTeamMember = async (memberId: number) => {
    try {
      await request({
        url: `/api/audits/${auditId}/team/${memberId}`,
        method: "DELETE",
      })

      setSuccess("Team member removed successfully!")
      fetchTeamMembers()
      fetchAvailableAuditors()

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error removing team member:", err)
    }
  }

  const updateTeamMember = async () => {
    if (!selectedMember) return

    try {
      await request({
        url: `/api/audits/${auditId}/team/${selectedMember.id}`,
        method: "PATCH",
        data: editForm,
      })

      setSuccess("Team member updated successfully!")
      setIsEditDialogOpen(false)
      setSelectedMember(null)
      setEditForm({ role: "" })
      fetchTeamMembers()

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error updating team member:", err)
    }
  }

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setEditForm({ role: member.role })
    setIsEditDialogOpen(true)
  }

  const getRoleBadgeColor = (role: string) => {
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

  const getAvailabilityBadgeColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "busy":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      case "partially_available":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return "text-[#DC2626]"
    if (workload >= 70) return "text-[#F97316]"
    if (workload >= 50) return "text-[#F59E0B]"
    return "text-[#059669]"
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

  const filteredAvailableAuditors = availableAuditors.filter(
    (auditor) =>
      auditor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auditor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auditor.specializations.some((spec) => spec.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Success Alert */}
        {success && (
          <Alert className="border-[#059669]/20 bg-[#059669]/5">
            <CheckCircle className="h-4 w-4 text-[#059669]" />
            <AlertDescription className="text-[#1E293B]">{success}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Error Alert */}
        {error && (
          <Alert className="border-[#DC2626]/20 bg-[#DC2626]/5">
            <AlertCircle className="h-4 w-4 text-[#DC2626]" />
            <AlertDescription className="text-[#1E293B]">{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-[#003366] to-[#004D99] bg-clip-text text-transparent">
              Team Management
            </h2>
            <p className="text-[#64748B] text-lg">Manage audit team members and their roles</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-[#E2E8F0]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-[#1E293B]">Add Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="search" className="text-sm font-semibold text-[#1E293B]">
                    Search Available Auditors
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search by name, email, or specialization..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366]/20"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-[#1E293B]">Select Auditor</Label>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {filteredAvailableAuditors.map((auditor) => (
                      <div
                        key={auditor.id}
                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                          addForm.auditor_id === auditor.id.toString()
                            ? "border-[#003366] bg-[#003366]/5 shadow-sm"
                            : "border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#003366]/30"
                        }`}
                        onClick={() => setAddForm((prev) => ({ ...prev, auditor_id: auditor.id.toString() }))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl flex items-center justify-center text-white font-semibold">
                              {auditor.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#1E293B]">{auditor.name}</h4>
                              <p className="text-sm text-[#64748B]">{auditor.email}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {auditor.specializations.slice(0, 3).map((spec, index) => (
                                  <Badge
                                    key={index}
                                    className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 border text-xs"
                                  >
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <Badge className={`${getAvailabilityBadgeColor(auditor.availability)} border font-medium`}>
                              {auditor.availability.replace("_", " ").toUpperCase()}
                            </Badge>
                            <p className={`text-sm font-semibold ${getWorkloadColor(auditor.current_workload)}`}>
                              Workload: {auditor.current_workload}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="role" className="text-sm font-semibold text-[#1E293B]">
                    Role
                  </Label>
                  <Select
                    value={addForm.role}
                    onValueChange={(value) => setAddForm((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addTeamMember}
                    disabled={!addForm.auditor_id || loading}
                    className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Adding...
                      </div>
                    ) : (
                      "Add Member"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Enhanced Team Members */}
        <div className="space-y-6">
          {teamMembers.length === 0 ? (
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-[#64748B]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No Team Members</h3>
                <p className="text-[#64748B] mb-6">No team members have been assigned to this audit yet.</p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Team Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            teamMembers.map((member) => (
              <Card
                key={member.id}
                className="border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm group"
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-[#059669] to-[#047857] rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-[#1E293B] mb-1">{member.name}</h3>
                          <p className="text-sm text-[#64748B] flex items-center gap-2 mb-3">
                            <Mail className="w-4 h-4 text-[#3B82F6]" />
                            {member.email}
                          </p>
                          <Badge
                            className={`${getRoleBadgeColor(member.role)} border font-medium flex items-center gap-1 w-fit`}
                          >
                            {getRoleIcon(member.role)}
                            {member.role.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="p-4 bg-gradient-to-br from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                          <p className="text-sm font-semibold text-[#64748B] mb-2">Availability</p>
                          <Badge className={`${getAvailabilityBadgeColor(member.availability)} border font-medium`}>
                            {member.availability.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                          <p className="text-sm font-semibold text-[#64748B] mb-2">Workload</p>
                          <div className="flex items-center gap-2">
                            <TrendingUp className={`w-4 h-4 ${getWorkloadColor(member.workload)}`} />
                            <p className={`text-lg font-bold ${getWorkloadColor(member.workload)}`}>
                              {member.workload}%
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                          <p className="text-sm font-semibold text-[#64748B] mb-2">Hourly Rate</p>
                          <p className="text-lg font-bold text-[#1E293B]">
                            {member.hourly_rate ? `$${member.hourly_rate}/hr` : "Not set"}
                          </p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                          <p className="text-sm font-semibold text-[#64748B] mb-2">Status</p>
                          <Badge className="bg-[#059669]/10 text-[#059669] border-[#059669]/20 border font-medium">
                            ACTIVE
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                            <Shield className="w-4 h-4 text-[#3B82F6]" />
                            Specializations
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {member.specializations.length > 0 ? (
                              member.specializations.map((spec, index) => (
                                <Badge
                                  key={index}
                                  className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 border text-xs"
                                >
                                  {spec}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-[#94A3B8]">None specified</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#F59E0B]" />
                            Certifications
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {member.certifications.length > 0 ? (
                              member.certifications.map((cert, index) => (
                                <Badge
                                  key={index}
                                  className="bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 border text-xs"
                                >
                                  {cert}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-[#94A3B8]">None specified</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#E2E8F0]">
                        <p className="text-xs text-[#94A3B8] flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Assigned {new Date(member.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(member)}
                        className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 hover:text-[#003366] transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                        className="border-[#E2E8F0] text-[#DC2626] hover:bg-[#DC2626]/5 hover:border-[#DC2626]/20 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Enhanced Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-white border-[#E2E8F0]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#1E293B]">Edit Team Member</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl flex items-center justify-center text-white font-semibold">
                      {selectedMember.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1E293B]">{selectedMember.name}</h4>
                      <p className="text-sm text-[#64748B]">{selectedMember.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-role" className="text-sm font-semibold text-[#1E293B]">
                    Role
                  </Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value) => setEditForm((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateTeamMember}
                    disabled={loading}
                    className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Updating...
                      </div>
                    ) : (
                      "Update Member"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AuditTeamManagement
