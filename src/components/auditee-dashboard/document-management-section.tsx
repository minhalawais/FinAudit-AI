import { ChartCard } from "./chart-card.tsx"
import { ListCard } from "./list-card.tsx"
import { DonutChart } from "./donut-chart.tsx" // Corrected import path
import { BarChart } from "./bar-chart.tsx" // Corrected import path
import { StatusBadge } from "./status-badge.tsx"
import { FileText, Clock, RefreshCcw } from "lucide-react"

interface DocumentManagementProps {
  submissionStatusBreakdown: { status: string; count: number }[]
  workflowStages: { stage: string; count: number }[]
  overdueRequirements: {
    document_type: string
    deadline: string
    audit_name: string
    audit_id: number
  }[]
  documentsByType: { type: string; count: number }[]
  avgRevisionRounds: number
  submissionTimeliness: { label: string; value: number; color: string }[]
}

export function DocumentManagementSection({
  submissionStatusBreakdown,
  workflowStages,
  overdueRequirements,
  documentsByType,
  avgRevisionRounds,
  submissionTimeliness,
}: DocumentManagementProps) {
  const submissionStatusChartData = submissionStatusBreakdown.map((item) => {
    let color = "#64748B"
    switch (item.status) {
      case "approved":
        color = "#059669"
        break
      case "pending":
        color = "#F59E0B"
        break
      case "rejected":
        color = "#DC2626"
        break
      case "needs_revision":
        color = "#F97316"
        break
    }
    return { label: item.status, value: item.count, color: color }
  })

  const workflowStagesChartData = workflowStages.map((item) => {
    let color = "#003366"
    switch (item.stage) {
      case "submitted":
        color = "#003366"
        break
      case "ai_validating":
        color = "#F59E0B"
        break
      case "ai_validated":
        color = "#059669"
        break
      case "under_review":
        color = "#64748B"
        break
      case "approved":
        color = "#059669"
        break
      case "rejected":
        color = "#DC2626"
        break
      case "needs_revision":
        color = "#F97316"
        break
      case "escalated":
        color = "#DC2626"
        break
    }
    return { label: item.stage, value: item.count, color: color }
  })

  const documentsByTypeChartData = documentsByType.map((item) => ({
    label: item.type,
    value: item.count,
    color: "#003366",
  }))

  const submissionTimelinessChartData = submissionTimeliness.map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Document Submission Status">
        <div className="flex justify-center mb-4">
          <DonutChart data={submissionStatusChartData} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          {submissionStatusChartData.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-[#1E293B] capitalize">{item.label.replace(/_/g, " ")}:</span>
              <span className="font-medium text-[#64748B]">{item.value}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Document Workflow Stages">
        <BarChart data={workflowStagesChartData} />
      </ChartCard>

      <ListCard
        title="Overdue Document Requirements"
        emptyMessage="No overdue document requirements."
        emptyIcon={FileText}
        className="lg:col-span-2"
      >
        <div className="space-y-4">
          {overdueRequirements.map((req, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-[#FEF3C7] border border-[#F59E0B] border-opacity-20 rounded-lg"
            >
              <div className="w-10 h-10 bg-[#DC2626] rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#1E293B]">{req.document_type}</p>
                <p className="text-sm text-[#64748B]">
                  Audit: {req.audit_name} | Due: {new Date(req.deadline).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status="overdue" />
            </div>
          ))}
        </div>
      </ListCard>

      <ChartCard title="Documents by Type">
        <BarChart data={documentsByTypeChartData} />
      </ChartCard>

      <ChartCard title="Average Document Revision Rounds">
        <div className="flex flex-col items-center justify-center h-full py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center mb-4">
            <RefreshCcw className="w-8 h-8 text-white" />
          </div>
          <p className="text-4xl font-bold text-[#F59E0B]">{avgRevisionRounds}</p>
          <p className="text-sm text-[#64748B] mt-2">Avg. times documents are revised before approval.</p>
        </div>
      </ChartCard>

      <ChartCard title="Document Submission Timeliness">
        <div className="flex justify-center mb-4">
          <DonutChart data={submissionTimelinessChartData} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          {submissionTimelinessChartData.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-[#1E293B] capitalize">{item.label.replace(/_/g, " ")}:</span>
              <span className="font-medium text-[#64748B]">{item.value}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
