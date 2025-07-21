"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card.tsx"
import { Button } from "../ui/button.tsx"
import { Badge } from "../ui/badge.tsx"
import { Alert, AlertDescription } from "../ui/alert.tsx"
import { Bot, RefreshCw, Eye, CheckCircle, AlertTriangle, FileText, TrendingUp, Brain, Zap } from "lucide-react"

interface AIFinding {
  id: number
  finding_id: string
  title: string
  description: string
  finding_type: string
  severity: "critical" | "major" | "minor" | "informational"
  status: string
  ai_confidence_score: number
  ai_risk_score: number
  ai_recommendations: string[]
  created_at: string
  document_reference: {
    submission_id: number
    document_title: string
    requirement_type: string
  } | null
  evidence: any
  impact_assessment: string
}

interface AIFindingsPanelProps {
  auditId: number
  documentSubmissionId?: number
  onFindingSelect?: (finding: AIFinding) => void
}

export default function AIFindingsPanel({ auditId, documentSubmissionId, onFindingSelect }: AIFindingsPanelProps) {
  const [aiFindings, setAiFindings] = useState<AIFinding[]>([])
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAIFindings()
  }, [auditId, documentSubmissionId])

  const loadAIFindings = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (documentSubmissionId) {
        params.append("document_submission_id", documentSubmissionId.toString())
      }

      const response = await fetch(`http://127.0.0.1:8000/api/audits/${auditId}/ai-findings?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAiFindings(data.ai_findings || [])
      } else {
        throw new Error("Failed to load AI findings")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const regenerateFindings = async () => {
    if (!documentSubmissionId) return

    try {
      setRegenerating(true)
      setError(null)

      const response = await fetch(
        `http://127.0.0.1:8000/api/audits/${auditId}/regenerate-ai-findings/${documentSubmissionId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      if (response.ok) {
        // Wait a moment then reload findings
        setTimeout(() => {
          loadAIFindings()
        }, 2000)
      } else {
        throw new Error("Failed to regenerate AI findings")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setRegenerating(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white"
      case "major":
        return "bg-orange-500 text-white"
      case "minor":
        return "bg-yellow-500 text-white"
      case "informational":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-gray-600 ml-3">Loading AI findings...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            AI-Generated Findings
            {aiFindings.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {aiFindings.length} found
              </Badge>
            )}
          </CardTitle>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAIFindings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {documentSubmissionId && (
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateFindings}
                disabled={regenerating}
                className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-purple-200"
              >
                <Zap className={`h-4 w-4 mr-1 ${regenerating ? "animate-pulse" : ""}`} />
                {regenerating ? "Regenerating..." : "Regenerate"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {aiFindings.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Findings</h3>
            <p className="text-gray-600 mb-4">
              {documentSubmissionId
                ? "No AI findings generated for this document yet."
                : "No AI findings have been generated for this audit yet."}
            </p>
            {documentSubmissionId && (
              <Button
                onClick={regenerateFindings}
                disabled={regenerating}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
              >
                <Bot className="h-4 w-4 mr-2" />
                Generate AI Findings
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {aiFindings.map((finding) => (
              <div
                key={finding.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-purple-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{finding.title}</h4>
                      <Badge className={getSeverityColor(finding.severity)}>{finding.severity}</Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        <Bot className="h-3 w-3 mr-1" />
                        AI Generated
                      </Badge>
                    </div>

                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">{finding.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>ID: {finding.finding_id}</span>
                      <span>Type: {finding.finding_type.replace("_", " ")}</span>
                      <span>Created: {new Date(finding.created_at).toLocaleDateString()}</span>
                    </div>

                    {finding.document_reference && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
                        <FileText className="h-4 w-4" />
                        <span>
                          From: {finding.document_reference.document_title}(
                          {finding.document_reference.requirement_type})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Confidence</span>
                      </div>
                      <div className={`text-lg font-bold ${getConfidenceColor(finding.ai_confidence_score)}`}>
                        {(finding.ai_confidence_score * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">Risk</span>
                      </div>
                      <div className="text-lg font-bold text-orange-600">{finding.ai_risk_score}/10</div>
                    </div>
                  </div>
                </div>

                {finding.ai_recommendations && finding.ai_recommendations.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      AI Recommendations:
                    </h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {finding.ai_recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {finding.impact_assessment && (
                  <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h5 className="text-sm font-semibold text-yellow-900 mb-1">Impact Assessment:</h5>
                    <p className="text-sm text-yellow-800">{finding.impact_assessment}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onFindingSelect?.(finding)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
