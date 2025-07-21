import { KpiCard } from "./kpi-card.tsx"
import { BarChart3, Users, FileText, AlertTriangle, TrendingUp, CheckCircle2, Clock } from "lucide-react"

interface AuditOverviewProps {
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
}

export function AuditOverviewSection({ kpis }: AuditOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      <KpiCard
        title="Total Audits"
        value={kpis.total_audits}
        icon={BarChart3}
        iconBgGradient="bg-gradient-to-br from-[#003366] to-[#004D99]"
        trend={{ percentage: 12, text: "from last month", color: "text-[#059669]" }}
      />
      <KpiCard
        title="Active Audits"
        value={kpis.active_audits}
        icon={Users}
        iconBgGradient="bg-gradient-to-br from-[#F59E0B] to-[#D97706]"
        valueColor="text-[#F59E0B]"
        trend={{ percentage: 0, text: "In progress", color: "text-[#64748B]" }}
      />
      <KpiCard
        title="Pending Submissions"
        value={kpis.pending_submissions}
        icon={FileText}
        iconBgGradient="bg-gradient-to-br from-[#F97316] to-[#EA580C]"
        valueColor="text-[#F97316]"
        trend={{ percentage: 0, text: "Awaiting action", color: "text-[#64748B]" }}
      />
      <KpiCard
        title="Overdue Actions"
        value={kpis.overdue_actions}
        icon={AlertTriangle}
        iconBgGradient="bg-gradient-to-br from-[#DC2626] to-[#B91C1C]"
        valueColor="text-[#DC2626]"
        trend={{ percentage: 0, text: "Requires attention", color: "text-[#DC2626]" }}
      />
      <KpiCard
        title="Compliance Score"
        value={`${kpis.compliance_score}%`}
        icon={TrendingUp}
        iconBgGradient="bg-gradient-to-br from-[#059669] to-[#047857]"
        valueColor="text-[#059669]"
        progressBar={{ value: kpis.compliance_score, color: "bg-gradient-to-r from-[#059669] to-[#047857]" }}
      />
      <KpiCard
        title="Avg Doc Approval (1st Pass)"
        value={`${kpis.avg_document_approval_rate_first_pass}%`}
        icon={CheckCircle2}
        iconBgGradient="bg-gradient-to-br from-[#059669] to-[#047857]"
        valueColor="text-[#059669]"
        progressBar={{
          value: kpis.avg_document_approval_rate_first_pass,
          color: "bg-gradient-to-r from-[#059669] to-[#047857]",
        }}
      />
      <KpiCard
        title="Avg Audit Duration"
        value={`${kpis.avg_audit_duration} days`}
        icon={Clock}
        iconBgGradient="bg-gradient-to-br from-[#003366] to-[#004D99]"
        valueColor="text-[#003366]"
      />
      <KpiCard
        title="Audit Completion Rate"
        value={`${kpis.avg_audit_completion_rate}%`}
        icon={TrendingUp}
        iconBgGradient="bg-gradient-to-br from-[#F59E0B] to-[#D97706]"
        valueColor="text-[#F59E0B]"
        progressBar={{ value: kpis.avg_audit_completion_rate, color: "bg-gradient-to-r from-[#F59E0B] to-[#D97706]" }}
      />
    </div>
  )
}
