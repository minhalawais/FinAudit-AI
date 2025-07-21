import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface DonutChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
  strokeWidth?: number
}

export function DonutChart({ data, size = 120, strokeWidth = 20 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="absolute text-center">
          <span className="text-xl font-bold text-[#1E293B]">0</span>
          <p className="text-xs text-[#64748B]">Total</p>
        </div>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={(size - strokeWidth) / 2}
            outerRadius={size / 2}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "0.5rem" }}
            labelStyle={{ color: "#1E293B" }}
            itemStyle={{ color: "#64748B" }}
            formatter={(value: number, name: string, props: any) => [value, props.payload.label]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute text-center">
        <span className="text-xl font-bold text-[#1E293B]">{total}</span>
        <p className="text-xs text-[#64748B]">Total</p>
      </div>
    </div>
  )
}
