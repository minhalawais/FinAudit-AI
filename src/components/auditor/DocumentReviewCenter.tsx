"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  MessageSquare,
  Filter,
  Search,
  Brain,
  Shield,
  TrendingUp,
  History,
  Star,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card.tsx"
import { Badge } from "../ui/badge.tsx"
import { Button } from "../ui/button.tsx"
import { Input } from "../ui/input.tsx"
import { Textarea } from "../ui/textarea.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.tsx"
import { Progress } from "../ui/progress.tsx"
import { Alert, AlertDescription } from "../ui/alert.tsx"
import { useAxios } from "../../hooks/useAxios.ts"

interface EnhancedDocumentSubmission {
  id: number
  requirement_id: number
  document_type: string
  document_title: string
  status: string
  workflow_stage: string
  submitted_by: {
    id: number
    name: string
    email: string
  }
  submitted_at: string
  revision_round: number
  rejection_reason?: string
  file_size: number
  ai_validation_score?: number
  compliance_score?: number
  priority_level: string
  escalation_count: number
}

interface VerificationData {
  status: "approved" | "rejected" | "needs_revision"
  notes: string
  quality_score?: number
}

interface AIValidationResult {
  validation_score: number
  confidence_score: number
  issues_found: string[]
  recommendations: string[]
  processing_time_ms: number
}

interface DocumentReviewCenterProps {
  auditId: number
}

const DocumentReviewCenter: React.FC<DocumentReviewCenterProps> = ({ auditId }) => {
  const [submissions, setSubmissions] = useState<EnhancedDocumentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubmission, setSelectedSubmission] = useState<EnhancedDocumentSubmission | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationData, setVerificationData] = useState<VerificationData>({
    status: "approved",
    notes: "",
    quality_score: 8,
  })
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [aiValidations, setAiValidations] = useState<{ [key: number]: AIValidationResult }>({})
  const [activeTab, setActiveTab] = useState("review")
  const axios = useAxios()

  useEffect(() => {
    fetchSubmissions()
  }, [auditId, statusFilter, priorityFilter])

  const fetchSubmissions = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (priorityFilter !== "all") params.append("priority", priorityFilter)

      const response = await axios.get(`/api/audits/${auditId}/submissions/enhanced?${params.toString()}`)
      setSubmissions(response.data.submissions || [])

      // Fetch AI validations for each submission
      for (const submission of response.data.submissions || []) {
        if (submission.ai_validation_score) {
          fetchAIValidation(submission.id)
        }
      }
    } catch (error: any) {
      console.error("Error fetching submissions:", error)
      const errorMessage = error.response?.data?.detail || "Failed to fetch submissions"
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchAIValidation = async (submissionId: number) => {
    try {
      const response = await axios.get(`/api/audits/submissions/${submissionId}/ai-validation`)
      setAiValidations((prev) => ({
        ...prev,
        [submissionId]: response.data,
      }))
    } catch (error: any) {
      console.error("Error fetching AI validation:", error)
    }
  }

  const handleVerifySubmission = async () => {
    if (!selectedSubmission) return

    setVerificationLoading(true)
    try {
      const response = await axios.post(
        `/api/audits/submissions/${selectedSubmission.id}/verify-enhanced`,
        verificationData,
      )

      setShowVerificationModal(false)
      setSelectedSubmission(null)
      fetchSubmissions() // Refresh the list

      const result = response.data
      alert(`Document verification completed successfully!
      Verification ID: ${result.verification_id}
      Status: ${result.status}
      Immutable Hash: ${result.hash.substring(0, 16)}...
      Block Number: ${result.block_number}`)
    } catch (error: any) {
      console.error("Error verifying submission:", error)
      const errorMessage = error.response?.data?.detail || "Failed to verify document"
      alert(errorMessage)
    } finally {
      setVerificationLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-[#059669]" />
      case "rejected":
        return <XCircle className="w-5 h-5 text-[#DC2626]" />
      case "needs_revision":
        return <AlertCircle className="w-5 h-5 text-[#F97316]" />
      case "ai_validating":
        return <Brain className="w-5 h-5 text-[#8B5CF6] animate-pulse" />
      default:
        return <Clock className="w-5 h-5 text-[#64748B]" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "rejected":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      case "needs_revision":
        return "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20"
      case "ai_validating":
        return "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20"
      case "under_review":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      case "medium":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
      case "low":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredSubmissions = submissions.filter(
    (submission) =>
      submission.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.submitted_by.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E2E8F0] border-t-[#003366]"></div>
          <p className="text-[#64748B] font-medium">Loading document reviews...</p>
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
              Document Review Center
            </h1>
            <p className="text-[#64748B] text-lg">AI-assisted document review with immutable verification</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-transparent"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-transparent"
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-[#F8FAFC]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">Total Submissions</p>
                  <p className="text-3xl font-bold text-[#1E293B]">{submissions.length}</p>
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
                  <p className="text-sm font-medium text-[#64748B]">Pending Review</p>
                  <p className="text-3xl font-bold text-[#F97316]">
                    {submissions.filter((s) => s.workflow_stage === "under_review").length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-[#F8FAFC]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">AI Validating</p>
                  <p className="text-3xl font-bold text-[#8B5CF6]">
                    {submissions.filter((s) => s.workflow_stage === "ai_validating").length}
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
                  <p className="text-sm font-medium text-[#64748B]">High Priority</p>
                  <p className="text-3xl font-bold text-[#DC2626]">
                    {submissions.filter((s) => s.priority_level === "high").length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-[#F8FAFC]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#64748B]">Avg AI Score</p>
                  <p className="text-3xl font-bold text-[#3B82F6]">
                    {submissions.filter((s) => s.ai_validation_score).length > 0
                      ? (
                          submissions.reduce((sum, s) => sum + (s.ai_validation_score || 0), 0) /
                          submissions.filter((s) => s.ai_validation_score).length
                        ).toFixed(1)
                      : "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card className="mb-8 border-[#E2E8F0] shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[#1E293B]">
            <Filter className="w-5 h-5 text-[#003366]" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-5 h-5" />
              <Input
                placeholder="Search documents by title, type, or submitter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366]/20"
              />
            </div>

            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 border-[#E2E8F0] focus:border-[#003366]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="ai_validating">AI Validating</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="needs_revision">Needs Revision</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48 border-[#E2E8F0] focus:border-[#003366]">
                  <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-[#F8FAFC] border border-[#E2E8F0]">
          <TabsTrigger
            value="review"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm"
          >
            Document Review
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm"
          >
            AI Analytics
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm"
          >
            Compliance Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-6">
          {filteredSubmissions.length === 0 ? (
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-[#64748B]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No documents found</h3>
                <p className="text-[#64748B]">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your search criteria"
                    : "No documents have been submitted for review yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredSubmissions.map((submission) => (
                <Card
                  key={submission.id}
                  className="border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-6 flex-1">
                        <div className="p-4 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-xl">
                          <FileText className="w-7 h-7 text-[#003366]" />
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-xl font-semibold text-[#1E293B]">{submission.document_title}</h3>

                            <Badge className={`${getPriorityColor(submission.priority_level)} border font-medium`}>
                              {submission.priority_level.toUpperCase()}
                            </Badge>

                            {submission.escalation_count > 0 && (
                              <Badge className="bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20 border font-medium">
                                Escalated ({submission.escalation_count})
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-6 text-sm text-[#64748B]">
                            <span className="font-medium text-[#1E293B]">{submission.document_type}</span>
                            <span className="w-1 h-1 bg-[#E2E8F0] rounded-full"></span>
                            <span>Submitted by {submission.submitted_by.name}</span>
                            <span className="w-1 h-1 bg-[#E2E8F0] rounded-full"></span>
                            <span>{new Date(submission.submitted_at).toLocaleDateString()}</span>
                            <span className="w-1 h-1 bg-[#E2E8F0] rounded-full"></span>
                            <span>{formatFileSize(submission.file_size)}</span>
                            {submission.revision_round > 1 && (
                              <>
                                <span className="w-1 h-1 bg-[#E2E8F0] rounded-full"></span>
                                <span className="text-[#F97316] font-medium">Revision {submission.revision_round}</span>
                              </>
                            )}
                          </div>

                          {/* Enhanced AI Validation Results */}
                          {submission.ai_validation_score && (
                            <div className="flex items-center gap-8 p-4 bg-gradient-to-r from-[#8B5CF6]/5 to-[#3B82F6]/5 rounded-xl border border-[#8B5CF6]/10">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl">
                                  <Brain className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-[#1E293B]">AI Score</span>
                                  <div className="flex items-center gap-3 mt-1">
                                    <Progress
                                      value={submission.ai_validation_score * 10}
                                      className="w-24 h-2 bg-[#E2E8F0]"
                                    />
                                    <span className="text-sm font-bold text-[#8B5CF6]">
                                      {submission.ai_validation_score.toFixed(1)}/10
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {submission.compliance_score && (
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl">
                                    <Shield className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-[#1E293B]">Compliance</span>
                                    <div className="text-sm font-bold text-[#3B82F6] mt-1">
                                      {submission.compliance_score.toFixed(1)}/10
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Enhanced AI Issues Alert */}
                          {aiValidations[submission.id]?.issues_found?.length > 0 && (
                            <Alert className="border-[#F97316]/20 bg-[#F97316]/5">
                              <AlertTriangle className="h-4 w-4 text-[#F97316]" />
                              <AlertDescription className="text-[#1E293B]">
                                AI found {aiValidations[submission.id].issues_found.length} potential issues. Review
                                recommended before approval.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
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
                            className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-transparent"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>

                          {submission.workflow_stage === "under_review" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission)
                                setShowVerificationModal(true)
                              }}
                              className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] transition-all duration-200"
                            >
                              Review
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-transparent"
                          >
                            <History className="w-4 h-4 mr-1" />
                            History
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-transparent"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-[#E2E8F0] shadow-sm bg-gradient-to-br from-white to-[#F8FAFC]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1E293B]">
                  <div className="p-2 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  AI Validation Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-[#8B5CF6]/5 rounded-xl">
                  <span className="font-medium text-[#1E293B]">Average AI Score</span>
                  <span className="text-xl font-bold text-[#8B5CF6]">
                    {submissions.filter((s) => s.ai_validation_score).length > 0
                      ? (
                          submissions.reduce((sum, s) => sum + (s.ai_validation_score || 0), 0) /
                          submissions.filter((s) => s.ai_validation_score).length
                        ).toFixed(1)
                      : "N/A"}
                    /10
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#DC2626]/5 rounded-xl">
                  <span className="font-medium text-[#1E293B]">Documents with Issues</span>
                  <span className="text-xl font-bold text-[#DC2626]">
                    {Object.values(aiValidations).filter((v) => v.issues_found?.length > 0).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#059669]/5 rounded-xl">
                  <span className="font-medium text-[#1E293B]">Auto-Approved</span>
                  <span className="text-xl font-bold text-[#059669]">
                    {submissions.filter((s) => s.ai_validation_score && s.ai_validation_score >= 8).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] shadow-sm bg-gradient-to-br from-white to-[#F8FAFC]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1E293B]">
                  <div className="p-2 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Review Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-[#F97316]/5 rounded-xl">
                  <span className="font-medium text-[#1E293B]">Pending Reviews</span>
                  <span className="text-xl font-bold text-[#F97316]">
                    {submissions.filter((s) => s.workflow_stage === "under_review").length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#059669]/5 rounded-xl">
                  <span className="font-medium text-[#1E293B]">Approved Today</span>
                  <span className="text-xl font-bold text-[#059669]">
                    {submissions.filter((s) => s.status === "approved").length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#F59E0B]/5 rounded-xl">
                  <span className="font-medium text-[#1E293B]">Revision Requests</span>
                  <span className="text-xl font-bold text-[#F59E0B]">
                    {submissions.filter((s) => s.status === "needs_revision").length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <Card className="border-[#E2E8F0] shadow-sm bg-gradient-to-br from-white to-[#F8FAFC]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1E293B]">
                <div className="p-2 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                Compliance Monitoring Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-[#64748B]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1E293B] mb-2">Compliance Dashboard</h3>
                <p className="text-[#64748B]">Real-time compliance monitoring and reporting will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Verification Modal */}
      {showVerificationModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E2E8F0]">
            <div className="p-8 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white">
              <h2 className="text-2xl font-bold text-[#1E293B] mb-2">
                Verify Document: {selectedSubmission.document_title}
              </h2>
              <p className="text-[#64748B]">
                Submitted by {selectedSubmission.submitted_by.name} on{" "}
                {new Date(selectedSubmission.submitted_at).toLocaleDateString()}
              </p>
            </div>

            <div className="p-8 space-y-8">
              {/* Enhanced AI Validation Summary */}
              {selectedSubmission.ai_validation_score && (
                <div className="p-6 bg-gradient-to-r from-[#8B5CF6]/5 to-[#3B82F6]/5 rounded-xl border border-[#8B5CF6]/10">
                  <h3 className="font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    AI Validation Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-6 text-sm mb-4">
                    <div className="space-y-1">
                      <span className="text-[#64748B]">Validation Score:</span>
                      <div className="text-xl font-bold text-[#8B5CF6]">
                        {selectedSubmission.ai_validation_score.toFixed(1)}/10
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[#64748B]">Compliance Score:</span>
                      <div className="text-xl font-bold text-[#3B82F6]">
                        {selectedSubmission.compliance_score?.toFixed(1) || "N/A"}/10
                      </div>
                    </div>
                  </div>

                  {aiValidations[selectedSubmission.id]?.issues_found?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-[#1E293B] mb-3">Issues Found:</h4>
                      <ul className="space-y-2">
                        {aiValidations[selectedSubmission.id].issues_found.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-[#F97316] rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-[#1E293B]">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Verification Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-3">Verification Decision</label>
                  <Select
                    value={verificationData.status}
                    onValueChange={(value: "approved" | "rejected" | "needs_revision") =>
                      setVerificationData({ ...verificationData, status: value })
                    }
                  >
                    <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-[#059669]" />
                          Approve Document
                        </div>
                      </SelectItem>
                      <SelectItem value="needs_revision">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-[#F97316]" />
                          Request Revision
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-[#DC2626]" />
                          Reject Document
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-3">Quality Score (1-10)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={verificationData.quality_score || ""}
                    onChange={(e) =>
                      setVerificationData({
                        ...verificationData,
                        quality_score: Number.parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="Rate the document quality"
                    className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-3">Verification Notes</label>
                  <Textarea
                    value={verificationData.notes}
                    onChange={(e) => setVerificationData({ ...verificationData, notes: e.target.value })}
                    placeholder="Provide detailed feedback about the document..."
                    rows={4}
                    required
                    className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366]/20"
                  />
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-[#E2E8F0]">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowVerificationModal(false)
                    setSelectedSubmission(null)
                  }}
                  disabled={verificationLoading}
                  className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerifySubmission}
                  disabled={verificationLoading || !verificationData.notes.trim()}
                  className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] transition-all duration-200"
                >
                  {verificationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Submit Verification
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentReviewCenter
