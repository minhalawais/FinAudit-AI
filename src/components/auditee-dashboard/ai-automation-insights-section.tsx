import { ChartCard } from "./chart-card.tsx"
import { BarChart } from "./bar-chart.tsx" // Corrected import path
import { DonutChart } from "./donut-chart.tsx" // Corrected import path
import { KpiCard } from "./kpi-card.tsx"
import { Brain, FileWarning, Zap } from "lucide-react"

interface AiAutomationInsightsProps {
  aiValidationOverview: {
    avg_score: number
    issues_flagged_count: number
  }
  aiVsManualFindings: { label: string; value: number; color: string }[]
  automatedWorkflowCompletionRate: number
  aiRiskFocusAreas: { area: string; count: number }[]
}

export function AiAutomationInsightsSection({
  aiValidationOverview,
  aiVsManualFindings,
  automatedWorkflowCompletionRate,
  aiRiskFocusAreas,
}: AiAutomationInsightsProps) {
  const aiVsManualFindingsChartData = aiVsManualFindings.map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color,
  }))

  const aiRiskFocusAreasChartData = aiRiskFocusAreas.map((item) => ({
    label: item.area,
    value: item.count,
    color: "#003366",
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <KpiCard
        title="Avg AI Doc Validation Score"
        value={`${aiValidationOverview.avg_score}%`}
        icon={Brain}
        iconBgGradient="bg-gradient-to-br from-[#003366] to-[#004D99]"
        valueColor="text-[#003366]"
        progressBar={{ value: aiValidationOverview.avg_score, color: "bg-gradient-to-r from-[#003366] to-[#004D99]" }}
      />
      <KpiCard
        title="Docs Flagged by AI"
        value={aiValidationOverview.issues_flagged_count}
        icon={FileWarning}
        iconBgGradient="bg-gradient-to-br from-[#F97316] to-[#EA580C]"
        valueColor="text-[#F97316]"
      />
      <KpiCard
        title="Automated Workflow Completion"
        value={`${automatedWorkflowCompletionRate}%`}
        icon={Zap}
        iconBgGradient="bg-gradient-to-br from-[#059669] to-[#047857]"
        valueColor="text-[#059669]"
        progressBar={{ value: automatedWorkflowCompletionRate, color: "bg-gradient-to-r from-[#059669] to-[#047857]" }}
      />

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

      <ChartCard title="Top AI Risk Focus Areas" className="lg:col-span-2">
        <BarChart data={aiRiskFocusAreasChartData} />
      </ChartCard>
    </div>
  )
}
