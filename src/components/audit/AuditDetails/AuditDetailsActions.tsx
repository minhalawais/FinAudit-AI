"use client"

import type React from "react"
import { Button } from "../../ui/button.tsx"
import { Play, Pause, Edit, Eye, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAxios } from "../../../hooks/useAxios.ts"

interface AuditDetailsActionsProps {
  auditId: number
  auditStatus: string
  auditApprovalStatus: string
  onStartAudit?: () => void
  onPauseAudit?: () => void
  onViewRequirements?: () => void
  onAddRequirement?: () => void
}

const AuditDetailsActions: React.FC<AuditDetailsActionsProps> = ({
  auditId,
  auditStatus,
  auditApprovalStatus,
  onStartAudit,
  onPauseAudit,
  onViewRequirements,
  onAddRequirement,
}) => {
  const navigate = useNavigate()
  const axios = useAxios()

  const handleStartAudit = async () => {
    try {
      const response = await axios.post(`/api/audits/${auditId}/start`)
      onStartAudit?.()
      alert("Audit started successfully!")
    } catch (error: any) {
      console.error("Error starting audit:", error)
      const errorMessage = error.response?.data?.detail || "Failed to start audit"
      alert(errorMessage)
    }
  }

  const handlePauseAudit = async () => {
    try {
      const response = await axios.post(`/api/audits/${auditId}/pause`)
      onPauseAudit?.()
      alert("Audit paused successfully!")
    } catch (error: any) {
      console.error("Error pausing audit:", error)
      const errorMessage = error.response?.data?.detail || "Failed to pause audit"
      alert(errorMessage)
    }
  }

  const handleEditAudit = () => {
    navigate(`/audits/${auditId}/edit`)
  }

  const handleViewRequirements = () => {
    navigate(`/audits/${auditId}/requirements`)
    onViewRequirements?.()
  }

  const handleAddRequirement = () => {
    navigate(`/audits/${auditId}/requirements/new`)
    onAddRequirement?.()
  }

  return (
    <div className="flex items-center gap-3">
      {auditStatus === "planned" && auditApprovalStatus === "approved" && (
        <Button
          className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={handleStartAudit}
        >
          <Play className="mr-2 h-4 w-4" />
          Start Audit
        </Button>
      )}
      {auditStatus === "in_progress" && (
        <Button
          variant="outline"
          onClick={handlePauseAudit}
          className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#F97316]/30 hover:text-[#F97316] transition-all duration-200 bg-transparent"
        >
          <Pause className="mr-2 h-4 w-4" />
          Pause Audit
        </Button>
      )}
      <Button
        variant="outline"
        onClick={handleEditAudit}
        className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/30 hover:text-[#003366] transition-all duration-200 bg-transparent"
      >
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </Button>
      <Button
        variant="outline"
        onClick={handleViewRequirements}
        className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/30 hover:text-[#003366] transition-all duration-200 bg-transparent"
      >
        <Eye className="mr-2 h-4 w-4" />
        View Requirements
      </Button>
      <Button
        variant="outline"
        onClick={handleAddRequirement}
        className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#F59E0B]/30 hover:text-[#F59E0B] transition-all duration-200 bg-transparent"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Requirement
      </Button>
    </div>
  )
}

export default AuditDetailsActions
