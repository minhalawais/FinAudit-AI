"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import DocumentPreview from "../../components/DocumentView/DocumentPreview.tsx"
import MetadataPanel from "../../components/DocumentView/MetadataPanel.tsx"
import AIAnalysisPanel from "../../components/DocumentView/AiAnalysisPanel.tsx"
import AnnotationPanel from "../../components/DocumentView/AnnotationPanel.tsx"
import VersionControlPanel from "../../components/DocumentView/VersionControlPanel.tsx"
import RelatedDocumentsPanel from "../../components/DocumentView/RelatedDocumentsPanel.tsx"
import WorkflowPanel from "../../components/DocumentView/WorkflowPanel.tsx"
import ActivityLogPanel from "../../components/DocumentView/ActivityLogPanel.tsx"
import DocumentContentPanel from "../../components/DocumentView/document-content-panel.tsx"
import DocumentActions from "../../components/DocumentView/DocumentActions.tsx"
import axios from "axios"

interface DocumentViewProps {
  documentId: string
  onClose: () => void
}

const DocumentView: React.FC<DocumentViewProps> = ({ documentId, onClose }) => {
  const [documentBasic, setDocumentBasic] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("preview")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch only basic document information on initial load
  const fetchDocumentBasic = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/basic`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setDocumentBasic(response.data)
      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching document:", err)
      setError("Failed to fetch document")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocumentBasic()
  }, [documentId])

  const tabs = [
    { id: "preview", label: "Preview" },
    { id: "content", label: "Content" },
    { id: "metadata", label: "Metadata" },
    { id: "ai-analysis", label: "AI Analysis" },
    { id: "annotations", label: "Annotations" },
    { id: "versions", label: "Versions" },
    { id: "related", label: "Related Docs" },
    { id: "workflow", label: "Workflow" },
    { id: "activity", label: "Activity Log" },
  ]

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <p className="text-lg font-semibold">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <p className="text-lg font-semibold text-red-600">Error: {error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  if (!documentBasic) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-8xl mx-auto rounded-lg shadow-xl overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-800 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{documentBasic.title}</h1>
            <p className="mt-1 text-sm">
              {documentBasic.file_type} - {documentBasic.file_size}
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {activeTab === "preview" && <DocumentPreview documentId={documentId} document={documentBasic} />}
          {activeTab === "content" && <DocumentContentPanel documentId={documentId} document={documentBasic} />}
          {activeTab === "metadata" && <MetadataPanel documentId={documentId} document={documentBasic} />}
          {activeTab === "ai-analysis" && <AIAnalysisPanel documentId={documentId} document={documentBasic} />}
          {activeTab === "annotations" && <AnnotationPanel documentId={documentId} document={documentBasic} />}
          {activeTab === "versions" && <VersionControlPanel documentId={documentId} document={documentBasic} />}
          {activeTab === "related" && <RelatedDocumentsPanel documentId={documentId} document={documentBasic} />}
          {activeTab === "workflow" && <WorkflowPanel documentId={documentId} document={documentBasic} />}
          {activeTab === "activity" && <ActivityLogPanel documentId={documentId} document={documentBasic} />}
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <DocumentActions documentId={documentId} document={documentBasic} />
        </div>
      </div>
    </div>
  )
}

export default DocumentView
