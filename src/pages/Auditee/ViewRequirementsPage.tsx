'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.tsx'
import { Button } from '../../components/ui/button.tsx'
import { Badge } from '../../components/ui/badge.tsx'
import { Input } from '../../components/ui/input.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.tsx'
import { Alert, AlertDescription } from '../../components/ui/alert.tsx'
import { useAxios } from '../../hooks/useAxios.ts'
import { FileText, Calendar, AlertTriangle, CheckCircle, Clock, XCircle, Plus, Search, Filter, Download, Eye, Trash2, AlertCircle } from 'lucide-react'

interface Requirement {
  id: number
  document_type: string
  description: string
  deadline: string | null
  is_mandatory: boolean
  auto_escalate: boolean
  compliance_framework: string
  required_fields: Record<string, boolean>
  validation_rules: Record<string, any>
  created_by: string
  created_at: string
  submissions_count: number
  latest_status: string
  latest_submission_date: string | null
  ai_priority_score: number
  risk_level: string
  escalation_level: number
}

const ViewRequirementsPage: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>()
  const navigate = useNavigate()
  const { request, loading, error } = useAxios()

  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [filteredRequirements, setFilteredRequirements] = useState<Requirement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [frameworkFilter, setFrameworkFilter] = useState("all")

  useEffect(() => {
    if (auditId) {
      fetchRequirements()
    }
  }, [auditId])

  useEffect(() => {
    filterRequirements()
  }, [requirements, searchTerm, statusFilter, priorityFilter, frameworkFilter])

  const fetchRequirements = async () => {
    try {
      const response = await request({
        url: `/api/audits/${auditId}/requirements`,
        method: "GET",
      })
      setRequirements(response.data.requirements)
    } catch (err) {
      console.error("Error fetching requirements:", err)
    }
  }

  const filterRequirements = () => {
    let filtered = requirements

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.latest_status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      if (priorityFilter === "high") {
        filtered = filtered.filter((req) => req.ai_priority_score >= 7)
      } else if (priorityFilter === "medium") {
        filtered = filtered.filter((req) => req.ai_priority_score >= 5 && req.ai_priority_score < 7)
      } else if (priorityFilter === "low") {
        filtered = filtered.filter((req) => req.ai_priority_score < 5)
      }
    }

    // Framework filter
    if (frameworkFilter !== "all") {
      filtered = filtered.filter((req) => req.compliance_framework === frameworkFilter)
    }

    setFilteredRequirements(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      approved: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
      under_review: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Eye },
      needs_revision: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const getPriorityBadge = (score: number) => {
    if (score >= 8) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">CRITICAL</Badge>
    } else if (score >= 7) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">HIGH</Badge>
    } else if (score >= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">MEDIUM</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800 border-green-200">LOW</Badge>
    }
  }

  const getRiskBadge = (riskLevel: string) => {
    const riskConfig = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200",
    }

    return (
      <Badge className={`${riskConfig[riskLevel as keyof typeof riskConfig]} border`}>{riskLevel.toUpperCase()}</Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline"
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return <span className="text-red-600 font-semibold">Overdue by {Math.abs(diffDays)} days</span>
    } else if (diffDays <= 3) {
      return <span className="text-orange-600 font-semibold">Due in {diffDays} days</span>
    } else {
      return <span className="text-gray-600">Due {date.toLocaleDateString()}</span>
    }
  }

  const deleteRequirement = async (requirementId: number) => {
    //if (!confirm("Are you sure you want to delete this requirement?")) return

    try {
      await request({
        url: `/api/audits/requirements/${requirementId}`,
        method: "DELETE",
      })
      fetchRequirements()
    } catch (err) {
      console.error("Error deleting requirement:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-8xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Requirements</h1>
            <p className="text-gray-600 mt-1">Manage and track audit document requirements</p>
          </div>
          <Button
            onClick={() => navigate(`/audits/${auditId}/requirements/add`)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Requirement
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search requirements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-500"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="needs_revision">Needs Revision</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>

              <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                <SelectTrigger className="border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Filter by framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  <SelectItem value="SOX">SOX</SelectItem>
                  <SelectItem value="GAAP">GAAP</SelectItem>
                  <SelectItem value="IFRS">IFRS</SelectItem>
                  <SelectItem value="PCAOB">PCAOB</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="border-gray-200 hover:bg-gray-50 bg-transparent"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setPriorityFilter("all")
                  setFrameworkFilter("all")
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Requirements Grid */}
        <div className="grid gap-6">
          {filteredRequirements.map((requirement) => (
            <Card
              key={requirement.id}
              className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-xl text-gray-900">{requirement.document_type}</CardTitle>
                      {requirement.is_mandatory && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">MANDATORY</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{requirement.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/audits/${auditId}/requirements/${requirement.id}`)}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRequirement(requirement.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Status</div>
                    {getStatusBadge(requirement.latest_status)}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Priority</div>
                    {getPriorityBadge(requirement.ai_priority_score)}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Risk Level</div>
                    {getRiskBadge(requirement.risk_level)}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Framework</div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {requirement.compliance_framework}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">Deadline</div>
                      <div>{formatDate(requirement.deadline)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">Submissions</div>
                      <div>{requirement.submissions_count} submitted</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">Escalation</div>
                      <div>Level {requirement.escalation_level}</div>
                    </div>
                  </div>
                </div>

                {requirement.auto_escalate && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Auto-escalation enabled</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequirements.length === 0 && !loading && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requirements Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || frameworkFilter !== "all"
                  ? "No requirements match your current filters."
                  : "No document requirements have been created for this audit yet."}
              </p>
              <Button
                onClick={() => navigate(`/audits/${auditId}/requirements/add`)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Requirement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ViewRequirementsPage
