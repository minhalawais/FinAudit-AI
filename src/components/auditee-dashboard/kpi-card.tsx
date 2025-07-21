import type React from "react"
import { TrendingUp } from "lucide-react"

interface KpiCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  iconBgGradient: string
  valueColor?: string
  trend?: {
    percentage: number
    text: string
    color: string
  }
  progressBar?: {
    value: number
    color: string
  }
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconBgGradient,
  valueColor = "text-[#1E293B]",
  trend,
  progressBar,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#64748B] text-sm font-medium">{title}</p>
          <p className={`${valueColor} text-2xl font-bold mt-1`}>{value}</p>
        </div>
        <div className={`${iconBgGradient} w-12 h-12 rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className={`${trend.color} w-4 h-4 mr-1`} />
          <span className={trend.color}>{trend.percentage > 0 ? `+${trend.percentage}%` : `${trend.percentage}%`}</span>
          <span className="text-[#64748B] ml-1">{trend.text}</span>
        </div>
      )}
      {progressBar && (
        <div className="mt-4">
          <div className="w-full bg-[#E2E8F0] rounded-full h-2">
            <div
              className={`${progressBar.color} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${progressBar.value}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}
