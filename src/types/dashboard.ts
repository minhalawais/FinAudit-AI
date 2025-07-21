import type React from "react"
export interface StatsCardProps {
  title: string
  value: string
  change?: string
  icon: React.ComponentType<any>
}



export interface ChartData {
  name: string
  value: number
}

export interface WorkflowData {
  id: string
  name: string
  status: string
  completionRate: number
  duration: number
}

export interface ReportData {
  id: string
  startDate: string
  endDate: string
  type: string
  status: string
}

