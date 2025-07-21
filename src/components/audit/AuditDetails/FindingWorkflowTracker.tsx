"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Button } from "../../ui/button.tsx"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog.tsx"
import { Textarea } from "../../ui/textarea.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select.tsx"
import { Label } from "../../ui/label.tsx"
import { CheckCircle, Clock, AlertTriangle, XCircle, ArrowRight, User, Calendar, Activity } from 'lucide-react'

interface WorkflowEntry {
  id: number
  from_status: string | null
  to_status: string
  changed_by: string
  change_reason: string
  changed_at: string
  workflow_data: any
}

interface FindingWorkflowTrackerProps {
  findingId: number
  currentStatus: string
  onStatusUpdate: () => void
}

export default function FindingWorkflowTracker({
  findingId,
  currentStatus,
  onStatusUpdate,
}: FindingWorkflowTrackerProps) {
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowEntry[]>([])
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [changeReason, setChangeReason] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchWorkflowHistory()
  }, [findingId])

  const fetchWorkflowHistory = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/findings/${findingId}/workflow-history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setWorkflowHistory(data.workflow_history)
      }
    } catch (error) {
      console.error("Error fetching workflow history:", error)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus || !changeReason.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/findings/${findingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status: newStatus,
          reason: changeReason,
        }),
      })

      if (response.ok) {
        setShowStatusDialog(false)
        setNewStatus("")
        setChangeReason("")
        fetchWorkflowHistory()
        onStatusUpdate()
      } else {
        const errorData = await response.json()
        alert(errorData.detail || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
      case "in_progress":
        return <Clock className="w-4 h-4 text-[#F97316]" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-[#059669]" />
      case "closed":
        return <XCircle className="w-4 h-4 text-[#64748B]" />
      default:
        return <Clock className="w-4 h-4 text-[#94A3B8]" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-50 text-[#DC2626] border-red-200 shadow-sm"
      case "in_progress":
        return "bg-orange-50 text-[#F97316] border-orange-200 shadow-sm"
      case "resolved":
        return "bg-emerald-50 text-[#059669] border-emerald-200 shadow-sm"
      case "closed":
        return "bg-slate-50 text-[#64748B] border-slate-200 shadow-sm"
      default:
        return "bg-gray-50 text-[#64748B] border-gray-200 shadow-sm"
    }
  }

  const getValidTransitions = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      open: ["in_progress", "resolved", "closed"],
      in_progress: ["open", "resolved", "closed"],
      resolved: ["closed", "open"],
      closed: [],
    }
    return transitions[currentStatus] || []
  }

  const validTransitions = getValidTransitions(currentStatus)

  return (
    <Card className="border-[#E2E8F0] shadow-lg bg-white">
      <CardHeader className="bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Activity className="w-6 h-6" />
            Workflow Status
          </CardTitle>
          {validTransitions.length > 0 && (
            <Button 
              size="sm" 
              onClick={() => setShowStatusDialog(true)} 
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white border-0 shadow-md transition-all duration-200 hover:shadow-lg"
            >
              Update Status
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-[#F8FAFC]">
        {/* Current Status */}
        <div className="mb-8 p-6 border border-[#E2E8F0] rounded-xl bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]">
              {getStatusIcon(currentStatus)}
            </div>
            <div>
              <Badge className={`${getStatusColor(currentStatus)} border px-4 py-2 text-sm font-semibold`}>
                {currentStatus.replace("_", " ").toUpperCase()}
              </Badge>
              <p className="text-[#64748B] mt-2 font-medium">Current Status</p>
            </div>
          </div>
        </div>

        {/* Workflow History */}
        <div className="space-y-6">
          <h4 className="font-bold text-[#1E293B] text-lg flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-[#003366]" />
            Status History
          </h4>

          {workflowHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
              <Activity className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
              <p className="text-[#64748B] text-lg">No workflow history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workflowHistory.map((entry, index) => (
                <div key={entry.id} className="flex items-start gap-4 p-5 border border-[#E2E8F0] rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:bg-[#F1F5F9]">
                  <div className="flex-shrink-0 mt-1 p-2 rounded-full bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]">
                    {getStatusIcon(entry.to_status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      {entry.from_status && (
                        <>
                          <Badge variant="outline" className="text-xs bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]">
                            {entry.from_status.replace("_", " ")}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-[#94A3B8]" />
                        </>
                      )}
                      <Badge className={`${getStatusColor(entry.to_status)} border text-xs font-semibold`}>
                        {entry.to_status.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="text-[#1E293B] mb-3 font-medium leading-relaxed">{entry.change_reason}</p>

                    <div className="flex items-center gap-6 text-xs text-[#64748B]">
                      <span className="flex items-center gap-2 bg-[#F8FAFC] px-3 py-1 rounded-full">
                        <User className="w-3 h-3" />
                        {entry.changed_by}
                      </span>
                      <span className="flex items-center gap-2 bg-[#F8FAFC] px-3 py-1 rounded-full">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.changed_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-2xl bg-white border-[#E2E8F0] shadow-2xl">
          <DialogHeader className="pb-6 border-b border-[#E2E8F0]">
            <DialogTitle className="text-2xl font-bold text-[#1E293B] flex items-center gap-3">
              <Activity className="w-6 h-6 text-[#003366]" />
              Update Finding Status
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label className="text-[#1E293B] font-semibold">Current Status</Label>
              <Badge className={`${getStatusColor(currentStatus)} border w-fit px-4 py-2 text-sm font-semibold`}>
                {currentStatus.replace("_", " ").toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-3">
              <Label htmlFor="new_status" className="text-[#1E293B] font-semibold">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white">
                  <SelectValue placeholder="Select new status..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E2E8F0] shadow-xl">
                  {validTransitions.map((status) => (
                    <SelectItem key={status} value={status} className="hover:bg-[#F1F5F9]">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status)}
                        <span className="font-medium">{status.replace("_", " ").toUpperCase()}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="change_reason" className="text-[#1E293B] font-semibold">Reason for Change</Label>
              <Textarea
                id="change_reason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Explain why you're changing the status..."
                className="min-h-[120px] border-[#E2E8F0] focus:border-[#003366] focus:ring-[#003366] bg-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-[#E2E8F0]">
              <Button 
                variant="outline" 
                onClick={() => setShowStatusDialog(false)}
                className="border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleStatusUpdate} 
                disabled={!newStatus || !changeReason.trim() || loading}
                className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white px-8 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {loading ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
