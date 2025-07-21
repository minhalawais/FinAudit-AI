"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog.tsx"
import { Button } from "../../ui/button.tsx"
import { Input } from "../../ui/input.tsx"
import { Textarea } from "../../ui/textarea.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select.tsx"
import { Label } from "../../ui/label.tsx"
import { Alert, AlertDescription } from "../../ui/alert.tsx"
import { FileText, Users, AlertTriangle, Plus, Calendar, Target } from 'lucide-react'

interface CreateFindingModalProps {
  isOpen: boolean
  onClose: () => void
  auditId: number
  onFindingCreated: () => void
}

interface DocumentSubmission {
  id: number
  document: {
    title: string
    file_type: string
  }
  requirement: {
    document_type: string
  }
  submitted_at: string
}

interface Meeting {
  id: number
  title: string
  meeting_type: string
  scheduled_time: string
}

export default function CreateFindingModal({ isOpen, onClose, auditId, onFindingCreated }: CreateFindingModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    finding_type: "compliance",
    severity: "medium",
    priority_level: "medium",
    reference_type: "document",
    document_submission_id: "",
    meeting_id: "",
    assigned_to: "",
    due_date: "",
    impact_assessment: "",
    root_cause_analysis: "",
  })

  const [documentSubmissions, setDocumentSubmissions] = useState<DocumentSubmission[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchDocumentSubmissions()
      fetchMeetings()
    }
  }, [isOpen, auditId])

  const fetchDocumentSubmissions = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/findings/audit/${auditId}/document-submissions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setDocumentSubmissions(data.submissions || [])
      } else {
        console.error("Failed to fetch document submissions:", response.status)
      }
    } catch (error) {
      console.error("Error fetching document submissions:", error)
    }
  }

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/findings/audit/${auditId}/meetings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMeetings(data.meetings || [])
      } else {
        console.error("Failed to fetch meetings:", response.status)
      }
    } catch (error) {
      console.error("Error fetching meetings:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.document_submission_id && !formData.meeting_id) {
        throw new Error("Please select either a document submission or meeting to reference")
      }

      const payload = {
        audit_id: auditId,
        title: formData.title,
        description: formData.description,
        finding_type: formData.finding_type,
        severity: formData.severity,
        priority_level: formData.priority_level,
        document_submission_id: formData.document_submission_id
          ? Number.parseInt(formData.document_submission_id)
          : null,
        meeting_id: formData.meeting_id ? Number.parseInt(formData.meeting_id) : null,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
        impact_assessment: formData.impact_assessment || null,
        root_cause_analysis: formData.root_cause_analysis || null,
        finding_source: "manual",
      }

      const response = await fetch("http://127.0.0.1:8000/api/findings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to create finding")
      }

      onFindingCreated()
      onClose()

      setFormData({
        title: "",
        description: "",
        finding_type: "compliance",
        severity: "medium",
        priority_level: "medium",
        reference_type: "document",
        document_submission_id: "",
        meeting_id: "",
        assigned_to: "",
        due_date: "",
        impact_assessment: "",
        root_cause_analysis: "",
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReferenceTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      reference_type: type,
      document_submission_id: "",
      meeting_id: "",
    }))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white"
      case "major":
        return "bg-[#F97316] text-white"
      case "minor":
        return "bg-[#F59E0B] text-white"
      case "informational":
        return "bg-[#003366] text-white"
      default:
        return "bg-[#64748B] text-white"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-[#DC2626] border-red-200"
      case "medium":
        return "bg-orange-50 text-[#F97316] border-orange-200"
      case "low":
        return "bg-emerald-50 text-[#059669] border-emerald-200"
      default:
        return "bg-slate-50 text-[#64748B] border-slate-200"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white border-[#E2E8F0] shadow-2xl">
        <DialogHeader className="pb-6 border-b border-[#E2E8F0] bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-t-lg -m-6 mb-6 p-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <Plus className="w-7 h-7" />
            Create New Audit Finding
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="border-[#DC2626] bg-red-50">
            <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
            <AlertDescription className="text-[#DC2626] font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-[#F8FAFC] p-6 rounded-xl border border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#003366]" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-[#1E293B] font-semibold">Finding Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the finding"
                  required
                  className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="finding_type" className="text-[#1E293B] font-semibold">Finding Type</Label>
                <Select
                  value={formData.finding_type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, finding_type: value }))}
                >
                  <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0] shadow-xl">
                    <SelectItem value="compliance" className="hover:bg-[#F1F5F9]">Compliance Issue</SelectItem>
                    <SelectItem value="control_deficiency" className="hover:bg-[#F1F5F9]">Control Deficiency</SelectItem>
                    <SelectItem value="documentation_issue" className="hover:bg-[#F1F5F9]">Documentation Issue</SelectItem>
                    <SelectItem value="process_inefficiency" className="hover:bg-[#F1F5F9]">Process Inefficiency</SelectItem>
                    <SelectItem value="risk_exposure" className="hover:bg-[#F1F5F9]">Risk Exposure</SelectItem>
                    <SelectItem value="financial_misstatement" className="hover:bg-[#F1F5F9]">Financial Misstatement</SelectItem>
                    <SelectItem value="internal_control_weakness" className="hover:bg-[#F1F5F9]">Internal Control Weakness</SelectItem>
                    <SelectItem value="regulatory_violation" className="hover:bg-[#F1F5F9]">Regulatory Violation</SelectItem>
                    <SelectItem value="operational_issue" className="hover:bg-[#F1F5F9]">Operational Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <Label htmlFor="description" className="text-[#1E293B] font-semibold">Finding Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the finding, including what was observed and why it's a concern"
                className="min-h-[120px] border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white resize-none"
                required
              />
            </div>
          </div>

          {/* Severity and Priority */}
          <div className="bg-[#F8FAFC] p-6 rounded-xl border border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#F97316]" />
              Severity & Priority
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="severity" className="text-[#1E293B] font-semibold">Severity *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0] shadow-xl">
                    <SelectItem value="critical" className="hover:bg-[#F1F5F9]">Critical</SelectItem>
                    <SelectItem value="major" className="hover:bg-[#F1F5F9]">Major</SelectItem>
                    <SelectItem value="minor" className="hover:bg-[#F1F5F9]">Minor</SelectItem>
                    <SelectItem value="informational" className="hover:bg-[#F1F5F9]">Informational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="priority_level" className="text-[#1E293B] font-semibold">Priority Level</Label>
                <Select
                  value={formData.priority_level}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, priority_level: value }))}
                >
                  <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0] shadow-xl">
                    <SelectItem value="high" className="hover:bg-[#F1F5F9]">High</SelectItem>
                    <SelectItem value="medium" className="hover:bg-[#F1F5F9]">Medium</SelectItem>
                    <SelectItem value="low" className="hover:bg-[#F1F5F9]">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="due_date" className="text-[#1E293B] font-semibold">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                  className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white"
                />
              </div>
            </div>
          </div>

          {/* Reference Selection */}
          <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
            <h3 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
              Finding Reference *
            </h3>
            <p className="text-[#64748B] mb-6 leading-relaxed">
              Manual findings must reference either a document submission or meeting where the issue was identified.
            </p>

            <div className="flex gap-4 mb-6">
              <Button
                type="button"
                variant={formData.reference_type === "document" ? "default" : "outline"}
                onClick={() => handleReferenceTypeChange("document")}
                className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
                  formData.reference_type === "document"
                    ? "bg-gradient-to-r from-[#003366] to-[#004D99] text-white shadow-md"
                    : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#003366]"
                }`}
              >
                <FileText className="w-5 h-5" />
                Document Submission
              </Button>
              <Button
                type="button"
                variant={formData.reference_type === "meeting" ? "default" : "outline"}
                onClick={() => handleReferenceTypeChange("meeting")}
                className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
                  formData.reference_type === "meeting"
                    ? "bg-gradient-to-r from-[#003366] to-[#004D99] text-white shadow-md"
                    : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#003366]"
                }`}
              >
                <Users className="w-5 h-5" />
                Meeting
              </Button>
            </div>

            {formData.reference_type === "document" && (
              <div className="space-y-3">
                <Label htmlFor="document_submission_id" className="text-[#1E293B] font-semibold">Select Document Submission *</Label>
                <Select
                  value={formData.document_submission_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      document_submission_id: value,
                      meeting_id: "",
                    }))
                  }
                >
                  <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white">
                    <SelectValue placeholder="Choose a document submission..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0] shadow-xl">
                    {documentSubmissions.map((submission) => (
                      <SelectItem key={submission.id} value={submission.id.toString()} className="hover:bg-[#F1F5F9]">
                        <div className="flex flex-col py-2">
                          <span className="font-semibold text-[#1E293B]">{submission.document.title}</span>
                          <span className="text-sm text-[#64748B]">
                            {submission.requirement.document_type} •{" "}
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.reference_type === "meeting" && (
              <div className="space-y-3">
                <Label htmlFor="meeting_id" className="text-[#1E293B] font-semibold">Select Meeting *</Label>
                <Select
                  value={formData.meeting_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      meeting_id: value,
                      document_submission_id: "",
                    }))
                  }
                >
                  <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white">
                    <SelectValue placeholder="Choose a meeting..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0] shadow-xl">
                    {meetings.map((meeting) => (
                      <SelectItem key={meeting.id} value={meeting.id.toString()} className="hover:bg-[#F1F5F9]">
                        <div className="flex flex-col py-2">
                          <span className="font-semibold text-[#1E293B]">{meeting.title}</span>
                          <span className="text-sm text-[#64748B]">
                            {meeting.meeting_type} • {new Date(meeting.scheduled_time).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Assignment */}
          <div className="bg-[#F8FAFC] p-6 rounded-xl border border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#059669]" />
              Assignment
            </h3>
            <div className="space-y-3">
              <Label htmlFor="assigned_to" className="text-[#1E293B] font-semibold">Assigned To</Label>
              <Input
                id="assigned_to"
                value={formData.assigned_to}
                onChange={(e) => setFormData((prev) => ({ ...prev, assigned_to: e.target.value }))}
                placeholder="Person responsible for addressing this finding"
                className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white"
              />
            </div>
          </div>

          {/* Analysis */}
          <div className="bg-[#F8FAFC] p-6 rounded-xl border border-[#E2E8F0]">
            <h3 className="text-lg font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#F97316]" />
              Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="impact_assessment" className="text-[#1E293B] font-semibold">Impact Assessment</Label>
                <Textarea
                  id="impact_assessment"
                  value={formData.impact_assessment}
                  onChange={(e) => setFormData((prev) => ({ ...prev, impact_assessment: e.target.value }))}
                  placeholder="Describe the potential impact of this finding"
                  className="min-h-[100px] border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="root_cause_analysis" className="text-[#1E293B] font-semibold">Root Cause Analysis</Label>
                <Textarea
                  id="root_cause_analysis"
                  value={formData.root_cause_analysis}
                  onChange={(e) => setFormData((prev) => ({ ...prev, root_cause_analysis: e.target.value }))}
                  placeholder="Analysis of the underlying cause of this finding"
                  className="min-h-[100px] border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-[#E2E8F0]">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] px-8 py-3"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white px-8 py-3 shadow-md hover:shadow-lg transition-all duration-200"
            >
              {loading ? "Creating..." : "Create Finding"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
