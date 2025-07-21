"use client"
import {
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface LineChartProps {
  data: { [key: string]: any }[]
  dataKey: string
  lineKeys: { key: string; color: string; name?: string }[]
  xAxisKey?: string
  yAxisLabel?: string
  tooltipFormatter?: (value: any, name: string, props: any) => [string, string]
}

export function LineChart({
  data,
  dataKey,
  lineKeys,
  xAxisKey = dataKey,
  yAxisLabel,
  tooltipFormatter,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-[#64748B]">No data available for this chart.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsLineChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey={xAxisKey} stroke="#94A3B8" tickLine={false} axisLine={false} />
        <YAxis
          stroke="#94A3B8"
          tickLine={false}
          axisLine={false}
          label={{ value: yAxisLabel, angle: -90, position: "insideLeft", fill: "#94A3B8" }}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3", stroke: "#E2E8F0" }}
          contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "0.5rem" }}
          labelStyle={{ color: "#1E293B" }}
          itemStyle={{ color: "#64748B" }}
          formatter={tooltipFormatter}
        />
        {lineKeys.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 4, fill: line.color, stroke: "#FFFFFF", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: line.color, stroke: "#FFFFFF", strokeWidth: 2 }}
            name={line.name || line.key}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
