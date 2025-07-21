"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Eye,
  RefreshCw,
  Brain,
  Shield,
  TrendingUp,
  Bell,
  History,
  Zap,
  FolderOpen,
  Plus,
  Edit,
  Save,
  Trash2,
  Bot
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card.tsx"
import { Badge } from "../ui/badge.tsx"
import { Button } from "../ui/button.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.tsx"
import { Input } from "../ui/input.tsx"
import { Textarea } from "../ui/textarea.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.tsx"
import { Switch } from "../ui/switch.tsx"
import { Label } from "../ui/label.tsx"
import DocumentSelector from "./DocumentSubmission/DocumentSelector.tsx"
import DocumentView from "../../pages/Documents/DocumentView.tsx"
import DocumentUploadArea from "./DocumentSubmission/DocumentUploadArea.tsx"
import { useAxios } from "../../hooks/useAxios.ts"
import AIFindingsPanel from "./AIFindingsPanel.tsx"

interface EnhancedRequirement {
  id: number
  document_type: string
  description: string
  ai_priority_score: number
  risk_level: string
  deadline: string | null
  days_until_deadline: number | null
  is_mandatory: boolean
  auto_escalate: boolean
  escalation_level: number
  escalations_count: number
  compliance_framework: string
  required_fields: any
  validation_rules: any
  submissions?: Array<{
    id: number
    status: string
    workflow_stage: string
    submitted_at: string
    ai_validation_score: number
    compliance_score: number
    revision_round: number
    ai_findings_count: number
    document: {
      id: string
      title: string
      file_type: string
      file_size: number
      created_at: string
    }
  }>
}

interface Document {
  id: string
  title: string
  file_type: string
  file_size: number
  created_at: string
  status: "Processed" | "Analyzing" | "Error"
  workflow_status: string
}

interface DocumentSubmissionCenterProps {
  auditId: number
}

const DocumentSubmissionCenter: React.FC<DocumentSubmissionCenterProps> = ({ auditId }) => {
  const [requirements, setRequirements] = useState<EnhancedRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingFiles, setUploadingFiles] = useState<Set<number>>(new Set())
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("all")

  // Document selection and viewing states
  const [showDocumentSelector, setShowDocumentSelector] = useState<number | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([])
  const [viewDocumentId, setViewDocumentId] = useState<string | null>(null)
  const [submissionMode, setSubmissionMode] = useState<"select" | "upload">("select")

  // AI Findings states
  const [showAIFindings, setShowAIFindings] = useState<number | null>(null)
  const [selectedAIFinding, setSelectedAIFinding] = useState<any | null>(null)

  // Requirement editing states
  const [editingRequirement, setEditingRequirement] = useState<EnhancedRequirement | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRequirement, setNewRequirement] = useState({
    document_type: "",
    description: "",
    deadline: "",
    is_mandatory: true,
    auto_escalate: false,
    compliance_framework: "SOX",
    ai_priority_score: 5.0,
    risk_level: "medium",
  })

  const axios = useAxios()

  useEffect(() => {
    if (auditId) {
      fetchRequirements()
      fetchNotifications()
    }
  }, [auditId, activeTab])

  const fetchRequirements = async () => {
    try {
      const params = new URLSearchParams()
      if (activeTab !== "all") {
        params.append("status", activeTab)
      }

      const response = await axios.get(`/api/audits/${auditId}/requirements/enhanced?${params.toString()}`)
      setRequirements(response.data.requirements || [])
    } catch (error: any) {
      console.error("Error fetching requirements:", error)
      const errorMessage = error.response?.data?.detail || "Failed to fetch requirements"
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`/api/audits/notifications?unread_only=true&limit=10`)
      setNotifications(response.data.notifications || [])
    } catch (error: any) {
      console.error("Error fetching notifications:", error)
    }
  }

  // Enhanced file upload with AI analysis notification
  const handleFileUpload = async (requirementId: number, files: FileList | File[]) => {
    setUploadingFiles((prev) => new Set(prev).add(requirementId))

    try {
      const fileArray = Array.from(files)
      const uploadPromises = fileArray.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("requirement_id", requirementId.toString())

        return axios.post(`/api/audits/${auditId}/submit-document-enhanced`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      })

      const responses = await Promise.all(uploadPromises)
      fetchRequirements() // Refresh the list

      // Show success message with AI analysis info
      const aiAnalysisCount = responses.filter((r) => r.data.ai_analysis_status === "processing").length
      let message = `${fileArray.length} document(s) submitted successfully!`
      if (aiAnalysisCount > 0) {
        message += ` AI analysis is processing for ${aiAnalysisCount} document(s).`
      }
      alert(message)
    } catch (error: any) {
      console.error("Error uploading files:", error)
      const errorMessage = error.response?.data?.detail || "Failed to submit documents"
      alert(errorMessage)
    } finally {
      setUploadingFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(requirementId)
        return newSet
      })
    }
  }

  // Enhanced document selection with AI analysis
  const handleDocumentSelect = async (requirementId: number, documents: Document[]) => {
    setUploadingFiles((prev) => new Set(prev).add(requirementId))

    try {
      const submitPromises = documents.map(async (document) => {
        return axios.post(`/api/audits/${auditId}/submit-selected-document`, {
          requirement_id: requirementId,
          document_id: Number.parseInt(document.id),
          notes: `Selected document: ${document.title}`,
        })
      })

      const responses = await Promise.all(submitPromises)
      fetchRequirements() // Refresh the list
      setShowDocumentSelector(null)
      setSelectedDocuments([])

      // Show success message with AI analysis info
      const aiAnalysisCount = responses.filter((r) => r.data.ai_analysis_status === "processing").length
      let message = `${documents.length} document(s) submitted successfully!`
      if (aiAnalysisCount > 0) {
        message += ` AI analysis is processing for ${aiAnalysisCount} document(s).`
      }
      alert(message)
    } catch (error: any) {
      console.error("Error submitting selected documents:", error)
      const errorMessage = error.response?.data?.detail || "Failed to submit selected documents"
      alert(errorMessage)
    } finally {
      setUploadingFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(requirementId)
        return newSet
      })
    }
  }

  // Add requirement handler
  const handleAddRequirement = async () => {
    try {
      const payload = {
        audit_id: auditId,
        ...newRequirement,
        required_fields: { document_date: true, prepared_by: true },
        validation_rules: { file_types: ["pdf", "xlsx"], max_file_size: "10MB" },
      }

      await axios.post("/api/audits/requirements", payload)
      fetchRequirements()
      setShowAddModal(false)
      setNewRequirement({
        document_type: "",
        description: "",
        deadline: "",
        is_mandatory: true,
        auto_escalate: false,
        compliance_framework: "SOX",
        ai_priority_score: 5.0,
        risk_level: "medium",
      })
      alert("Requirement added successfully!")
    } catch (error: any) {
      console.error("Error adding requirement:", error)
      const errorMessage = error.response?.data?.detail || "Failed to add requirement"
      alert(errorMessage)
    }
  }

  // Edit requirement handler
  const handleEditRequirement = (requirement: EnhancedRequirement) => {
    setEditingRequirement(requirement)
    setShowEditModal(true)
  }

  // Save requirement handler
  const handleSaveRequirement = async (updatedRequirement: EnhancedRequirement) => {
    try {
      await axios.put(`/api/audits/${auditId}/requirements/${updatedRequirement.id}`, updatedRequirement)
      fetchRequirements()
      setShowEditModal(false)
      alert("Requirement updated successfully!")
    } catch (error: any) {
      console.error("Error updating requirement:", error)
      const errorMessage = error.response?.data?.detail || "Failed to update requirement"
      alert(errorMessage)
    }
  }

  // Delete requirement handler
  const handleDeleteRequirement = async (requirementId: number) => {
    //if (!confirm("Are you sure you want to delete this requirement?")) return

    try {
      await axios.delete(`/api/audits/requirements/${requirementId}`)
      fetchRequirements()
      alert("Requirement deleted successfully!")
    } catch (error: any) {
      console.error("Error deleting requirement:", error)
      const errorMessage = error.response?.data?.detail || "Failed to delete requirement"
      alert(errorMessage)
    }
  }

  const viewSubmissionHistory = async (submissionId: number) => {
    try {
      const response = await axios.get(`/api/audits/submissions/${submissionId}/status`)
      setSelectedSubmission(response.data)
      setShowHistoryModal(true)
    } catch (error: any) {
      console.error("Error fetching submission history:", error)
      const errorMessage = error.response?.data?.detail || "Failed to fetch submission history"
      alert(errorMessage)
    }
  }

  // Fix the view document function to get the correct document ID
  const handleViewDocument = async (submissionId: number) => {
    try {
      const response = await axios.get(`/api/audits/${auditId}/submissions/${submissionId}/document`)
      setViewDocumentId(response.data.document.id.toString())
    } catch (error: any) {
      console.error("Error fetching document:", error)
      const errorMessage = error.response?.data?.detail || "Failed to fetch document"
      alert(errorMessage)
    }
  }

  const getPriorityColor = (score: number) => {
    if (score >= 8) return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
    if (score >= 6) return "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20"
    if (score >= 4) return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
    return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
  }

  const getPriorityLabel = (score: number) => {
    if (score >= 8) return "Critical"
    if (score >= 6) return "High"
    if (score >= 4) return "Medium"
    return "Low"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "rejected":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      case "needs_revision":
        return "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20"
      case "under_review":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
      case "ai_validating":
        return "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-[#059669]" />
      case "rejected":
        return <X className="w-4 h-4 text-[#DC2626]" />
      case "needs_revision":
        return <RefreshCw className="w-4 h-4 text-[#F97316]" />
      case "under_review":
        return <Eye className="w-4 h-4 text-[#3B82F6]" />
      case "ai_validating":
        return <Brain className="w-4 h-4 text-[#8B5CF6]" />
      default:
        return <Clock className="w-4 h-4 text-[#64748B]" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E2E8F0] border-t-[#003366]"></div>
          <p className="text-[#64748B] font-medium">Loading document submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#003366] to-[#004D99] bg-clip-text text-transparent">
              Document Submission Center
            </h1>
            <p className="text-[#64748B] text-lg">
              AI-powered document submission with real-time validation and finding generation
            </p>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065f46] text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Requirement
            </Button>

            {/* Enhanced Notifications Bell */}
            <div className="relative">
              <Button
                variant="outline"
                className="relative border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-transparent"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-lg">
                    {notifications.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-[#F8FAFC]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">Total Requirements</p>
                  <p className="text-3xl font-bold text-[#1E293B]">{requirements.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#003366] to-[#004D99] rounded-xl">
                  <FileText className="w-6 h-6 text-white" />
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
                    {requirements.filter((r) => r.submissions?.some((s) => s.status === "approved")).length}
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
                  <p className="text-sm font-medium text-[#64748B]">AI Analyzing</p>
                  <p className="text-3xl font-bold text-[#8B5CF6]">
                    {
                      requirements.filter((r) => r.submissions?.some((s) => s.workflow_stage === "ai_validating"))
                        .length
                    }
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-[#F8FAFC]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">AI Findings</p>
                  <p className="text-3xl font-bold text-[#F97316]">
                    {requirements.reduce(
                      (total, r) =>
                        total + (r.submissions?.reduce((sum, s) => sum + (s.ai_findings_count || 0), 0) || 0),
                      0,
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            All Requirements
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Pending
          </TabsTrigger>
          <TabsTrigger
            value="submitted"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Submitted
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Approved
          </TabsTrigger>
          <TabsTrigger
            value="high"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            High Priority
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Enhanced Requirements List */}
      <div className="space-y-6">
        {requirements.map((requirement) => {
          const isUploading = uploadingFiles.has(requirement.id)
          const isOverdue = requirement.days_until_deadline !== null && requirement.days_until_deadline < 0
          const isShowingSelector = showDocumentSelector === requirement.id
          const isShowingAIFindings = showAIFindings === requirement.id
          const hasSubmissions = requirement.submissions && requirement.submissions.length > 0
          const totalAIFindings = requirement.submissions?.reduce((sum, s) => sum + (s.ai_findings_count || 0), 0) || 0

          return (
            <Card
              key={requirement.id}
              className={`border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm ${
                isOverdue ? "border-[#DC2626]/30 bg-[#DC2626]/5" : ""
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CardTitle className="text-xl font-semibold text-[#1E293B]">
                        {requirement.document_type}
                      </CardTitle>

                      {/* Enhanced Priority Badge */}
                      <Badge className={`${getPriorityColor(requirement.ai_priority_score)} border font-medium`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {getPriorityLabel(requirement.ai_priority_score)} ({requirement.ai_priority_score.toFixed(1)})
                      </Badge>

                      {/* Enhanced Mandatory Badge */}
                      {requirement.is_mandatory && (
                        <Badge className="bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20 border font-medium">
                          <Shield className="w-3 h-3 mr-1" />
                          Mandatory
                        </Badge>
                      )}

                      {/* AI Findings Badge */}
                      {totalAIFindings > 0 && (
                        <Badge className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 border font-medium">
                          <Bot className="w-3 h-3 mr-1" />
                          {totalAIFindings} AI Finding{totalAIFindings !== 1 ? "s" : ""}
                        </Badge>
                      )}

                      {/* Enhanced Escalation Badge */}
                      {requirement.escalations_count > 0 && (
                        <Badge className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 border font-medium">
                          Escalated ({requirement.escalations_count})
                        </Badge>
                      )}
                    </div>

                    <CardDescription className="flex items-center gap-6 text-[#64748B]">
                      {requirement.deadline && (
                        <span className={`flex items-center gap-2 ${isOverdue ? "text-[#DC2626] font-medium" : ""}`}>
                          <Clock className="w-4 h-4" />
                          Due: {new Date(requirement.deadline).toLocaleDateString()}
                          {requirement.days_until_deadline !== null && (
                            <span className="ml-2 px-2 py-1 rounded-full text-xs bg-[#F8FAFC] border border-[#E2E8F0]">
                              {requirement.days_until_deadline >= 0
                                ? `${requirement.days_until_deadline} days left`
                                : `${Math.abs(requirement.days_until_deadline)} days overdue`}
                            </span>
                          )}
                        </span>
                      )}

                      {requirement.compliance_framework && (
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {requirement.compliance_framework.toUpperCase()}
                        </span>
                      )}
                    </CardDescription>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleEditRequirement(requirement)}
                      className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleDeleteRequirement(requirement.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDocumentSelector(isShowingSelector ? null : requirement.id)
                        setSubmissionMode("select")
                      }}
                      disabled={isUploading}
                      className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Select Documents
                    </Button>

                    {/* AI Findings Button */}
                    {totalAIFindings > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAIFindings(isShowingAIFindings ? null : requirement.id)}
                        className="border-[#F97316]/20 text-[#F97316] hover:bg-[#F97316]/10 transition-all duration-200"
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        AI Findings ({totalAIFindings})
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Document Upload Area - Always Available */}
                <div className="border border-[#E2E8F0] rounded-xl p-6 bg-[#F8FAFC]">
                  <h4 className="text-lg font-semibold text-[#1E293B] mb-4">Upload New Documents</h4>
                  <DocumentUploadArea
                    onFilesAdded={(files) => handleFileUpload(requirement.id, files)}
                    isUploading={isUploading}
                  />
                </div>

                {/* Document Selector */}
                {isShowingSelector && (
                  <div className="border border-[#E2E8F0] rounded-xl p-6 bg-[#F8FAFC]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-[#1E293B]">Select Documents from Drive</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDocumentSelector(null)}
                        className="hover:bg-[#F1F5F9]"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <DocumentSelector
                      onDocumentSelect={(documents) =>
                        handleDocumentSelect(requirement.id, Array.isArray(documents) ? documents : [documents])
                      }
                      onDocumentView={(documentId) => setViewDocumentId(documentId)}
                      selectedDocuments={selectedDocuments}
                      multiSelect={true}
                    />

                    {selectedDocuments.length > 0 && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={() => handleDocumentSelect(requirement.id, selectedDocuments)}
                          disabled={isUploading}
                          className="bg-gradient-to-r from-[#003366] to-[#004D99] text-white"
                        >
                          Submit {selectedDocuments.length} Selected Document(s)
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Findings Panel */}
                {isShowingAIFindings && (
                  <div className="border border-[#F97316]/20 rounded-xl p-6 bg-gradient-to-r from-[#F97316]/5 to-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-[#1E293B] flex items-center gap-2">
                        <Bot className="w-5 h-5 text-[#F97316]" />
                        AI-Generated Findings
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAIFindings(null)}
                        className="hover:bg-[#F1F5F9]"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <AIFindingsPanel auditId={auditId} onFindingSelect={(finding) => setSelectedAIFinding(finding)} />
                  </div>
                )}

                {/* Enhanced Submissions Display */}
                {hasSubmissions && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-[#1E293B] flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Submitted Documents ({requirement.submissions!.length})
                    </h4>

                    <div className="grid gap-4">
                      {requirement.submissions!.map((submission, index) => (
                        <div
                          key={submission.id}
                          className="flex items-center justify-between p-6 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-xl">
                              <FileText className="w-6 h-6 text-[#003366]" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-[#1E293B]">{submission.document.title}</p>
                              <div className="flex items-center gap-6 text-sm text-[#64748B]">
                                <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                                {submission.revision_round > 1 && (
                                  <span className="px-2 py-1 bg-[#F97316]/10 text-[#F97316] rounded-full text-xs font-medium">
                                    Revision {submission.revision_round}
                                  </span>
                                )}
                                {submission.ai_findings_count > 0 && (
                                  <span className="px-2 py-1 bg-[#F97316]/10 text-[#F97316] rounded-full text-xs font-medium flex items-center gap-1">
                                    <Bot className="w-3 h-3" />
                                    {submission.ai_findings_count} AI Finding
                                    {submission.ai_findings_count !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Enhanced AI Validation Score */}
                            {submission.ai_validation_score && (
                              <div className="text-center p-3 bg-[#8B5CF6]/5 rounded-xl border border-[#8B5CF6]/10">
                                <div className="flex items-center gap-2 text-sm mb-1">
                                  <Brain className="w-4 h-4 text-[#8B5CF6]" />
                                  <span className="font-medium text-[#1E293B]">AI Score</span>
                                </div>
                                <div className="text-lg font-bold text-[#8B5CF6]">
                                  {submission.ai_validation_score.toFixed(1)}/10
                                </div>
                              </div>
                            )}

                            {/* Enhanced Status Badge */}
                            <div className="flex items-center gap-3">
                              {getStatusIcon(submission.workflow_stage)}
                              <Badge className={`${getStatusColor(submission.workflow_stage)} border font-medium`}>
                                {submission.workflow_stage.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>

                            {/* Enhanced Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDocument(submission.id)}
                                className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewSubmissionHistory(submission.id)}
                                className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200"
                              >
                                <History className="w-4 h-4 mr-1" />
                                History
                              </Button>
                              {submission.ai_findings_count > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowAIFindings(requirement.id)}
                                  className="border-[#F97316]/20 text-[#F97316] hover:bg-[#F97316]/10 transition-all duration-200"
                                >
                                  <Bot className="w-4 h-4 mr-1" />
                                  AI Findings
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Required Fields */}
                {requirement.required_fields && Object.keys(requirement.required_fields).length > 0 && (
                  <div className="p-4 bg-[#3B82F6]/5 rounded-xl border border-[#3B82F6]/10">
                    <h4 className="text-sm font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#3B82F6]" />
                      Required Fields:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(requirement.required_fields).map(
                        ([field, required]) =>
                          required && (
                            <Badge
                              key={field}
                              className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 border text-xs"
                            >
                              {field.replace("_", " ")}
                            </Badge>
                          ),
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Enhanced Empty State */}
      {requirements.length === 0 && (
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-[#64748B]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No Requirements Found</h3>
            <p className="text-[#64748B] mb-6">No document requirements have been defined for this audit yet.</p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-[#003366] to-[#004D99] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Requirement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Requirement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E2E8F0]">
            <div className="p-8 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1E293B]">Add New Requirement</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="hover:bg-[#F1F5F9] transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type">Document Type</Label>
                  <Input
                    id="document_type"
                    value={newRequirement.document_type}
                    onChange={(e) => setNewRequirement((prev) => ({ ...prev, document_type: e.target.value }))}
                    placeholder="e.g., Financial Statements"
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compliance_framework">Compliance Framework</Label>
                  <Select
                    value={newRequirement.compliance_framework}
                    onValueChange={(value) => setNewRequirement((prev) => ({ ...prev, compliance_framework: value }))}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOX">SOX</SelectItem>
                      <SelectItem value="GAAP">GAAP</SelectItem>
                      <SelectItem value="IFRS">IFRS</SelectItem>
                      <SelectItem value="PCAOB">PCAOB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRequirement.description}
                  onChange={(e) => setNewRequirement((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide a detailed description..."
                  className="border-gray-200 focus:border-blue-500 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={newRequirement.deadline}
                    onChange={(e) => setNewRequirement((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk_level">Risk Level</Label>
                  <Select
                    value={newRequirement.risk_level}
                    onValueChange={(value) => setNewRequirement((prev) => ({ ...prev, risk_level: value }))}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="critical">Critical Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai_priority_score">AI Priority Score</Label>
                  <Input
                    id="ai_priority_score"
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={newRequirement.ai_priority_score}
                    onChange={(e) =>
                      setNewRequirement((prev) => ({ ...prev, ai_priority_score: Number.parseFloat(e.target.value) }))
                    }
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="is_mandatory" className="text-sm font-medium">
                    Mandatory Requirement
                  </Label>
                  <p className="text-xs text-gray-600">This document must be submitted to complete the audit</p>
                </div>
                <Switch
                  id="is_mandatory"
                  checked={newRequirement.is_mandatory}
                  onCheckedChange={(checked) => setNewRequirement((prev) => ({ ...prev, is_mandatory: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="auto_escalate" className="text-sm font-medium">
                    Auto-Escalation
                  </Label>
                  <p className="text-xs text-gray-600">Automatically escalate if deadline is missed</p>
                </div>
                <Switch
                  id="auto_escalate"
                  checked={newRequirement.auto_escalate}
                  onCheckedChange={(checked) => setNewRequirement((prev) => ({ ...prev, auto_escalate: checked }))}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddRequirement}
                  className="bg-gradient-to-r from-[#059669] to-[#047857] text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Requirement Modal */}
      {showEditModal && editingRequirement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E2E8F0]">
            <div className="p-8 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1E293B]">Edit Requirement</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                  className="hover:bg-[#F1F5F9] transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_document_type">Document Type</Label>
                  <Input
                    id="edit_document_type"
                    value={editingRequirement.document_type}
                    onChange={(e) =>
                      setEditingRequirement((prev) => (prev ? { ...prev, document_type: e.target.value } : null))
                    }
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_compliance_framework">Compliance Framework</Label>
                  <Select
                    value={editingRequirement.compliance_framework}
                    onValueChange={(value) =>
                      setEditingRequirement((prev) => (prev ? { ...prev, compliance_framework: value } : null))
                    }
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOX">SOX</SelectItem>
                      <SelectItem value="GAAP">GAAP</SelectItem>
                      <SelectItem value="IFRS">IFRS</SelectItem>
                      <SelectItem value="PCAOB">PCAOB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={editingRequirement.description}
                  onChange={(e) =>
                    setEditingRequirement((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  className="border-gray-200 focus:border-blue-500 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_deadline">Deadline</Label>
                  <Input
                    id="edit_deadline"
                    type="datetime-local"
                    value={editingRequirement.deadline || ""}
                    onChange={(e) =>
                      setEditingRequirement((prev) => (prev ? { ...prev, deadline: e.target.value } : null))
                    }
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_risk_level">Risk Level</Label>
                  <Select
                    value={editingRequirement.risk_level}
                    onValueChange={(value) =>
                      setEditingRequirement((prev) => (prev ? { ...prev, risk_level: value } : null))
                    }
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="critical">Critical Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_ai_priority_score">AI Priority Score</Label>
                  <Input
                    id="edit_ai_priority_score"
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={editingRequirement.ai_priority_score}
                    onChange={(e) =>
                      setEditingRequirement((prev) =>
                        prev ? { ...prev, ai_priority_score: Number.parseFloat(e.target.value) } : null,
                      )
                    }
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="edit_is_mandatory" className="text-sm font-medium">
                    Mandatory Requirement
                  </Label>
                  <p className="text-xs text-gray-600">This document must be submitted to complete the audit</p>
                </div>
                <Switch
                  id="edit_is_mandatory"
                  checked={editingRequirement.is_mandatory}
                  onCheckedChange={(checked) =>
                    setEditingRequirement((prev) => (prev ? { ...prev, is_mandatory: checked } : null))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="edit_auto_escalate" className="text-sm font-medium">
                    Auto-Escalation
                  </Label>
                  <p className="text-xs text-gray-600">Automatically escalate if deadline is missed</p>
                </div>
                <Switch
                  id="edit_auto_escalate"
                  checked={editingRequirement.auto_escalate}
                  onCheckedChange={(checked) =>
                    setEditingRequirement((prev) => (prev ? { ...prev, auto_escalate: checked } : null))
                  }
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSaveRequirement(editingRequirement)}
                  className="bg-gradient-to-r from-[#003366] to-[#004D99] text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document View Modal */}
      {viewDocumentId && <DocumentView documentId={viewDocumentId} onClose={() => setViewDocumentId(null)} />}

      {/* Enhanced Submission History Modal */}
      {showHistoryModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E2E8F0]">
            <div className="p-8 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#1E293B] mb-2">
                    Submission History: {selectedSubmission.submission.document_type}
                  </h2>
                  <p className="text-[#64748B]">
                    Submitted by {selectedSubmission.submission.submitter} on{" "}
                    {new Date(selectedSubmission.submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistoryModal(false)}
                  className="hover:bg-[#F1F5F9] transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-8">
              <Tabs defaultValue="workflow" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <TabsTrigger
                    value="workflow"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
                  >
                    Workflow
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai-validation"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
                  >
                    AI Validation
                  </TabsTrigger>
                  <TabsTrigger
                    value="audit-trail"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
                  >
                    Audit Trail
                  </TabsTrigger>
                  <TabsTrigger
                    value="verification"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
                  >
                    Verification Chain
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="workflow" className="space-y-4 mt-6">
                  {selectedSubmission.workflow_history.map((entry: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-6 border border-[#E2E8F0] rounded-xl bg-gradient-to-r from-white to-[#F8FAFC]"
                    >
                      <div
                        className={`p-3 rounded-xl ${entry.automated ? "bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED]" : "bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8]"}`}
                      >
                        {entry.automated ? (
                          <Zap className="w-4 h-4 text-white" />
                        ) : (
                          <Eye className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-[#1E293B]">
                            {entry.stage.replace("_", " ").toUpperCase()}
                          </h4>
                          <span className="text-sm text-[#64748B] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#64748B] mb-3 leading-relaxed">{entry.notes}</p>
                        <div className="flex items-center gap-6 text-xs text-[#94A3B8]">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Performer:</span> {entry.performer}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Type:</span> {entry.performer_type}
                          </span>
                          {entry.validation_score && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Score:</span> {entry.validation_score}/10
                            </span>
                          )}
                          {entry.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Duration:</span> {entry.duration_minutes}min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="ai-validation" className="space-y-4 mt-6">
                  {selectedSubmission.ai_validations.map((validation: any, index: number) => (
                    <div
                      key={index}
                      className="p-6 border border-[#E2E8F0] rounded-xl bg-gradient-to-r from-white to-[#F8FAFC]"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-semibold flex items-center gap-2 text-[#1E293B]">
                          <div className="p-2 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          AI Validation Results
                        </h4>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#8B5CF6]">
                            {validation.validation_score.toFixed(1)}/10
                          </div>
                          <div className="text-xs text-[#64748B] bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0] mt-1">
                            Confidence: {(validation.confidence_score * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {validation.issues_found.length > 0 && (
                        <div className="mb-6">
                          <h5 className="font-medium text-[#DC2626] mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Issues Found:
                          </h5>
                          <ul className="space-y-2">
                            {validation.issues_found.map((issue: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-[#DC2626] rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-[#1E293B]">{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validation.recommendations.length > 0 && (
                        <div className="mb-6">
                          <h5 className="font-medium text-[#3B82F6] mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Recommendations:
                          </h5>
                          <ul className="space-y-2">
                            {validation.recommendations.map((rec: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-[#1E293B]">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="text-xs text-[#94A3B8] bg-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E2E8F0]">
                        Processing Time: {validation.processing_time_ms}ms | Completed:{" "}
                        {new Date(validation.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="audit-trail" className="space-y-3 mt-6">
                  {selectedSubmission.audit_trail.map((entry: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 border-l-4 border-[#3B82F6] bg-gradient-to-r from-[#3B82F6]/5 to-white rounded-r-xl"
                    >
                      <div className="text-xs text-[#64748B] w-32 bg-[#F8FAFC] px-2 py-1 rounded border border-[#E2E8F0]">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-[#1E293B]">{entry.action.replace("_", " ")}</div>
                        <div className="text-xs text-[#64748B]">
                          by {entry.actor} ({entry.actor_type})
                        </div>
                      </div>
                      <div className="text-xs font-mono text-[#94A3B8] bg-[#F8FAFC] px-2 py-1 rounded border border-[#E2E8F0]">
                        {entry.hash.substring(0, 8)}...
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="verification" className="space-y-4 mt-6">
                  {selectedSubmission.verification_chain.map((block: any, index: number) => (
                    <div
                      key={index}
                      className="p-6 border border-[#E2E8F0] rounded-xl bg-gradient-to-r from-[#059669]/5 to-white"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-[#1E293B]">Block #{block.block_number}</h4>
                        <Badge
                          className={`${block.immutable ? "bg-[#059669]/10 text-[#059669] border-[#059669]/20" : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"} border font-medium`}
                        >
                          {block.immutable ? "Immutable" : "Mutable"}
                        </Badge>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                          <span className="font-medium text-[#1E293B]">Current Hash:</span>
                          <code className="ml-2 text-xs bg-white px-2 py-1 rounded border border-[#E2E8F0] font-mono">
                            {block.current_hash}
                          </code>
                        </div>
                        <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                          <span className="font-medium text-[#1E293B]">Previous Hash:</span>
                          <code className="ml-2 text-xs bg-white px-2 py-1 rounded border border-[#E2E8F0] font-mono">
                            {block.previous_hash}
                          </code>
                        </div>
                        <div className="text-xs text-[#94A3B8] bg-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E2E8F0]">
                          Timestamp: {new Date(block.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentSubmissionCenter
