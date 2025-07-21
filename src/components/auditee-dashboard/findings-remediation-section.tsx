import { ChartCard } from "./chart-card.tsx"
import { ListCard } from "./list-card.tsx"
import { DonutChart } from "./donut-chart.tsx" // Corrected import path
import { BarChart } from "./bar-chart.tsx" // Corrected import path
import { LineChart } from "./line-chart.tsx"
import { StatusBadge } from "./status-badge.tsx"
import { AlertTriangle, Clock } from "lucide-react"

interface FindingsRemediationProps {
  findingsBySeverity: { severity: string; count: number }[]
  findingsByStatus: { status: string; count: number }[]
  actionItemStatusBreakdown: { status: string; count: number }[]
  findingsTrendNew: { month: string; count: number }[]
  findingsTrendResolved: { month: string; count: number }[]
  topOverdueActionItems: {
    description: string
    due_date: string
    audit_name: string
    audit_id: number
  }[]
  findingsByType: { type: string; count: number }[]
  aiVsManualFindings: { label: string; value: number; color: string }[]
  avgTimeToResolveFindings: number
  topAssigneesOpenActions: { assignee: string; count: number }[]
}

export function FindingsRemediationSection({
  findingsBySeverity,
  findingsByStatus,
  actionItemStatusBreakdown,
  findingsTrendNew,
  findingsTrendResolved,
  topOverdueActionItems,
  findingsByType,
  aiVsManualFindings,
  avgTimeToResolveFindings,
  topAssigneesOpenActions,
}: FindingsRemediationProps) {
  const severityChartData = findingsBySeverity.map((item) => {
    let color = "#64748B"
    switch (item.severity) {
      case "critical":
        color = "#DC2626"
        break
      case "major":
        color = "#F97316"
        break
      case "minor":
        color = "#F59E0B"
        break
      case "informational":
        color = "#64748B"
        break
    }
    return { label: item.severity, value: item.count, color: color }
  })

  const findingsStatusChartData = findingsByStatus.map((item) => {
    let color = "#64748B"
    switch (item.status) {
      case "open":
        color = "#DC2626"
        break
      case "in_progress":
        color = "#F59E0B"
        break
      case "resolved":
      case "closed":
        color = "#059669"
        break
    }
    return { label: item.status, value: item.count, color: color }
  })

  const actionItemStatusChartData = actionItemStatusBreakdown.map((item) => {
    let color = "#003366"
    switch (item.status) {
      case "pending":
        color = "#F59E0B"
        break
      case "in_progress":
        color = "#F97316"
        break
      case "completed":
        color = "#059669"
        break
      case "overdue":
        color = "#DC2626"
        break
    }
    return { label: item.status, value: item.count, color: color }
  })

  const trendData = findingsTrendNew.map((newItem) => {
    const resolvedItem = findingsTrendResolved.find((r) => r.month === newItem.month)
    return {
      month: new Date(newItem.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      newCount: newItem.count,
      resolvedCount: resolvedItem?.count || 0,
    }
  })

  const findingsByTypeChartData = findingsByType.map((item) => ({
    label: item.type,
    value: item.count,
    color: "#003366",
  }))

  const aiVsManualFindingsChartData = aiVsManualFindings.map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color,
  }))

  const topAssigneesChartData = topAssigneesOpenActions.map((item) => ({
    label: item.assignee,
    value: item.count,
    color: "#003366",
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Findings by Severity">
        <div className="flex justify-center mb-4">
          <DonutChart data={severityChartData} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          {severityChartData.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-[#1E293B] capitalize">{item.label.replace(/_/g, " ")}:</span>
              <span className="font-medium text-[#64748B]">{item.value}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Findings by Status">
        <div className="flex justify-center mb-4">
          <DonutChart data={findingsStatusChartData} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          {findingsStatusChartData.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-[#1E293B] capitalize">{item.label.replace(/_/g, " ")}:</span>
              <span className="font-medium text-[#64748B]">{item.value}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Action Item Status Breakdown">
        <BarChart data={actionItemStatusChartData} />
      </ChartCard>

      <ChartCard title="Findings Trend (New vs. Resolved)">
        {trendData.length > 0 ? (
          <LineChart
            data={trendData}
            dataKey="month"
            lineKeys={[
              { key: "newCount", color: "#003366", name: "New Findings" },
              { key: "resolvedCount", color: "#059669", name: "Resolved Findings" },
            ]}
            xAxisKey="month"
            yAxisLabel="Count"
            tooltipFormatter={(value, name) => [`${value}`, name]}
          />
        ) : (
          <div className="text-center text-[#64748B] py-4">No findings data for the last 12 months.</div>
        )}
      </ChartCard>

      <ChartCard title="Findings by Type">
        <BarChart data={findingsByTypeChartData} />
      </ChartCard>

      <ChartCard title="AI Detected vs. Manual Findings">
        <div className="flex justify-center mb-4">
          <DonutChart data={aiVsManualFindingsChartData} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          {aiVsManualFindingsChartData.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-[#1E293B] capitalize">{item.label.replace(/_/g, " ")}:</span>
              <span className="font-medium text-[#64748B]">{item.value}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Average Time to Resolve Findings">
        <div className="flex flex-col items-center justify-center h-full py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#059669] to-[#047857] rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <p className="text-4xl font-bold text-[#059669]">{avgTimeToResolveFindings.toFixed(1)} days</p>
          <p className="text-sm text-[#64748B] mt-2">Avg. days to resolve a finding.</p>
        </div>
      </ChartCard>

      <ChartCard title="Top Assignees for Open Action Items">
        <BarChart data={topAssigneesChartData} />
      </ChartCard>

      <ListCard
        title="Top 5 Overdue Action Items"
        emptyMessage="No overdue action items."
        emptyIcon={AlertTriangle}
        className="lg:col-span-2"
      >
        <div className="space-y-4">
          {topOverdueActionItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-[#FEE2E2] border border-[#DC2626] border-opacity-20 rounded-lg"
            >
              <div className="w-10 h-10 bg-[#DC2626] rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#1E293B]">{item.description}</p>
                <p className="text-sm text-[#64748B]">
                  Audit: {item.audit_name} | Due: {new Date(item.due_date).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status="overdue" />
            </div>
          ))}
        </div>
      </ListCard>
    </div>
  )
}
