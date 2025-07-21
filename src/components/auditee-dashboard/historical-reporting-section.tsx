import { ChartCard } from "./chart-card.tsx"
import { DonutChart } from "./donut-chart.tsx" // Corrected import path
import { LineChart } from "./line-chart.tsx"
import { KpiCard } from "./kpi-card.tsx"
import { TrendingUp, BookOpen } from "lucide-react"

interface HistoricalReportingProps {
  reportStatusDistribution: { status: string; count: number }[]
  peerReviewRate: number
  auditPerformanceTrends: { month: string; avg_findings: number }[]
  lessonsLearnedCount: number
}

export function HistoricalReportingSection({
  reportStatusDistribution,
  peerReviewRate,
  auditPerformanceTrends,
  lessonsLearnedCount,
}: HistoricalReportingProps) {
  const reportStatusChartData = reportStatusDistribution.map((item) => {
    let color = "#64748B"
    switch (item.status) {
      case "draft":
        color = "#F59E0B"
        break
      case "review":
        color = "#003366"
        break
      case "final":
        color = "#059669"
        break
    }
    return { label: item.status, value: item.count, color: color }
  })

  const auditPerformanceTrendData = auditPerformanceTrends.map((item) => ({
    month: new Date(item.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    avg_findings: item.avg_findings,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <KpiCard
        title="Peer Review Rate"
        value={`${peerReviewRate}%`}
        icon={TrendingUp}
        iconBgGradient="bg-gradient-to-br from-[#059669] to-[#047857]"
        valueColor="text-[#059669]"
        progressBar={{ value: peerReviewRate, color: "bg-gradient-to-r from-[#059669] to-[#047857]" }}
      />
      <KpiCard
        title="Lessons Learned Entries"
        value={lessonsLearnedCount}
        icon={BookOpen}
        iconBgGradient="bg-gradient-to-br from-[#003366] to-[#004D99]"
        valueColor="text-[#003366]"
      />

      <ChartCard title="Audit Report Status Distribution">
        <div className="flex justify-center mb-4">
          <DonutChart data={reportStatusChartData} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          {reportStatusChartData.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-[#1E293B] capitalize">{item.label.replace(/_/g, " ")}:</span>
              <span className="font-medium text-[#64748B]">{item.value}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Avg Findings per Completed Audit (Trend)">
        {auditPerformanceTrendData.length > 0 ? (
          <LineChart
            data={auditPerformanceTrendData}
            dataKey="month"
            lineKeys={[{ key: "avg_findings", color: "#F59E0B", name: "Avg Findings" }]}
            xAxisKey="month"
            yAxisLabel="Avg. Findings"
            tooltipFormatter={(value, name) => [`${value}`, name]}
          />
        ) : (
          <div className="text-center text-[#64748B] py-4">No historical audit data available.</div>
        )}
      </ChartCard>
    </div>
  )
}
