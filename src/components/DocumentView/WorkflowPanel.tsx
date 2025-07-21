"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CheckCircle, Circle, AlertCircle, ChevronRight, Loader2 } from "lucide-react"
import axios from "axios"

import { Button } from '../../components/ui/button.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog.tsx"
import { Textarea } from "../../components/ui/textarea.tsx"
import { toast } from "../../utils/toast.tsx"

interface WorkflowStep {
  id: number
  name: string
  status: "complete" | "current" | "upcoming"
}

interface WorkflowExecutionHistory {
  id: number
  step_number: number
  action: string
  performed_by: number
  performed_at: string
  notes: string
  status: string
}

interface DocumentWorkflow {
  id: number
  workflow_id: number
  current_step: number
  status: string
  started_at: string
  completed_at: string
  timeout_at: string
  execution_history: WorkflowExecutionHistory[]
}

interface WorkflowPanelProps {
  documentId: string
  document: {
    id: number
  }
}

const WorkflowPanel: React.FC<WorkflowPanelProps> = ({ documentId, document }) => {
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeWorkflow, setActiveWorkflow] = useState<DocumentWorkflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/workflows`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const workflows = response.data.workflows || []
        if (workflows.length > 0) {
          setActiveWorkflow(workflows[0])
        }
        setLoading(false)
      } catch (err) {
        console.error("Error fetching workflows:", err)
        setError("Failed to load document workflows")
        setLoading(false)
      }
    }

    fetchWorkflows()
  }, [documentId])

  // Define workflow steps based on current step in the active workflow
  const workflowSteps = [
    {
      id: 1,
      name: "Upload",
      status:
        activeWorkflow?.current_step > 1 ? "complete" : activeWorkflow?.current_step === 1 ? "current" : "upcoming",
    },
    {
      id: 2,
      name: "Review",
      status:
        activeWorkflow?.current_step > 2 ? "complete" : activeWorkflow?.current_step === 2 ? "current" : "upcoming",
    },
    {
      id: 3,
      name: "Approve",
      status:
        activeWorkflow?.current_step > 3 ? "complete" : activeWorkflow?.current_step === 3 ? "current" : "upcoming",
    },
    {
      id: 4,
      name: "Finalize",
      status:
        activeWorkflow?.current_step > 4 ? "complete" : activeWorkflow?.current_step === 4 ? "current" : "upcoming",
    },
  ]

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "complete":
        return {
          icon: <CheckCircle className="h-6 w-6 text-emerald-500" />,
          textColor: "text-emerald-600",
          bgColor: "bg-emerald-100",
          borderColor: "border-emerald-200",
        }
      case "current":
        return {
          icon: <Circle className="h-6 w-6 text-blue-500" />,
          textColor: "text-blue-600",
          bgColor: "bg-blue-100",
          borderColor: "border-blue-200",
        }
      default:
        return {
          icon: <Circle className="h-6 w-6 text-gray-400" />,
          textColor: "text-gray-500",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-200",
        }
    }
  }

  const openActionModal = (type: "approve" | "reject") => {
    setActionType(type)
    setNotes("")
    setIsActionModalOpen(true)
  }

  const handleWorkflowAction = async () => {
    if (!activeWorkflow || !actionType) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `http://127.0.0.1:8000/documents/${documentId}/workflow/action`,
        {
          workflow_id: activeWorkflow.id,
          action: actionType,
          notes: notes,
          step_number: activeWorkflow.current_step,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Update the local state with the new workflow data
      setActiveWorkflow(response.data.workflow)

      toast({
        title: "Success",
        description: `Workflow step ${actionType === "approve" ? "approved" : "rejected"} successfully`,
        variant: "default",
      })

      setIsActionModalOpen(false)
    } catch (error) {
      console.error("Error performing workflow action:", error)
      toast({
        title: "Error",
        description: "Failed to perform workflow action",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn transition-all duration-300">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5">
          <h3 className="text-xl font-semibold text-white">Document Workflow</h3>
        </div>
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="mt-4 text-gray-500">Loading workflow information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn transition-all duration-300">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5">
          <h3 className="text-xl font-semibold text-white">Document Workflow</h3>
        </div>
        <div className="p-8 text-center text-red-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!activeWorkflow) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn transition-all duration-300">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5">
          <h3 className="text-xl font-semibold text-white">Document Workflow</h3>
        </div>
        <div className="p-8 text-center">
          <div className="bg-amber-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-amber-500" />
          </div>
          <p className="text-lg font-medium text-gray-800">No active workflow found for this document</p>
          <p className="text-gray-500 mt-2">Create a new workflow to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn transition-all duration-300">
      <div className="bg-gradient-to-r from-navy-blue to-[#004D99] px-6 py-5">
        <h3 className="text-xl font-semibold text-white">Document Workflow</h3>
      </div>

      <div className="p-6">
        <div className="mb-6 p-5 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800 font-medium">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md mr-2">Status</span>
              {activeWorkflow.status.replace("_", " ").toUpperCase()}
            </p>
            {activeWorkflow.status === "in_progress" && (
              <span className="inline-flex h-3 w-3 rounded-full bg-blue-500 animate-pulse"></span>
            )}
          </div>
          {activeWorkflow.timeout_at && (
            <div className="flex items-center mt-3 text-sm text-blue-700">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md mr-2">Deadline</span>
              {new Date(activeWorkflow.timeout_at).toLocaleString()}
            </div>
          )}
        </div>

        <div className="relative">
          {/* Connector Line */}
          <div className="absolute top-8 left-8 h-[calc(100%-4rem)] w-1 rounded-full bg-gray-200" />

          {/* Steps */}
          <ul className="space-y-8">
            {workflowSteps.map((step, index) => {
              const { icon, textColor, bgColor, borderColor } = getStatusStyles(step.status)

              return (
                <li key={step.id} className="relative">
                  <div className="flex items-center">
                    {/* Status Icon */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${bgColor} ${borderColor} border-2 shadow-md transition-all duration-300`}
                    >
                      {icon}
                    </div>

                    {/* Step Content */}
                    <div className="ml-6 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-lg font-semibold ${textColor} flex items-center`}>
                            {step.name}
                            {step.status === "current" && <ChevronRight className="h-4 w-4 ml-1" />}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Step {index + 1} of {workflowSteps.length}
                          </p>
                        </div>

                        {step.status === "current" && activeWorkflow.status === "in_progress" && (
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => openActionModal("approve")}
                              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 rounded-lg px-4 py-2"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => openActionModal("reject")}
                              className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 rounded-lg px-4 py-2"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {activeWorkflow.execution_history && activeWorkflow.execution_history.length > 0 && (
          <div className="mt-10">
            <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Execution History</h4>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 shadow-sm">
              <ul className="space-y-4 divide-y divide-gray-200">
                {activeWorkflow.execution_history.map((history) => (
                  <li key={history.id} className="pt-4 first:pt-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{history.action}</span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {new Date(history.performed_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Step {history.step_number}</p>
                    {history.notes && (
                      <p className="text-sm mt-3 italic bg-white p-3 rounded border border-gray-200">
                        "{history.notes}"
                      </p>
                    )}
                    <span
                      className={`inline-flex items-center mt-3 px-3 py-1 text-xs font-medium rounded-full ${
                        history.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : history.status === "rejected"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {history.status.toUpperCase()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl shadow-xl bg-white overflow-hidden border-0">
          <div
            className={`absolute inset-x-0 top-0 h-1 ${actionType === "approve" ? "bg-emerald-500" : "bg-rose-500"}`}
          ></div>

          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold flex items-center">
              {actionType === "approve" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-emerald-500 mr-2" />
                  Approve Workflow Step
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-rose-500 mr-2" />
                  Reject Workflow Step
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any comments or notes about this action..."
              className="min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              {actionType === "approve"
                ? "Your approval will move this document to the next step in the workflow."
                : "Your rejection will return this document to the previous owner for revision."}
            </p>
          </div>

          <DialogFooter className="gap-3 sm:gap-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsActionModalOpen(false)}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWorkflowAction}
              disabled={isSubmitting}
              className={`px-5 font-medium ${
                actionType === "approve"
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                  : "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700"
              } text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-lg`}
            >
              {isSubmitting ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WorkflowPanel
