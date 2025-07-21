"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Star, Clock, CheckCircle, Users, Download } from "lucide-react"

interface AuditorPerformance {
  id: number
  name: string
  email: string
  total_audits: number
  completed_audits: number
  average_rating: number
  on_time_delivery: number
  quality_score: number
  cost_efficiency: number
  client_satisfaction: number
  specializations: string[]
  recent_audits: Array<{
    id: number
    name: string
    completion_date: string
    rating: number
    duration_days: number
  }>
  performance_trends: Array<{
    month: string
    rating: number
    efficiency: number
  }>
}

const AuditorPerformance: React.FC = () => {
  const [auditors, setAuditors] = useState<AuditorPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState("6months")
  const [sortBy, setSortBy] = useState("rating")
  const [selectedAuditor, setSelectedAuditor] = useState<AuditorPerformance | null>(null)

  useEffect(() => {
    fetchAuditorPerformance()
  }, [selectedTimeframe, sortBy])

  const fetchAuditorPerformance = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/auditors/performance?timeframe=${selectedTimeframe}&sort=${sortBy}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setAuditors(data.auditors || [])
    } catch (error) {
      console.error("Error fetching auditor performance:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 4.5) return "text-[#059669]"
    if (score >= 3.5) return "text-[#F59E0B]"
    return "text-[#DC2626]"
  }

  const getPerformanceBackground = (score: number) => {
    if (score >= 4.5) return "from-[#059669] to-[#047857]"
    if (score >= 3.5) return "from-[#F59E0B] to-[#D97706]"
    return "from-[#DC2626] to-[#B91C1C]"
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "text-[#F59E0B] fill-current" : "text-[#E2E8F0]"}`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Auditor Performance Analytics</h1>
            <p className="text-[#64748B]">Track and analyze auditor performance metrics</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            >
              <option value="rating">Sort by Rating</option>
              <option value="efficiency">Sort by Efficiency</option>
              <option value="audits">Sort by Audits Count</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">
              {auditors.length > 0
                ? (auditors.reduce((sum, a) => sum + a.average_rating, 0) / auditors.length).toFixed(1)
                : "0.0"}
            </span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium">Average Rating</h3>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#059669] to-[#047857] rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">
              {auditors.length > 0
                ? Math.round(auditors.reduce((sum, a) => sum + a.on_time_delivery, 0) / auditors.length)
                : 0}
              %
            </span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium">On-Time Delivery</h3>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">
              {auditors.length > 0
                ? (auditors.reduce((sum, a) => sum + a.quality_score, 0) / auditors.length).toFixed(1)
                : "0.0"}
            </span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium">Quality Score</h3>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{auditors.length}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium">Active Auditors</h3>
        </div>
      </div>

      {/* Auditor Performance List */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0]">
          <h3 className="text-lg font-semibold text-[#1E293B]">Individual Performance</h3>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {auditors.map((auditor) => (
            <div key={auditor.id} className="p-6 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#003366] to-[#004D99] rounded-full flex items-center justify-center text-white font-semibold">
                    {auditor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1E293B] mb-1">{auditor.name}</h4>
                    <p className="text-sm text-[#64748B] mb-2">{auditor.email}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[#64748B]">{auditor.completed_audits} audits completed</span>
                      <div className="flex items-center gap-1">
                        {renderStars(auditor.average_rating)}
                        <span className="text-[#64748B] ml-1">{auditor.average_rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <div className={`text-lg font-bold ${getPerformanceColor(auditor.on_time_delivery / 20)}`}>
                      {auditor.on_time_delivery}%
                    </div>
                    <div className="text-xs text-[#64748B]">On-Time</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${getPerformanceColor(auditor.quality_score)}`}>
                      {auditor.quality_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-[#64748B]">Quality</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${getPerformanceColor(auditor.cost_efficiency)}`}>
                      {auditor.cost_efficiency.toFixed(1)}
                    </div>
                    <div className="text-xs text-[#64748B]">Efficiency</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${getPerformanceColor(auditor.client_satisfaction)}`}>
                      {auditor.client_satisfaction.toFixed(1)}
                    </div>
                    <div className="text-xs text-[#64748B]">Satisfaction</div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAuditor(auditor)}
                  className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004D99] transition-colors"
                >
                  View Details
                </button>
              </div>

              {/* Specializations */}
              {auditor.specializations.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {auditor.specializations.map((spec, index) => (
                    <span key={index} className="px-2 py-1 bg-[#F59E0B] bg-opacity-10 text-[#F59E0B] text-xs rounded">
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Performance Modal */}
      {selectedAuditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1E293B]">Performance Details - {selectedAuditor.name}</h2>
              <button onClick={() => setSelectedAuditor(null)} className="text-[#64748B] hover:text-[#1E293B]">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Performance Metrics */}
              <div>
                <h3 className="font-semibold text-[#1E293B] mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <span className="text-[#64748B]">Average Rating</span>
                    <div className="flex items-center gap-2">
                      {renderStars(selectedAuditor.average_rating)}
                      <span className="font-medium">{selectedAuditor.average_rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <span className="text-[#64748B]">On-Time Delivery</span>
                    <span className="font-medium">{selectedAuditor.on_time_delivery}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <span className="text-[#64748B]">Quality Score</span>
                    <span className="font-medium">{selectedAuditor.quality_score.toFixed(1)}/10</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <span className="text-[#64748B]">Cost Efficiency</span>
                    <span className="font-medium">{selectedAuditor.cost_efficiency.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>

              {/* Recent Audits */}
              <div>
                <h3 className="font-semibold text-[#1E293B] mb-4">Recent Audits</h3>
                <div className="space-y-3">
                  {selectedAuditor.recent_audits.map((audit) => (
                    <div key={audit.id} className="border border-[#E2E8F0] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-[#1E293B]">{audit.name}</h4>
                        <div className="flex items-center gap-1">{renderStars(audit.rating)}</div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-[#64748B]">
                        <span>Completed: {new Date(audit.completion_date).toLocaleDateString()}</span>
                        <span>{audit.duration_days} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Trends */}
            <div className="mt-8">
              <h3 className="font-semibold text-[#1E293B] mb-4">Performance Trends</h3>
              <div className="h-48 flex items-end justify-between gap-2">
                {selectedAuditor.performance_trends.map((trend, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-[#F59E0B] to-[#D97706] rounded-t"
                        style={{ height: `${(trend.rating / 5) * 80}px` }}
                      ></div>
                      <div
                        className="w-full bg-gradient-to-t from-[#059669] to-[#047857] rounded-t"
                        style={{ height: `${(trend.efficiency / 10) * 80}px` }}
                      ></div>
                    </div>
                    <div className="text-xs text-[#64748B] mt-2 text-center">
                      <div>{trend.month}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#F59E0B] rounded"></div>
                  <span className="text-sm text-[#64748B]">Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#059669] rounded"></div>
                  <span className="text-sm text-[#64748B]">Efficiency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditorPerformance
