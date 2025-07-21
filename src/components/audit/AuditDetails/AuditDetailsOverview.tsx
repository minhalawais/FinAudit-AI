"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Progress } from "../../ui/progress.tsx"
import {
  Calendar,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  Brain,
  Shield,
  Activity,
  Target,
  BarChart3,
  Zap,
  TrendingUp,
  Clock,
} from "lucide-react"

interface AuditDetailsOverviewProps {
  auditId: number
  auditData: any
}

const AuditDetailsOverview: React.FC<AuditDetailsOverviewProps> = ({ auditId, auditData }) => {
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-[#059669] to-[#047857] text-white"
      case "in_progress":
        return "bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white"
      case "planned":
        return "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white"
      case "cancelled":
        return "bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white"
      default:
        return "bg-gradient-to-r from-[#94A3B8] to-[#64748B] text-white"
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white"
      case "high":
        return "bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white"
      case "medium":
        return "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white"
      case "low":
        return "bg-gradient-to-r from-[#059669] to-[#047857] text-white"
      default:
        return "bg-gradient-to-r from-[#94A3B8] to-[#64748B] text-white"
    }
  }

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-gradient-to-r from-[#059669] to-[#047857] text-white"
      case "rejected":
        return "bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white"
      case "requires_revision":
        return "bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white"
      default:
        return "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white"
    }
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-[#E2E8F0] shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC] overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#3B82F6]/10 to-[#1D4ED8]/5 rounded-bl-3xl"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <Badge className={`${getStatusColor(auditData?.status)} shadow-sm font-medium`}>
                {auditData?.status?.toUpperCase().replace("_", " ")}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-[#1E293B]">{auditData?.progress || 0}%</div>
              <Progress value={auditData?.progress || 0} className="h-3 bg-[#E2E8F0]" />
              <p className="text-sm font-medium text-[#64748B]">Overall completion</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC] overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#059669]/10 to-[#047857]/5 rounded-bl-3xl"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-[#64748B]">Budget Utilization</div>
                <div className="text-lg font-bold text-[#1E293B]">
                  {auditData?.actual_cost && auditData?.estimated_budget
                    ? `${((auditData.actual_cost / auditData.estimated_budget) * 100).toFixed(1)}%`
                    : "N/A"}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-[#1E293B]">
                ${auditData?.estimated_budget?.toLocaleString() || "0"}
              </div>
              <p className="text-sm font-medium text-[#64748B]">
                Estimated Budget
                {auditData?.actual_cost && (
                  <span className="block text-xs text-[#94A3B8] mt-1">
                    Actual: ${auditData.actual_cost.toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC] overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#F97316]/10 to-[#EA580C]/5 rounded-bl-3xl"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <Badge className={`${getRiskColor(auditData?.riskLevel)} shadow-sm font-medium`}>
                {auditData?.riskLevel?.toUpperCase() || "MEDIUM"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-[#1E293B]">
                {auditData?.ai_risk_score?.toFixed(1) || "5.0"}/10
              </div>
              <p className="text-sm font-medium text-[#64748B]">AI Risk Assessment</p>
              <div className="text-xs text-[#94A3B8] bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0] inline-block">
                Confidence: {((auditData?.ai_confidence_score || 0.8) * 100).toFixed(0)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC] overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 rounded-bl-3xl"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <Badge className={`${getApprovalStatusColor(auditData?.approval_status)} shadow-sm font-medium`}>
                {auditData?.approval_status?.toUpperCase().replace("_", " ") || "PENDING"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-[#1E293B]">
                {auditData?.complexity_score?.toFixed(1) || "N/A"}
              </div>
              <p className="text-sm font-medium text-[#64748B]">Complexity Score</p>
              <div className="text-xs text-[#94A3B8] bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0] inline-block">
                {auditData?.audit_methodology?.replace("_", " ").toUpperCase() || "RISK BASED"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC] group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#64748B]">Documents</p>
                <p className="text-3xl font-bold text-[#1E293B]">{auditData?.requirements_count || 0}</p>
                <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0] inline-block">
                  {auditData?.completed_requirements || 0} completed
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#003366] to-[#004D99] rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC] group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#64748B]">Findings</p>
                <p className="text-3xl font-bold text-[#F97316]">{auditData?.findings_count || 0}</p>
                <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0] inline-block">
                  {auditData?.critical_findings || 0} critical
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC] group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#64748B]">Team Members</p>
                <p className="text-3xl font-bold text-[#8B5CF6]">{auditData?.assigned_auditors?.length || 0}</p>
                <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0] inline-block">
                  Active auditors
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC] group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#64748B]">Meetings</p>
                <p className="text-3xl font-bold text-[#059669]">{auditData?.meetings?.length || 0}</p>
                <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0] inline-block">
                  {auditData?.meetings?.filter((m: any) => m.status === "completed").length || 0} completed
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Timeline and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#1E293B]">
              <div className="p-2 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              Audit Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-[#059669] to-[#047857] rounded-full shadow-sm"></div>
                  <span className="text-sm font-semibold text-[#1E293B]">Created</span>
                </div>
                <span className="text-sm text-[#64748B] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                  {auditData?.created_at ? new Date(auditData.created_at).toLocaleDateString() : "Not set"}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full shadow-sm ${
                      auditData?.start_date ? "bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8]" : "bg-[#94A3B8]"
                    }`}
                  ></div>
                  <span className="text-sm font-semibold text-[#1E293B]">Start Date</span>
                </div>
                <span className="text-sm text-[#64748B] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                  {auditData?.start_date ? new Date(auditData.start_date).toLocaleDateString() : "Not set"}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full shadow-sm ${
                      auditData?.end_date ? "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]" : "bg-[#94A3B8]"
                    }`}
                  ></div>
                  <span className="text-sm font-semibold text-[#1E293B]">End Date</span>
                </div>
                <span className="text-sm text-[#64748B] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                  {auditData?.end_date ? new Date(auditData.end_date).toLocaleDateString() : "Not set"}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full shadow-sm ${
                      auditData?.deadline ? "bg-gradient-to-r from-[#F97316] to-[#EA580C]" : "bg-[#94A3B8]"
                    }`}
                  ></div>
                  <span className="text-sm font-semibold text-[#1E293B]">Deadline</span>
                </div>
                <span className="text-sm text-[#64748B] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                  {auditData?.deadline ? new Date(auditData.deadline).toLocaleDateString() : "Not set"}
                </span>
              </div>
            </div>

            {/* Enhanced Duration and Progress */}
            {auditData?.start_date && auditData?.end_date && (
              <div className="mt-6 p-6 bg-gradient-to-r from-[#F8FAFC] via-white to-[#F1F5F9] rounded-xl border border-[#E2E8F0] shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration
                  </span>
                  <span className="text-sm text-[#64748B] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                    {Math.ceil(
                      (new Date(auditData.end_date).getTime() - new Date(auditData.start_date).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </span>
                </div>
                <Progress value={auditData?.progress || 0} className="h-3 bg-[#E2E8F0]" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#1E293B]">
              <div className="p-2 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              AI Analysis & Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enhanced AI Confidence Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl text-white shadow-lg">
                <div className="text-2xl font-bold">{((auditData?.ai_confidence_score || 0.8) * 100).toFixed(0)}%</div>
                <div className="text-sm opacity-90 mt-1">AI Confidence</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl text-white shadow-lg">
                <div className="text-2xl font-bold">{auditData?.ai_risk_score?.toFixed(1) || "5.0"}</div>
                <div className="text-sm opacity-90 mt-1">Risk Score</div>
              </div>
            </div>

            {/* Enhanced AI Suggestions */}
            {auditData?.ai_suggestions?.key_recommendations && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  AI Recommendations
                </h4>
                <div className="space-y-3">
                  {auditData.ai_suggestions.key_recommendations.slice(0, 3).map((suggestion: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0] hover:shadow-sm transition-all duration-200"
                    >
                      <div className="p-1.5 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-full mt-0.5 shadow-sm">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-[#64748B] leading-relaxed">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Compliance Frameworks */}
            {auditData?.compliance_frameworks && auditData.compliance_frameworks.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Compliance Frameworks
                </h4>
                <div className="flex flex-wrap gap-2">
                  {auditData.compliance_frameworks.map((framework: string, index: number) => (
                    <Badge
                      key={index}
                      className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 border font-medium hover:bg-[#3B82F6]/20 transition-colors duration-200"
                    >
                      {framework}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Description and Scope */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit Description
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[#64748B] leading-relaxed">{auditData?.description || "No description provided"}</p>
            {auditData?.industry_type && (
              <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-lg">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-[#1E293B]">Industry:</span>
                  <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 border font-medium">
                    {auditData.industry_type.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#1E293B] flex items-center gap-2">
              <Target className="w-5 h-5" />
              Audit Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[#64748B] leading-relaxed">{auditData?.scope || "No scope defined"}</p>
            {auditData?.materiality_threshold && (
              <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-[#1E293B]">Materiality Threshold:</span>
                  <span className="text-sm font-bold text-[#64748B] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                    ${auditData.materiality_threshold.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AuditDetailsOverview
