"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Progress } from "../../ui/progress.tsx"
import { useAxios } from "../../../hooks/useAxios.ts"
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp, Activity, Target } from "lucide-react"

interface ComplianceCheckpoint {
  id: number
  checkpoint_type: string
  status: "passed" | "failed" | "warning" | "pending_review"
  score: number
  details: any
  checked_at: string
  next_check_at: string | null
  requirement_id?: number
}

interface ComplianceCheckpointsProps {
  auditId: number
}

const ComplianceCheckpoints: React.FC<ComplianceCheckpointsProps> = ({ auditId }) => {
  const [checkpoints, setCheckpoints] = useState<ComplianceCheckpoint[]>([])
  const [loading, setLoading] = useState(true)
  const axios = useAxios()

  useEffect(() => {
    fetchCheckpoints()
  }, [auditId])

  const fetchCheckpoints = async () => {
    try {
      const response = await axios.get(`/api/audits/${auditId}/compliance-checkpoints`)
      setCheckpoints(response.data.checkpoints)
    } catch (error) {
      console.error("Error fetching compliance checkpoints:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "failed":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      case "warning":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
      case "pending_review":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-4 h-4" />
      case "failed":
        return <XCircle className="w-4 h-4" />
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      case "pending_review":
        return <Clock className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#059669]"
    if (score >= 60) return "text-[#F59E0B]"
    return "text-[#DC2626]"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#E2E8F0] border-t-[#8B5CF6]"></div>
          <p className="text-[#64748B] font-medium">Loading compliance checkpoints...</p>
        </div>
      </div>
    )
  }

  const summary = {
    total: checkpoints.length,
    passed: checkpoints.filter((cp) => cp.status === "passed").length,
    failed: checkpoints.filter((cp) => cp.status === "failed").length,
    warnings: checkpoints.filter((cp) => cp.status === "warning").length,
    pending: checkpoints.filter((cp) => cp.status === "pending_review").length,
  }

  const overallScore =
    checkpoints.length > 0 ? Math.round(checkpoints.reduce((sum, cp) => sum + cp.score, 0) / checkpoints.length) : 0

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl shadow-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent">
            Compliance Checkpoints
          </h2>
          <p className="text-[#64748B] mt-1">Monitor compliance status across all requirements</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="border-[#E2E8F0] shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#1E293B]">{summary.total}</div>
                <div className="text-sm font-medium text-[#64748B]">Checkpoints</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#059669]">{summary.passed}</div>
                <div className="text-sm font-medium text-[#64748B]">Passed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-xl shadow-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#DC2626]">{summary.failed}</div>
                <div className="text-sm font-medium text-[#64748B]">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#F59E0B]">{summary.warnings}</div>
                <div className="text-sm font-medium text-[#64748B]">Warnings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-[#F8FAFC]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}%</div>
                <div className="text-sm font-medium text-[#64748B]">Overall Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checkpoints List */}
      {checkpoints.length === 0 ? (
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-[#64748B]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No compliance checkpoints</h3>
            <p className="text-[#64748B]">Compliance checkpoints will appear here as they are created</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {checkpoints.map((checkpoint) => (
            <Card
              key={checkpoint.id}
              className="border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${getStatusColor(checkpoint.status).replace("text-", "bg-").replace("/10", "/20")}`}
                    >
                      {getStatusIcon(checkpoint.status)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-[#1E293B] mb-1">
                        {checkpoint.checkpoint_type.replace(/_/g, " ").toUpperCase()}
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(checkpoint.status)} border font-medium`}>
                          {checkpoint.status.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#64748B]">Score:</span>
                          <span className={`text-sm font-bold ${getScoreColor(checkpoint.score)}`}>
                            {checkpoint.score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Progress value={checkpoint.score} className="flex-1 mr-4 h-3 bg-[#E2E8F0]" />
                  <span className={`text-lg font-bold ${getScoreColor(checkpoint.score)}`}>{checkpoint.score}%</span>
                </div>

                {checkpoint.details && (
                  <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                    <h4 className="font-medium text-[#1E293B] mb-2">Details</h4>
                    <p className="text-sm text-[#64748B]">{checkpoint.details}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-[#94A3B8] pt-3 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Checked: {new Date(checkpoint.checked_at).toLocaleDateString()}</span>
                  </div>
                  {checkpoint.next_check_at && (
                    <div className="flex items-center gap-2">
                      <span>Next check: {new Date(checkpoint.next_check_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ComplianceCheckpoints
