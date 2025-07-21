import type React from "react"

interface ChartCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 transition-all duration-300 hover:shadow-lg ${className}`}
    >
      <h3 className="text-lg font-semibold text-[#1E293B] mb-4">{title}</h3>
      {children}
    </div>
  )
}
