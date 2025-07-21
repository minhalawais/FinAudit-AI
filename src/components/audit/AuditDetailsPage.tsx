"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "../ui/button.tsx"
import { ArrowLeft, Calendar, User, Building, Shield, Bell } from "lucide-react"
import AuditDetailsActions from "./AuditDetails/AuditDetailsActions.tsx"
import AuditDetailsTabsEnhanced from "./AuditDetails/AuditDetailsTabs.tsx"
import { useAxios } from "../../hooks/useAxios.ts"
import { Badge } from "../ui/badge.tsx"

interface AuditDetail {
  id: number
  name: string
  description: string
  financial_audit_type: string
  status: "planned" | "in_progress" | "completed" | "cancelled" | "pending_approval"
  approval_status: "pending" | "approved" | "rejected" | "requires_revision"
  progress: number
  deadline: string
  start_date: string
  end_date: string
  materiality_threshold: number
  estimated_budget: number
  complexity_score: number
  ai_confidence_score: number
  industry_type: string
  compliance_frameworks: string[]
  audit_methodology: string
  scope: string
  created_by: string
  created_at: string
  updated_at: string
  requires_approval: boolean
  ai_risk_score: number
  ai_suggestions: any
  historical_data_used: any
  assigned_auditors: Array<{
    id: number
    name: string
    email: string
    role: string
  }>
  // Enhanced fields
  compliance_summary?: {
    total_checkpoints: number
    passed: number
    failed: number
    warnings: number
    pending: number
  }
  notifications_summary?: {
    total: number
    unread: number
    high_priority: number
  }
  ai_validations_summary?: {
    total_validations: number
    average_score: number
    average_confidence: number
  }
  escalations_summary?: {
    total_escalations: number
    unresolved_escalations: number
  }
  verification_integrity?: {
    blockchain_enabled: boolean
    total_blocks: number
    integrity_verified: boolean
  }
}

const AuditDetailsPage: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>()
  const navigate = useNavigate()
  const axios = useAxios()
  const [audit, setAudit] = useState<AuditDetail | null>(null)
  const [enhancedDetails, setEnhancedDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (auditId) {
      fetchAuditDetail(Number.parseInt(auditId))
      fetchEnhancedDetails(Number.parseInt(auditId))
    }
  }, [auditId])

  const fetchAuditDetail = async (auditId: number) => {
    try {
      const response = await axios.get(`/api/audits/${auditId}`)
      setAudit(response.data.audit)
    } catch (error: any) {
      console.error("Error fetching audit detail:", error)
      const errorMessage = error.response?.data?.detail || "Failed to fetch audit details"
      alert(errorMessage)
      navigate("/audits")
    }
  }

  const fetchEnhancedDetails = async (auditId: number) => {
    try {
      const response = await axios.get(`/api/audits/${auditId}/enhanced-details`)
      setEnhancedDetails(response.data)
    } catch (error: any) {
      console.error("Error fetching enhanced details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuditUpdate = () => {
    if (auditId) {
      fetchAuditDetail(Number.parseInt(auditId))
      fetchEnhancedDetails(Number.parseInt(auditId))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6">
        <div className="max-w-8xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-[#E2E8F0] rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-8 bg-[#E2E8F0] rounded w-1/3"></div>
                <div className="h-4 bg-[#E2E8F0] rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-[#E2E8F0] rounded-xl"></div>
              <div className="h-32 bg-[#E2E8F0] rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6">
        <div className="max-w-8xl mx-auto">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building className="w-10 h-10 text-[#64748B]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1E293B] mb-4">Audit Not Found</h1>
            <p className="text-[#64748B] mb-6">The requested audit could not be found.</p>
            <Button
              onClick={() => navigate("/audits")}
              className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Audits
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-8xl mx-auto space-y-8">
        {/* Enhanced Header with Additional Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/audits")}
              className="p-3 hover:bg-[#F1F5F9] transition-all duration-200 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#003366] to-[#004D99] bg-clip-text text-transparent">
                {audit.name}
              </h1>
              <div className="flex items-center gap-6 text-sm text-[#64748B] flex-wrap">
                <div className="flex items-center gap-2 bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                  <div className="w-2 h-2 bg-[#059669] rounded-full"></div>
                  <span className="capitalize font-medium">{audit.status.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Created by {audit.created_by}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(audit.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">{audit.financial_audit_type.replace("_", " ").toUpperCase()}</span>
                </div>

                {/* Enhanced Status Indicators */}
                {enhancedDetails?.compliance_summary && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>
                      Compliance: {enhancedDetails.compliance_summary.passed}/
                      {enhancedDetails.compliance_summary.total_checkpoints}
                    </span>
                  </div>
                )}

                {enhancedDetails?.notifications_summary?.unread > 0 && (
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#F97316]" />
                    <Badge className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 border text-xs">
                      {enhancedDetails.notifications_summary.unread} unread
                    </Badge>
                  </div>
                )}

                {enhancedDetails?.escalations_summary?.unresolved_escalations > 0 && (
                  <Badge className="bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20 border text-xs">
                    {enhancedDetails.escalations_summary.unresolved_escalations} escalations
                  </Badge>
                )}

                {enhancedDetails?.verification_integrity?.blockchain_enabled && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#059669]" />
                    <Badge className="bg-[#059669]/10 text-[#059669] border-[#059669]/20 border text-xs">
                      Blockchain Verified
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          <AuditDetailsActions
            auditId={audit.id}
            auditStatus={audit.status}
            auditApprovalStatus={audit.approval_status}
            onStartAudit={handleAuditUpdate}
            onPauseAudit={handleAuditUpdate}
            onViewRequirements={() => console.log("View requirements")}
            onAddRequirement={() => console.log("Add requirement")}
          />
        </div>

        {/* Enhanced Summary Cards */}
        {enhancedDetails && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {enhancedDetails.compliance_summary && (
              <div className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 rounded-xl p-4 border border-[#8B5CF6]/20">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#8B5CF6]" />
                  <div>
                    <div className="text-lg font-bold text-[#1E293B]">
                      {enhancedDetails.compliance_summary.passed}/{enhancedDetails.compliance_summary.total_checkpoints}
                    </div>
                    <div className="text-sm text-[#64748B]">Compliance Passed</div>
                  </div>
                </div>
              </div>
            )}

            {enhancedDetails.ai_validations_summary && (
              <div className="bg-gradient-to-br from-[#3B82F6]/10 to-[#1D4ED8]/5 rounded-xl p-4 border border-[#3B82F6]/20">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#3B82F6] rounded text-white flex items-center justify-center text-xs font-bold">
                    AI
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#1E293B]">
                      {enhancedDetails.ai_validations_summary.average_score}%
                    </div>
                    <div className="text-sm text-[#64748B]">AI Validation Score</div>
                  </div>
                </div>
              </div>
            )}

            {enhancedDetails.notifications_summary && (
              <div className="bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/5 rounded-xl p-4 border border-[#F59E0B]/20">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#F59E0B]" />
                  <div>
                    <div className="text-lg font-bold text-[#1E293B]">
                      {enhancedDetails.notifications_summary.unread}
                    </div>
                    <div className="text-sm text-[#64748B]">Unread Notifications</div>
                  </div>
                </div>
              </div>
            )}

            {enhancedDetails.verification_integrity && (
              <div className="bg-gradient-to-br from-[#059669]/10 to-[#047857]/5 rounded-xl p-4 border border-[#059669]/20">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#059669]" />
                  <div>
                    <div className="text-lg font-bold text-[#1E293B]">
                      {enhancedDetails.verification_integrity.total_blocks}
                    </div>
                    <div className="text-sm text-[#64748B]">Verification Blocks</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Tabs with New Features */}
        <AuditDetailsTabsEnhanced auditId={audit.id} auditData={audit} />
      </div>
    </div>
  )
}

export default AuditDetailsPage
