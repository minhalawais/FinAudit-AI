"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card.tsx"
import { Progress } from "../../ui/progress.tsx"
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Zap, Shield, BarChart3 } from "lucide-react"
import { useAxios } from "../../../hooks/useAxios.ts"

interface AIInsightsProps {
  auditId: number
}

const AIInsights: React.FC<AIInsightsProps> = ({ auditId }) => {
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const axios = useAxios()

  useEffect(() => {
    fetchAIInsights()
  }, [auditId])

  const fetchAIInsights = async () => {
    try {
      const response = await axios.get(`/api/audits/${auditId}/ai-insights`)
      setInsights(response.data)
    } catch (error: any) {
      console.error("Error fetching AI insights:", error)
      const errorMessage = error.response?.data?.detail || "Failed to fetch AI insights"
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#E2E8F0] border-t-[#8B5CF6]"></div>
          <p className="text-[#64748B] font-medium">Loading AI insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent">
            AI Insights & Analytics
          </h2>
          <p className="text-[#64748B] mt-1">Advanced AI-powered audit analysis and recommendations</p>
        </div>
      </div>

      {/* Enhanced Risk Assessment */}
      <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[#1E293B]">
            <div className="p-2 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#F97316]/5 to-[#EA580C]/5 rounded-xl border border-[#F97316]/10">
                <span className="font-semibold text-[#1E293B]">Overall Risk Score</span>
                <div className="flex items-center gap-3">
                  <Progress value={(insights?.ai_risk_score || 5) * 10} className="w-24 h-3 bg-[#E2E8F0]" />
                  <span className="text-xl font-bold text-[#F97316]">{insights?.ai_risk_score || 5.0}/10</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#8B5CF6]/5 to-[#7C3AED]/5 rounded-xl border border-[#8B5CF6]/10">
                <span className="font-semibold text-[#1E293B]">AI Confidence</span>
                <div className="flex items-center gap-3">
                  <Progress value={(insights?.ai_confidence_score || 0.8) * 100} className="w-24 h-3 bg-[#E2E8F0]" />
                  <span className="text-xl font-bold text-[#8B5CF6]">
                    {((insights?.ai_confidence_score || 0.8) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
              <h4 className="font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#3B82F6]" />
                Risk Factors
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Complexity Level:</span>
                  <span className="font-medium text-[#1E293B]">High</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Industry Risk:</span>
                  <span className="font-medium text-[#1E293B]">Medium</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Regulatory Impact:</span>
                  <span className="font-medium text-[#1E293B]">High</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Key Recommendations */}
      <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[#1E293B]">
            <div className="p-2 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-lg">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights?.ai_suggestions?.key_recommendations?.map((rec: string, index: number) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#F59E0B]/5 to-[#D97706]/5 rounded-xl border border-[#F59E0B]/10 hover:shadow-sm transition-all duration-200"
              >
                <div className="p-2 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-lg mt-0.5 shadow-sm">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#1E293B] leading-relaxed">{rec}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-[#64748B] bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0]">
                      Priority: High
                    </span>
                    <span className="text-xs text-[#64748B] bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0]">
                      Impact: Medium
                    </span>
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-[#64748B]" />
                </div>
                <p className="text-[#64748B] font-medium">No AI recommendations available</p>
                <p className="text-sm text-[#94A3B8] mt-1">Recommendations will appear as the audit progresses</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Performance Analytics */}
      <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[#1E293B]">
            <div className="p-2 bg-gradient-to-br from-[#059669] to-[#047857] rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-[#059669]/5 to-[#047857]/5 rounded-xl border border-[#059669]/10">
              <div className="p-3 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#059669] mb-2">
                {insights?.performance_metrics?.document_quality || 85}%
              </div>
              <div className="text-sm font-medium text-[#1E293B] mb-2">Document Quality</div>
              <Progress value={insights?.performance_metrics?.document_quality || 85} className="h-2 bg-[#E2E8F0]" />
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-[#3B82F6]/5 to-[#1D4ED8]/5 rounded-xl border border-[#3B82F6]/10">
              <div className="p-3 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#3B82F6] mb-2">
                {insights?.performance_metrics?.compliance_score || 92}%
              </div>
              <div className="text-sm font-medium text-[#1E293B] mb-2">Compliance Score</div>
              <Progress value={insights?.performance_metrics?.compliance_score || 92} className="h-2 bg-[#E2E8F0]" />
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-[#8B5CF6]/5 to-[#7C3AED]/5 rounded-xl border border-[#8B5CF6]/10">
              <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#8B5CF6] mb-2">
                {insights?.performance_metrics?.efficiency_score || 78}%
              </div>
              <div className="text-sm font-medium text-[#1E293B] mb-2">Efficiency Score</div>
              <Progress value={insights?.performance_metrics?.efficiency_score || 78} className="h-2 bg-[#E2E8F0]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Historical Insights */}
      {insights?.historical_insights && (
        <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#1E293B]">
              <div className="p-2 bg-gradient-to-br from-[#64748B] to-[#475569] rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              Historical Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
              <p className="text-sm text-[#64748B] leading-relaxed">{insights.historical_insights}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AIInsights
