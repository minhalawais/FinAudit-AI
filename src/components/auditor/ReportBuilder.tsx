"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Download, Eye, Save, Plus, Trash2 } from "lucide-react"

interface ReportSection {
  id: string
  title: string
  content: string
  type: "text" | "findings" | "chart" | "table"
  order: number
  data?: any
}

interface AuditReport {
  id?: number
  audit_id: number
  title: string
  executive_summary: string
  sections: ReportSection[]
  status: "draft" | "review" | "final"
  created_at?: string
  updated_at?: string
}

const ReportBuilder: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>()
  const [report, setReport] = useState<AuditReport>({
    audit_id: Number.parseInt(auditId || "0"),
    title: "",
    executive_summary: "",
    sections: [],
    status: "draft",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [auditData, setAuditData] = useState<any>(null)

  useEffect(() => {
    if (auditId) {
      fetchAuditData()
      fetchExistingReport()
    }
  }, [auditId])

  const fetchAuditData = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/audits/${auditId}/details`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setAuditData(data.audit)
    } catch (error) {
      console.error("Error fetching audit data:", error)
    }
  }

  const fetchExistingReport = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/audits/${auditId}/report`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.report) {
          setReport(data.report)
        } else {
          // Initialize with default sections
          initializeDefaultReport()
        }
      } else {
        initializeDefaultReport()
      }
    } catch (error) {
      console.error("Error fetching report:", error)
      initializeDefaultReport()
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaultReport = () => {
    setReport((prev) => ({
      ...prev,
      title: auditData ? `${auditData.name} - Audit Report` : "Audit Report",
      sections: [
        {
          id: "1",
          title: "Executive Summary",
          content: "",
          type: "text",
          order: 1,
        },
        {
          id: "2",
          title: "Audit Scope and Objectives",
          content: auditData?.scope || "",
          type: "text",
          order: 2,
        },
        {
          id: "3",
          title: "Findings and Observations",
          content: "",
          type: "findings",
          order: 3,
        },
        {
          id: "4",
          title: "Recommendations",
          content: "",
          type: "text",
          order: 4,
        },
        {
          id: "5",
          title: "Conclusion",
          content: "",
          type: "text",
          order: 5,
        },
      ],
    }))
  }

  const saveReport = async () => {
    setSaving(true)
    try {
      const method = report.id ? "PUT" : "POST"
      const url = report.id ? `http://127.0.0.1:8000/api/audits/${auditId}/report/${report.id}` : `http://127.0.0.1:8000/api/audits/${auditId}/report`

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(report),
      })

      if (response.ok) {
        const data = await response.json()
        setReport(data.report)
        alert("Report saved successfully!")
      } else {
        alert("Failed to save report")
      }
    } catch (error) {
      alert("Error saving report")
    } finally {
      setSaving(false)
    }
  }

  const addSection = () => {
    const newSection: ReportSection = {
      id: Date.now().toString(),
      title: "New Section",
      content: "",
      type: "text",
      order: report.sections.length + 1,
    }

    setReport((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }))
  }

  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    setReport((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.id === sectionId ? { ...section, ...updates } : section)),
    }))
  }

  const deleteSection = (sectionId: string) => {
    if (confirm("Are you sure you want to delete this section?")) {
      setReport((prev) => ({
        ...prev,
        sections: prev.sections.filter((section) => section.id !== sectionId),
      }))
    }
  }

  const exportReport = async (format: "pdf" | "docx") => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/audits/${auditId}/report/export?format=${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(report),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${report.title}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      alert("Error exporting report")
    }
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
            <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Report Builder</h1>
            <p className="text-[#64748B]">Create comprehensive audit reports</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-white transition-colors"
            >
              <Eye className="w-4 h-4" />
              {previewMode ? "Edit" : "Preview"}
            </button>
            <button
              onClick={saveReport}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#059669] text-white rounded-lg hover:bg-[#047857] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004D99] transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <div className="absolute right-0 top-full mt-2 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-2 min-w-[120px] hidden group-hover:block">
                <button
                  onClick={() => exportReport("pdf")}
                  className="w-full text-left px-4 py-2 text-[#1E293B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => exportReport("docx")}
                  className="w-full text-left px-4 py-2 text-[#1E293B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Export as Word
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Report Structure Sidebar */}
        {!previewMode && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1E293B]">Report Structure</h3>
                <button
                  onClick={addSection}
                  className="p-2 text-[#003366] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {report.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-[#1E293B] text-sm">{section.title}</p>
                        <p className="text-xs text-[#64748B]">{section.type}</p>
                      </div>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="p-1 text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Report Content */}
        <div className={previewMode ? "lg:col-span-4" : "lg:col-span-3"}>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-8">
            {/* Report Header */}
            <div className="mb-8">
              {previewMode ? (
                <div>
                  <h1 className="text-3xl font-bold text-[#1E293B] mb-4">{report.title}</h1>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-[#64748B] mb-1">Audit Name:</p>
                      <p className="font-medium text-[#1E293B]">{auditData?.name}</p>
                    </div>
                    <div>
                      <p className="text-[#64748B] mb-1">Report Date:</p>
                      <p className="font-medium text-[#1E293B]">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[#64748B] mb-1">Audit Period:</p>
                      <p className="font-medium text-[#1E293B]">
                        {auditData?.start_date && auditData?.end_date
                          ? `${new Date(auditData.start_date).toLocaleDateString()} - ${new Date(auditData.end_date).toLocaleDateString()}`
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#64748B] mb-1">Status:</p>
                      <p className="font-medium text-[#1E293B]">{report.status.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-2">Report Title</label>
                    <input
                      type="text"
                      value={report.title}
                      onChange={(e) => setReport((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Enter report title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-2">Executive Summary</label>
                    <textarea
                      value={report.executive_summary}
                      onChange={(e) => setReport((prev) => ({ ...prev, executive_summary: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Provide a high-level summary of the audit findings and conclusions"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Report Sections */}
            <div className="space-y-8">
              {report.sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div key={section.id} className="border-t border-[#E2E8F0] pt-8">
                    {previewMode ? (
                      <div>
                        <h2 className="text-xl font-semibold text-[#1E293B] mb-4">{section.title}</h2>
                        {section.type === "text" && (
                          <div className="prose max-w-none">
                            <p className="text-[#64748B] whitespace-pre-wrap">{section.content}</p>
                          </div>
                        )}
                        {section.type === "findings" && (
                          <div className="space-y-4">
                            {auditData?.findings?.map((finding: any) => (
                              <div key={finding.id} className="border border-[#E2E8F0] rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-[#1E293B]">{finding.title}</h4>
                                  <span
                                    className={`px-2 py-1 text-xs rounded ${
                                      finding.severity === "critical"
                                        ? "bg-[#DC2626] text-white"
                                        : finding.severity === "major"
                                          ? "bg-[#F59E0B] text-white"
                                          : "bg-[#059669] text-white"
                                    }`}
                                  >
                                    {finding.severity.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[#64748B] text-sm">{finding.description}</p>
                                {finding.recommendation && (
                                  <div className="mt-2 p-2 bg-[#F8FAFC] rounded">
                                    <p className="text-sm">
                                      <strong>Recommendation:</strong> {finding.recommendation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            className="text-xl font-semibold text-[#1E293B] bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[#003366] rounded px-2 py-1"
                          />
                          <select
                            value={section.type}
                            onChange={(e) => updateSection(section.id, { type: e.target.value as any })}
                            className="px-3 py-1 border border-[#E2E8F0] rounded text-sm"
                          >
                            <option value="text">Text</option>
                            <option value="findings">Findings</option>
                            <option value="chart">Chart</option>
                            <option value="table">Table</option>
                          </select>
                        </div>

                        {section.type === "text" && (
                          <textarea
                            value={section.content}
                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                            rows={6}
                            className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                            placeholder="Enter section content..."
                          />
                        )}

                        {section.type === "findings" && (
                          <div className="p-4 bg-[#F8FAFC] rounded-lg">
                            <p className="text-sm text-[#64748B]">
                              This section will automatically include all findings from the audit.
                              {auditData?.findings?.length > 0
                                ? ` Currently ${auditData.findings.length} findings will be included.`
                                : " No findings have been created yet."}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportBuilder
