import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  maxHeight?: number
  barColor?: string
}

export function BarChart({ data, maxHeight = 150, barColor = "#003366" }: BarChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-[#64748B]">No data available for this chart.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={maxHeight + 40}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#94A3B8"
          tickLine={false}
          axisLine={false}
          angle={-45}
          textAnchor="end"
          height={60}
          interval={0}
          style={{ fontSize: "12px" }}
        />
        <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} style={{ fontSize: "12px" }} />
        <Tooltip
          cursor={{ fill: "#F1F5F9" }}
          contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "0.5rem" }}
          labelStyle={{ color: "#1E293B" }}
          itemStyle={{ color: "#64748B" }}
          formatter={(value: number, name: string, props: any) => [value, props.payload.label]}
        />
        <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
