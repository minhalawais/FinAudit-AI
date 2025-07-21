"use client"

import { useState, useEffect } from "react"
import { 
  FileText, Users, Activity, TrendingUp, Briefcase, FileCheck, 
  Clock, AlertTriangle, ArrowUp, ArrowDown, FileSearch, 
  FileArchive, FileInput, FileOutput, CheckCircle, Clock4, AlertCircle 
} from "lucide-react"
import { Card } from "../../components/ui/Card.tsx"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format, subDays } from "date-fns"
import { Skeleton } from "../../components/ui/Skeleton.tsx"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// StatsCard component
function StatsCard({ title, value, change, icon: Icon, isLoading = false }) {
  const isPositive = !change ? true : Number.parseFloat(change) >= 0

  if (isLoading) {
    return (
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border">
        <div className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="p-4 pt-0">
          <Skeleton className="h-6 w-[80px]" />
          <Skeleton className="h-4 w-[60px] mt-2" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border">
      <div className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <h3 className="text-sm font-medium text-slate-gray">{title}</h3>
        <div className="p-2 bg-gradient-to-br from-navy-blue/10 to-navy-blue/5 rounded-full">
          <Icon className="h-4 w-4 text-navy-blue" />
        </div>
      </div>
      <div className="p-4 pt-0">
        <div className="text-xl font-bold text-dark-text">{value}</div>
        {change !== undefined && (
          <p className={`text-xs flex items-center font-medium ${isPositive ? "text-success-green" : "text-error-red"}`}>
            {isPositive ? (
              <ArrowUp className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 mr-1" />
            )}
            {change}
          </p>
        )}
      </div>
    </Card>
  )
}

// ActivityItem component
function ActivityItem({ activity }: { activity: any }) {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div className="bg-navy-blue/10 p-2 rounded-full">
          <Activity className="h-4 w-4 text-navy-blue" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-dark-text">{activity.action}</p>
          <span className="text-xs text-slate-gray">
            {format(new Date(activity.created_at), 'MMM d, h:mm a')}
          </span>
        </div>
        <p className="text-xs text-slate-gray mt-1">
          By {activity.user} • Document #{activity.document_id}
        </p>
      </div>
    </div>
  )
}

// ApprovalItem component
function ApprovalItem({ approval }: { approval: any }) {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div className="bg-soft-gold/10 p-2 rounded-full">
          <FileCheck className="h-4 w-4 text-soft-gold" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-dark-text">{approval.document_title}</p>
          {approval.timeout_at && (
            <span className="text-xs text-slate-gray">
              Due {format(new Date(approval.timeout_at), 'MMM d')}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-gray mt-1">
          Step {approval.current_step} • Started {format(new Date(approval.started_at), 'MMM d')}
        </p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [currentStatsIndex, setCurrentStatsIndex] = useState(0)
  
  // Fetch dashboard data
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  
  // Fetch dashboard data with auth token
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [statsRes, activityRes, approvalsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        axios.get('http://127.0.0.1:8000/dashboard/recent-activity', {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        axios.get('http://127.0.0.1:8000/dashboard/pending-approvals', {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      ])
      return {
        stats: statsRes.data,
        activity: activityRes.data,
        approvals: approvalsRes.data
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!token, // Only run query if token exists
  })

  // Process document type data for chart
  const documentTypeData = {
    labels: dashboardData?.stats.document_stats.types.map(t => t.type.split('/').pop() || 'Unknown') || [],
    datasets: [{
      label: "Document Types",
      data: dashboardData?.stats.document_stats.types.map(t => t.count) || [],
      backgroundColor: [
        'rgba(0, 51, 102, 0.8)',
        'rgba(5, 150, 105, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(220, 38, 38, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(100, 116, 139, 0.8)'
      ],
      borderWidth: 1,
    }],
  }

  // Process workflow status data for chart
  const workflowStatusData = {
    labels: dashboardData?.stats.workflow_stats.statuses.map(s => s.status.replace('_', ' ')) || [],
    datasets: [{
      label: "Workflow Status",
      data: dashboardData?.stats.workflow_stats.statuses.map(s => s.count) || [],
      backgroundColor: [
        'rgba(5, 150, 105, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(220, 38, 38, 0.8)',
        'rgba(100, 116, 139, 0.8)'
      ],
      borderWidth: 1,
    }],
  }

  // Process version timeline data for chart
  const versionTimelineData = {
    labels: dashboardData?.stats.version_stats.timeline.map(v => format(new Date(v.date), 'MMM d')) || [],
    datasets: [{
      label: "Document Versions",
      data: dashboardData?.stats.version_stats.timeline.map(v => v.count) || [],
      fill: true,
      backgroundColor: 'rgba(0, 51, 102, 0.1)',
      borderColor: 'rgba(0, 51, 102, 0.8)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(0, 77, 153, 0.8)',
    }],
  }

  // Process activity timeline data for chart
  const activityTimelineData = {
    labels: dashboardData?.stats.activity_stats.timeline.map(a => format(new Date(a.date), 'MMM d')) || [],
    datasets: [{
      label: "User Activity",
      data: dashboardData?.stats.activity_stats.timeline.map(a => a.count) || [],
      fill: true,
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.8)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(217, 119, 6, 0.8)',
    }],
  }

  // Process workflow step performance data for chart
  const stepPerformanceData = {
    labels: dashboardData?.stats.workflow_stats.step_performance.map(s => `Step ${s.step}`) || [],
    datasets: [{
      label: "Average Time (seconds)",
      data: dashboardData?.stats.workflow_stats.step_performance.map(s => s.avg_time) || [],
      backgroundColor: [
        'rgba(0, 51, 102, 0.8)',
        'rgba(5, 150, 105, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(100, 116, 139, 0.8)'
      ],
      borderWidth: 1,
    }],
  }

  // Stats cards data
  const allStats = [
    [
      { 
        title: "Total Documents", 
        value: dashboardData?.stats.document_stats.total || '0', 
        icon: FileText,
        change: dashboardData?.stats.document_stats.recent ? 
          `+${Math.round((dashboardData.stats.document_stats.recent / dashboardData.stats.document_stats.total) * 100)}%` : '0%'
      },
      { 
        title: "Active Workflows", 
        value: dashboardData?.stats.workflow_stats.statuses.find(s => s.status === 'in_progress')?.count || '0', 
        icon: FileSearch,
        change: undefined
      },
      { 
        title: "Recent Activity", 
        value: dashboardData?.activity?.length || '0', 
        icon: Activity,
        change: undefined
      },
      { 
        title: "Document Versions", 
        value: dashboardData?.stats.version_stats.timeline.reduce((sum, v) => sum + v.count, 0) || '0', 
        icon: FileArchive,
        change: undefined
      },
    ],
    [
      { 
        title: "Pending Approvals", 
        value: dashboardData?.approvals?.length || '0', 
        icon: FileInput,
        change: undefined
      },
      { 
        title: "Completed Workflows", 
        value: dashboardData?.stats.workflow_stats.statuses.find(s => s.status === 'completed')?.count || '0', 
        icon: FileOutput,
        change: undefined
      },
      { 
        title: "Avg. Step Time", 
        value: dashboardData?.stats.workflow_stats.step_performance.length ? 
          `${Math.round(dashboardData.stats.workflow_stats.step_performance.reduce((sum, s) => sum + s.avg_time, 0) / dashboardData.stats.workflow_stats.step_performance.length)}s` : '0s', 
        icon: Clock4,
        change: undefined
      },
      { 
        title: "Rejected Workflows", 
        value: dashboardData?.stats.workflow_stats.statuses.find(s => s.status === 'rejected')?.count || '0', 
        icon: AlertCircle,
        change: undefined
      },
    ],
  ]

  // Common chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 10,
          },
          padding: 10,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1E293B',
        bodyColor: '#1E293B',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 6,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 10,
        }
      }
    }
  }

  // Custom styles for swiper
  const swiperCustomStyles = `
    .swiper-pagination-bullet {
      width: 8px;
      height: 8px;
      background: #94A3B8;
      opacity: 0.5;
      transition: all 0.3s ease;
      display: none;
    }
    .swiper-pagination-bullet-active {
      opacity: 1;
      background: #003366;
      width: 16px;
      border-radius: 4px;
    }
    .swiper-button-next, .swiper-button-prev {
      color: #003366;
      background: rgba(255, 255, 255, 0.9);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    .swiper-button-next:hover, .swiper-button-prev:hover {
      background: rgba(255, 255, 255, 1);
      transform: scale(1.05);
    }
    .swiper-button-next:after, .swiper-button-prev:after {
      font-size: 14px;
      font-weight: bold;
    }
  `

  return (
    <div className="flex-1 space-y-6 p-6 pt-4 bg-primary-bg">
      {/* Inject custom swiper styles */}
      <style jsx global>{swiperCustomStyles}</style>

      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-navy-blue to-navy-blue-light p-6 rounded-lg shadow-md mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-white">Company Dashboard</h2>
        <p className="text-white/80 mt-1 text-sm">Analytics & Performance Overview</p>
      </div>

      {/* Stats Cards with Enhanced Swiper Slider */}
      <div className="mb-6">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={16}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          onSlideChange={(swiper) => setCurrentStatsIndex(swiper.activeIndex)}
          className="stats-swiper"
        >
          {allStats.map((statGroup, index) => (
            <SwiperSlide key={index}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statGroup.map((stat) => (
                  <StatsCard 
                    key={stat.title} 
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    icon={stat.icon}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Charts - Now 2 per row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Row 1 */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Document Types</h3>
            <div className="h-48">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <Pie data={documentTypeData} options={chartOptions} />
              )}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Workflow Status</h3>
            <div className="h-48">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <Doughnut data={workflowStatusData} options={chartOptions} />
              )}
            </div>
          </div>
        </Card>

        {/* Row 2 */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Version History</h3>
            <div className="h-48">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <Line data={versionTimelineData} options={chartOptions} />
              )}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">User Activity</h3>
            <div className="h-48">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <Line data={activityTimelineData} options={chartOptions} />
              )}
            </div>
          </div>
        </Card>

        {/* Row 3 */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Step Performance</h3>
            <div className="h-48">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <Bar data={stepPerformanceData} options={chartOptions} />
              )}
            </div>
          </div>
        </Card>

        {/* Recent Activity Card */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Recent Activity</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))
              ) : dashboardData?.activity?.length ? (
                dashboardData.activity.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <p className="text-sm text-slate-gray p-4">No recent activity</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Approvals and Key Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Approvals */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Pending Approvals</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))
              ) : dashboardData?.approvals?.length ? (
                dashboardData.approvals.map(approval => (
                  <ApprovalItem key={approval.id} approval={approval} />
                ))
              ) : (
                <p className="text-sm text-slate-gray p-4">No pending approvals</p>
              )}
            </div>
          </div>
        </Card>

        {/* Key Insights */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-navy-blue to-navy-blue-light bg-clip-text text-transparent">
              Key Insights
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-success-green/10 to-success-green/5 border border-success-green/20">
                    <p className="text-dark-text text-sm">
                      <span className="font-semibold">
                        {dashboardData?.stats.document_stats.recent ? 
                          `+${Math.round((dashboardData.stats.document_stats.recent / dashboardData.stats.document_stats.total) * 100)}%` : '0%'
                        }
                      </span> Document growth this week
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-navy-blue/10 to-navy-blue/5 border border-navy-blue/20">
                    <p className="text-dark-text text-sm">
                      <span className="font-semibold">
                        {dashboardData?.stats.workflow_stats.step_performance.length ? 
                          `${Math.round(dashboardData.stats.workflow_stats.step_performance.reduce((sum, s) => sum + s.avg_time, 0) / dashboardData.stats.workflow_stats.step_performance.length)}s` : '0s'
                        }
                      </span> Average step time
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-soft-gold/10 to-soft-gold/5 border border-soft-gold/20">
                    <p className="text-dark-text text-sm">
                      <span className="font-semibold">
                        {dashboardData?.stats.workflow_stats.statuses.find(s => s.status === 'completed')?.count || '0'}
                      </span> Workflows completed
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-slate-gray/10 to-slate-gray/5 border border-slate-gray/20">
                    <p className="text-dark-text text-sm">
                      <span className="font-semibold">
                        {dashboardData?.stats.version_stats.timeline.reduce((sum, v) => sum + v.count, 0) || '0'}
                      </span> Versions created
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}