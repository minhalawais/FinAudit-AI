import { ChartCard } from "./chart-card.tsx"
import { DonutChart } from "./donut-chart.tsx"
import { BarChart } from "./bar-chart.tsx" // Corrected import path
import { LineChart } from "./line-chart.tsx"
import { CalendarDays } from "lucide-react"

interface AuditAnalysisProps {
  auditStatusDistribution: { status: string; count: number }[]
  auditTypeDistribution: { type: string; count: number }[]
  complianceFrameworks: { framework: string; count: number }[]
  auditProgressOverTime: { month: string; completed_count: number }[]
  auditApprovalStatusDistribution: { status: string; count: number }[]
}

export function AuditAnalysisSection({
  auditStatusDistribution,
  auditTypeDistribution,
  complianceFrameworks,
  auditProgressOverTime,
  auditApprovalStatusDistribution,
}: AuditAnalysisProps) {
  const statusChartData = auditStatusDistribution.map((item) => {
    let color = "#64748B"
    switch (item.status) {
      case "completed":
        color = "#059669"
        break
      case "in_progress":
        color = "#F59E0B"
        break
      case "planned":
        color = "#003366"
        break
      case "cancelled":
        color = "#DC2626"
        break
      case "archived":
        color = "#64748B"
        break
    }
    return { label: item.status, value: item.count, color: color }
  })

  const typeChartData = auditTypeDistribution.map((item) => {
    let color = "#003366"
    switch (item.type) {
      case "compliance":
        color = "#003366"
        break
      case "financial":
        color = "#F59E0B"
        break
      case "operational":
        color = "#059669"
        break
      case "it":
        color = "#F97316"
        break
      case "internal":
        color = "#64748B"
        break
      case "external":
        color = "#94A3B8"
        break
    }
    return { label: item.type, value: item.count, color: color }
  })

  const frameworkChartData = complianceFrameworks.map((item) => ({
    label: item.framework,
    value: item.count,
    color: "#003366",
  }))

  const progressTrendData = auditProgressOverTime.map((item) => ({
    month: new Date(item.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    completed_count: item.completed_count,
  }))

  const approvalStatusChartData = auditApprovalStatusDistribution.map((item) => {
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
      case "requires_revision":
        color = "#F97316"
        break
    }
    return { label: item.status, value: item.count, color: color }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Audit Status Distribution">
        <div className="flex justify-center mb-4">
          <DonutChart data={statusChartData} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          {statusChartData.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-[#1E293B] capitalize">{item.label.replace(/_/g, " ")}:</span>
              <span className="font-medium text-[#64748B]">{item.value}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Audit Type Distribution">
        <BarChart data={typeChartData} />
      </ChartCard>

      <ChartCard title="Audits by Compliance Framework">
        <BarChart data={frameworkChartData} barColor="#003366" />
      </ChartCard>

      <ChartCard title="Audit Approval Status">
        <div className="flex justify-center mb-4">
          <DonutChart data={approvalStatusChartData} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          {approvalStatusChartData.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-[#1E293B] capitalize">{item.label.replace(/_/g, " ")}:</span>
              <span className="font-medium text-[#64748B]">{item.value}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Audit Progress Over Time (Completed Audits)" className="lg:col-span-2">
        {progressTrendData.length > 0 ? (
          <LineChart
            data={progressTrendData}
            dataKey="month"
            lineKeys={[{ key: "completed_count", color: "#059669", name: "Completed Audits" }]}
            xAxisKey="month"
            yAxisLabel="Count"
            tooltipFormatter={(value, name) => [`${value}`, name]}
          />
        ) : (
          <div className="text-center text-[#64748B] py-4">No completed audits in the last 12 months.</div>
        )}
        <p className="text-sm text-[#64748B] mt-4 flex items-center gap-2 justify-center">
          <CalendarDays className="w-4 h-4" />
          Trend of completed audits over the last 12 months.
        </p>
      </ChartCard>
    </div>
  )
}
