"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  Search, 
  BarChart3, 
  FileText, 
  AlertTriangle, 
  Calendar, 
  Shield, 
  Bot, 
  TrendingUp, 
  Briefcase,
  Users,
  Clock,
  Target
} from "lucide-react"
import { Button } from "../ui/button.tsx"
import { AuditOverviewSection } from "../../components/auditee-dashboard/audit-overview-section.tsx"
import { AuditAnalysisSection } from "../../components/auditee-dashboard/audit-analysis-section.tsx"
import { DocumentManagementSection } from "../../components/auditee-dashboard/document-management-section.tsx"
import { FindingsRemediationSection } from "../../components/auditee-dashboard/findings-remediation-section.tsx"
import { MeetingsCommunicationSection } from "../../components/auditee-dashboard/meetings-communication-section.tsx"
import { ComplianceRiskSection } from "../../components/auditee-dashboard/compliance-risk-section.tsx"
import { AiAutomationInsightsSection } from "../../components/auditee-dashboard/ai-automation-insights-section.tsx"
import { HistoricalReportingSection } from "../../components/auditee-dashboard/historical-reporting-section.tsx"

interface AuditeeDashboardData {
  kpis: {
    total_audits: number
    active_audits: number
    pending_submissions: number
    overdue_actions: number
    compliance_score: number
    avg_document_approval_rate_first_pass: number
    avg_audit_duration: number
    avg_audit_completion_rate: number
  }
  audit_portfolio_analysis: {
    status_distribution: { status: string; count: number }[]
    type_distribution: { type: string; count: number }[]
    compliance_frameworks: { framework: string; count: number }[]
    progress_over_time: { month: string; completed_count: number }[]
    approval_status_distribution: { status: string; count: number }[]
  }
  document_management: {
    submission_status_breakdown: { status: string; count: number }[]
    workflow_stages: { stage: string; count: number }[]
    overdue_requirements: {
      document_type: string
      deadline: string
      audit_name: string
      audit_id: number
    }[]
    documents_by_type: { type: string; count: number }[]
    avg_revision_rounds: number
    submission_timeliness: { label: string; value: number; color: string }[]
  }
  findings_remediation: {
    findings_by_severity: { severity: string; count: number }[]
    findings_by_status: { status: string; count: number }[]
    action_item_status_breakdown: { status: string; count: number }[]
    findings_trend_new: { month: string; count: number }[]
    findings_trend_resolved: { month: string; count: number }[]
    top_overdue_action_items: {
      description: string
      due_date: string
      audit_name: string
      audit_id: number
    }[]
    findings_by_type: { type: string; count: number }[]
    ai_vs_manual_findings: { label: string; value: number; color: string }[]
    avg_time_to_resolve_findings: number
    top_assignees_open_actions: { assignee: string; count: number }[]
  }
  meetings_communication: {
    upcoming_meetings: {
      title: string
      meeting_type: string
      scheduled_time: string
      meeting_id: number
      audit_name: string
      audit_id: number
    }[]
    meeting_status_distribution: { status: string; count: number }[]
    avg_meeting_duration: number
    meetings_with_action_items_percentage: number
    meeting_attendance_rate: number
    unread_messages_count: number
  }
  compliance_risk_insights: {
    compliance_checkpoints_status: { status: string; count: number }[]
    avg_ai_risk_score_audits: number
    escalatedRequirementsCount: number
    riskAssessmentOverview: { risk_level: string; count: number }[]
    compliance_checkpoint_score_distribution: { range: string; count: number }[]
    escalationTypeDistribution: { type: string; count: number }[]
    aiRiskLevelDistribution: { risk_level: string; count: number }[]
  }
  ai_automation_insights: {
    ai_validation_overview: {
      avg_score: number
      issues_flagged_count: number
    }
    ai_vs_manual_findings: { label: string; value: number; color: string }[]
    automated_workflow_completion_rate: number
    ai_risk_focus_areas: { area: string; count: number }[]
  }
  historical_reporting: {
    report_status_distribution: { status: string; count: number }[]
    peer_review_rate: number
    audit_performance_trends: { month: string; avg_findings: number }[]
    lessons_learned_count: number
  }
}

const tabConfig = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    gradient: 'from-[#003366] to-[#004D99]'
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: Briefcase,
    gradient: 'from-[#059669] to-[#047857]'
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    gradient: 'from-[#F59E0B] to-[#D97706]'
  },
  {
    id: 'findings',
    label: 'Findings',
    icon: AlertTriangle,
    gradient: 'from-[#F97316] to-[#EA580C]'
  },
  {
    id: 'meetings',
    label: 'Meetings',
    icon: Calendar,
    gradient: 'from-[#8B5CF6] to-[#7C3AED]'
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: Shield,
    gradient: 'from-[#DC2626] to-[#B91C1C]'
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    icon: Bot,
    gradient: 'from-[#06B6D4] to-[#0891B2]'
  },
  {
    id: 'reporting',
    label: 'Reporting',
    icon: TrendingUp,
    gradient: 'from-[#EC4899] to-[#DB2777]'
  }
]

export default function AuditeeDashboard() {
  const [dashboardData, setDashboardData] = useState<AuditeeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("Authentication token not found. Please log in.")
          setLoading(false)
          return
        }

        const response = await fetch("http://127.0.0.1:8000/auditee/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Failed to fetch dashboard data")
        }

        const data: AuditeeDashboardData = await response.json()
        setDashboardData(data)
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err)
        setError(err.message || "An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const renderTabContent = () => {
    if (!dashboardData) return null

    switch (activeTab) {
      case 'overview':
        return <AuditOverviewSection kpis={dashboardData.kpis} />
      case 'portfolio':
        return (
          <AuditAnalysisSection
            auditStatusDistribution={dashboardData.audit_portfolio_analysis.status_distribution}
            auditTypeDistribution={dashboardData.audit_portfolio_analysis.type_distribution}
            complianceFrameworks={dashboardData.audit_portfolio_analysis.compliance_frameworks}
            auditProgressOverTime={dashboardData.audit_portfolio_analysis.progress_over_time}
            auditApprovalStatusDistribution={dashboardData.audit_portfolio_analysis.approval_status_distribution}
          />
        )
      case 'documents':
        return (
          <DocumentManagementSection
            submissionStatusBreakdown={dashboardData.document_management.submission_status_breakdown}
            workflowStages={dashboardData.document_management.workflow_stages}
            overdueRequirements={dashboardData.document_management.overdue_requirements}
            documentsByType={dashboardData.document_management.documents_by_type}
            avgRevisionRounds={dashboardData.document_management.avg_revision_rounds}
            submissionTimeliness={dashboardData.document_management.submission_timeliness}
          />
        )
      case 'findings':
        return (
          <FindingsRemediationSection
            findingsBySeverity={dashboardData.findings_remediation.findings_by_severity}
            findingsByStatus={dashboardData.findings_remediation.findings_by_status}
            actionItemStatusBreakdown={dashboardData.findings_remediation.action_item_status_breakdown}
            findingsTrendNew={dashboardData.findings_remediation.findings_trend_new}
            findingsTrendResolved={dashboardData.findings_remediation.findings_trend_resolved}
            topOverdueActionItems={dashboardData.findings_remediation.top_overdue_action_items}
            findingsByType={dashboardData.findings_remediation.findings_by_type}
            aiVsManualFindings={dashboardData.findings_remediation.ai_vs_manual_findings}
            avgTimeToResolveFindings={dashboardData.findings_remediation.avg_time_to_resolve_findings}
            topAssigneesOpenActions={dashboardData.findings_remediation.top_assignees_open_actions}
          />
        )
      case 'meetings':
        return (
          <MeetingsCommunicationSection
            upcomingMeetings={dashboardData.meetings_communication.upcoming_meetings}
            meetingStatusDistribution={dashboardData.meetings_communication.meeting_status_distribution}
            avgMeetingDuration={dashboardData.meetings_communication.avg_meeting_duration}
            meetingsWithActionItemsPercentage={dashboardData.meetings_communication.meetings_with_action_items_percentage}
            meetingAttendanceRate={dashboardData.meetings_communication.meeting_attendance_rate}
            unreadMessagesCount={dashboardData.meetings_communication.unread_messages_count}
          />
        )
      case 'compliance':
        return (
          <ComplianceRiskSection
            complianceCheckpointsStatus={dashboardData.compliance_risk_insights.compliance_checkpoints_status}
            avgAiRiskScoreAudits={dashboardData.compliance_risk_insights.avg_ai_risk_score_audits}
            escalatedRequirementsCount={dashboardData.compliance_risk_insights.escalatedRequirementsCount}
            riskAssessmentOverview={dashboardData.compliance_risk_insights.riskAssessmentOverview}
            complianceCheckpointScoreDistribution={
              dashboardData.compliance_risk_insights.compliance_checkpoint_score_distribution
            }
            escalationTypeDistribution={dashboardData.compliance_risk_insights.escalationTypeDistribution}
            aiRiskLevelDistribution={dashboardData.compliance_risk_insights.aiRiskLevelDistribution}
          />
        )
      case 'ai-insights':
        return (
          <AiAutomationInsightsSection
            aiValidationOverview={dashboardData.ai_automation_insights.ai_validation_overview}
            aiVsManualFindings={dashboardData.ai_automation_insights.ai_vs_manual_findings}
            automatedWorkflowCompletionRate={dashboardData.ai_automation_insights.automated_workflow_completion_rate}
            aiRiskFocusAreas={dashboardData.ai_automation_insights.ai_risk_focus_areas}
          />
        )
      case 'reporting':
        return (
          <HistoricalReportingSection
            reportStatusDistribution={dashboardData.historical_reporting.report_status_distribution}
            peerReviewRate={dashboardData.historical_reporting.peer_review_rate}
            auditPerformanceTrends={dashboardData.historical_reporting.audit_performance_trends}
            lessonsLearnedCount={dashboardData.historical_reporting.lessons_learned_count}
          />
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E2E8F0] border-t-[#003366] mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-[#F59E0B] animate-spin-slow mx-auto"></div>
          </div>
          <p className="mt-4 text-[#64748B] font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl max-w-md mx-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">Dashboard Error</h2>
          <p className="text-[#64748B] mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-[#003366] to-[#004D99] text-white hover:shadow-lg transition-all duration-200"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl max-w-md mx-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#64748B] to-[#475569] rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">No Data Available</h2>
          <p className="text-[#64748B]">Please ensure you are logged in and associated with a company.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#003366] to-[#004D99] rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E293B]">Audit Management Dashboard</h1>
                <p className="text-[#64748B] text-sm">Comprehensive audit portfolio and compliance management</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all duration-200 w-full sm:w-auto">
                <Search className="w-4 h-4" />
                Search Audits
              </Button>
              <Button className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg hover:shadow-[#003366]/25 transition-all duration-200 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Create New Audit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabConfig.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                    isActive
                      ? `text-[#003366] border-[#003366] bg-gradient-to-b from-transparent to-[#F8FAFC]/50`
                      : `text-[#64748B] border-transparent hover:text-[#1E293B] hover:border-[#E2E8F0]`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-in fade-in duration-300">
          {renderTabContent()}
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-white border-t border-[#E2E8F0] mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#059669] to-[#047857] rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1E293B]">{dashboardData.kpis.total_audits}</p>
                <p className="text-xs text-[#64748B]">Total Audits</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1E293B]">{dashboardData.kpis.active_audits}</p>
                <p className="text-xs text-[#64748B]">Active Audits</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1E293B]">{dashboardData.kpis.pending_submissions}</p>
                <p className="text-xs text-[#64748B]">Pending</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1E293B]">{dashboardData.kpis.overdue_actions}</p>
                <p className="text-xs text-[#64748B]">Overdue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}