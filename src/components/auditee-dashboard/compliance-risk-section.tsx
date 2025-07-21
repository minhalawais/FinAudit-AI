import { ChartCard } from "./chart-card.tsx"
import { BarChart } from "./bar-chart.tsx"
import { DonutChart } from "./donut-chart.tsx"
import { AlertTriangle } from "lucide-react"

interface ComplianceRiskProps {
  complianceCheckpointsStatus?: { status: string; count: number }[]
  avgAiRiskScoreAudits?: number
  escalatedRequirementsCount?: number
  riskAssessmentOverview?: {
    risk_level: string
    count: number
  }[]
  complianceCheckpointScoreDistribution?: { range: string; count: number }[]
  escalationTypeDistribution?: { type: string; count: number }[]
  aiRiskLevelDistribution?: { risk_level: string; count: number }[]
}

export function ComplianceRiskSection({
  complianceCheckpointsStatus = [],
  avgAiRiskScoreAudits = 0,
  escalatedRequirementsCount = 0,
  riskAssessmentOverview = [],
  complianceCheckpointScoreDistribution = [],
  escalationTypeDistribution = [],
  aiRiskLevelDistribution = [],
}: ComplianceRiskProps) {
  const complianceCheckpointChartData = complianceCheckpointsStatus.map((item) => {
    let color = "#64748B"
    switch (item.status) {
      case "passed":
        color = "#059669"
        break
      case "failed":
        color = "#DC2626"
        break
      case "warning":
        color = "#F97316"
        break
    }
    return { label: item.status, value: item.count, color: color }
  })

  const riskAssessmentChartData = riskAssessmentOverview.map((item) => {
    let color = "#64748B"
    switch (item.risk_level) {
      case "critical":
        color = "#DC2626"
        break
      case "high":
        color = "#F97316"
        break
      case "medium":
        color = "#F59E0B"
        break
      case "low":
        color = "#059669"
        break
    }
    return { label: item.risk_level, value: item.count, color: color }
  })

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "text-[#DC2626]"
    if (score >= 50) return "text-[#F97316]"
    return "text-[#059669]"
  }

  const checkpointScoreChartData = complianceCheckpointScoreDistribution.map((item) => {
    let color = "#64748B"
    switch (item.range) {
      case "90-100":
        color = "#059669"
        break
      case "70-89":
        color = "#F59E0B"
        break
      case "50-69":
        color = "#F97316"
        break
      case "<50":
        color = "#DC2626"
        break
    }
    return { label: item.range, value: item.count, color: color }
  })

  const escalationTypeChartData = escalationTypeDistribution.map((item) => {
    let color = "#64748B"
    switch (item.type) {
      case "overdue":
        color = "#DC2626"
        break
      case "high_priority":
        color = "#F97316"
        break
      case "compliance_critical":
        color = "#003366"
        break
      case "quality_issue":
        color = "#F59E0B"
        break
    }
    return { label: item.type.replace(/_/g, " "), value: item.count, color: color }
  })

  const aiRiskLevelChartData = aiRiskLevelDistribution.map((item) => {
    let color = "#64748B"
    switch (item.risk_level) {
      case "critical":
        color = "#DC2626"
        break
      case "high":
        color = "#F97316"
        break
      case "medium":
        color = "#F59E0B"
        break
      case "low":
        color = "#059669"
        break
    }
    return { label: item.risk_level, value: item.count, color: color }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {complianceCheckpointChartData.length > 0 && (
        <ChartCard title="Compliance Checkpoints Status">
          <BarChart data={complianceCheckpointChartData} />
        </ChartCard>
      )}

      <ChartCard title="Average AI Risk Score (Audits)">
        <div className="flex flex-col items-center justify-center h-full py-4">
          <div className={`text-6xl font-bold ${getRiskScoreColor(avgAiRiskScoreAudits)}`}>
            {avgAiRiskScoreAudits.toFixed(1)}
          </div>
          <p className="text-sm text-[#64748B] mt-2">Overall AI-assessed risk across all audits.</p>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2 mt-4">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                avgAiRiskScoreAudits >= 80
                  ? "bg-[#DC2626]"
                  : avgAiRiskScoreAudits >= 50
                    ? "bg-[#F97316]"
                    : "bg-[#059669]"
              }`}
              style={{ width: `${avgAiRiskScoreAudits}%` }}
            ></div>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Escalated Requirements">
        <div className="flex flex-col items-center justify-center h-full py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <p className="text-4xl font-bold text-[#DC2626]">{escalatedRequirementsCount}</p>
          <p className="text-sm text-[#64748B] mt-2">Unresolved escalated document requirements.</p>
        </div>
      </ChartCard>

      {riskAssessmentChartData.length > 0 && (
        <ChartCard title="Risk Assessment Overview (Manual)">
          <BarChart data={riskAssessmentChartData} />
        </ChartCard>
      )}

      {checkpointScoreChartData.length > 0 && (
        <ChartCard title="Compliance Checkpoint Score Distribution">
          <div className="flex justify-center mb-4">
            <DonutChart data={checkpointScoreChartData} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm mt-4">
            {checkpointScoreChartData.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-[#1E293B] capitalize">{item.label}:</span>
                <span className="font-medium text-[#64748B]">{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {escalationTypeChartData.length > 0 && (
        <ChartCard title="Escalation Type Distribution">
          <BarChart data={escalationTypeChartData} />
        </ChartCard>
      )}

      {aiRiskLevelChartData.length > 0 && (
        <ChartCard title="AI Risk Level Distribution">
          <div className="flex justify-center mb-4">
            <DonutChart data={aiRiskLevelChartData} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm mt-4">
            {aiRiskLevelChartData.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-[#1E293B] capitalize">{item.label.replace(/_/g, " ")}:</span>
                <span className="font-medium text-[#64748B]">{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  )
}