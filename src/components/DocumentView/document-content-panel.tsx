"use client"

import { useState, useEffect } from "react"
import { FileText, Edit2, Save, X, AlertTriangle, Code } from "lucide-react"
import axios from "axios"

interface DocumentContentPanelProps {
  documentId: string
  document: {
    id: number | string
    title: string
  }
}

export default function DocumentContentPanel({ documentId, document }: DocumentContentPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"parsed" | "raw">("parsed")
  const [documentContent, setDocumentContent] = useState<{
    content?: any
    raw_content?: string
  }>({})

  // Fetch document content when the component mounts or documentId changes
  useEffect(() => {
    const fetchDocumentContent = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/content-data`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setDocumentContent(response.data)
        setEditedContent(response.data.content || {})
        setLoading(false)
      } catch (err) {
        console.error("Error fetching document content:", err)
        setError("Failed to load document content")
        setLoading(false)
      }
    }

    fetchDocumentContent()
  }, [documentId])

  const handleSave = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      await axios.patch(
        `http://127.0.0.1:8000/documents/${documentId}/content`,
        { content: editedContent },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Update the local state with the new content
      setDocumentContent((prev) => ({
        ...prev,
        content: editedContent,
      }))

      setIsEditing(false)
      setError(null)
    } catch (err) {
      console.error("Error saving document content:", err)
      setError("Failed to save document content")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditedContent(documentContent.content || {})
    setIsEditing(false)
  }

  const renderValue = (key: string, value: any) => {
    if (Array.isArray(value)) {
      return (
        <ul className="space-y-2 ml-4">
          {value.map((item, index) => (
            <li key={index} className="text-dark-text">
              {typeof item === "object" && item !== null ? (
                <div className="bg-primary-bg/50 p-2 rounded-lg">
                  {Object.entries(item).map(([itemKey, itemValue]) => (
                    <div key={itemKey} className="mb-1">
                      <span className="text-slate-gray font-medium uppercase">{itemKey}:</span>{" "}
                      {renderValue(itemKey, itemValue)}
                    </div>
                  ))}
                </div>
              ) : (
                item
              )}
            </li>
          ))}
        </ul>
      )
    }

    // Format dates if they look like ISO strings
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      try {
        const date = new Date(value)
        return <span className="text-dark-text">{date.toLocaleString()}</span>
      } catch (e) {
        // If it's not a valid date, just render as string
        return <span className="text-dark-text">{value}</span>
      }
    }

    // For objects, directly display nested content
    if (typeof value === "object" && value !== null) {
      return (
        <div className="ml-4 pl-4 border-l-2 border-light-border">
          {Object.entries(value).map(([nestedKey, nestedValue]) => (
            <div key={nestedKey} className="py-2">
              <span className="text-slate-gray font-medium uppercase">{nestedKey}:</span>
              <div className="mt-1">{renderValue(nestedKey, nestedValue)}</div>
            </div>
          ))}
        </div>
      )
    }

    return <span className="text-dark-text">{String(value)}</span>
  }

  if (loading) {
    return (
      <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Document Content</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-blue mx-auto"></div>
          <p className="mt-4 text-slate-gray">Loading document content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Document Content</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start text-red-600">
            <AlertTriangle className="h-6 w-6 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Error loading document content</h4>
              <p className="text-red-600 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle empty content
  if (!editedContent || Object.keys(editedContent).length === 0) {
    return (
      <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Document Content</h3>
            <button
              onClick={() => {
                setEditedContent({})
                setIsEditing(true)
              }}
              className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-4 py-2 rounded-lg flex items-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Add Content
            </button>
          </div>
        </div>
        <div className="p-6 text-center text-slate-gray">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">No Content Available</p>
          <p>This document doesn't have any structured content stored in the database.</p>
        </div>
      </div>
    )
  }

  // Function to directly render array content
  const renderArrayContent = (arrayContent: any[]) => {
    if (arrayContent.length === 0) return null

    // For a single item in the array, display it directly
    if (arrayContent.length === 1 && typeof arrayContent[0] === "object") {
      return (
        <div className="grid gap-6">
          {Object.entries(arrayContent[0]).map(([key, value]) => (
            <div
              key={key}
              className="group bg-primary-bg rounded-lg p-4 transition-all duration-200 hover:bg-hover-state"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-slate-gray uppercase tracking-wide">
                    {key.toUpperCase()}
                  </span>
                </div>
                <div className="w-full">
                  <div className="text-dark-text font-medium">{String(value)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // For multiple items, render the list
    return (
      <div className="grid gap-6">
        {arrayContent.map((item, index) => (
          <div
            key={index}
            className="group bg-primary-bg rounded-lg p-4 transition-all duration-200 hover:bg-hover-state"
          >
            <h4 className="font-medium mb-4">Item {index + 1}</h4>
            {typeof item === "object" &&
              Object.entries(item).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <span className="text-sm font-medium text-slate-gray uppercase tracking-wide">
                    {key.toUpperCase()}:
                  </span>
                  <div className="ml-4 text-dark-text">{String(value)}</div>
                </div>
              ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
      <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Document Content</h3>
          <div className="flex gap-2">
            {/* Add view mode toggle */}
            <div className="flex items-center space-x-2 mr-4">
              <button
                onClick={() => setViewMode("parsed")}
                className={`px-3 py-1 rounded-md ${viewMode === "parsed" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                <FileText className="h-4 w-4 inline mr-1" />
                Parsed
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`px-3 py-1 rounded-md ${viewMode === "raw" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                <Code className="h-4 w-4 inline mr-1" />
                Raw
              </button>
            </div>

            {/* Keep existing edit/save buttons */}
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="bg-slate-gray/20 hover:bg-slate-gray/30 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[#059669] to-[#047857] text-white px-4 py-2 rounded-lg flex items-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-4 py-2 rounded-lg flex items-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Content
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {isEditing ? (
          <div className="bg-primary-bg rounded-lg p-4">
            <textarea
              value={typeof editedContent === "object" ? JSON.stringify(editedContent, null, 2) : editedContent}
              onChange={(e) => {
                try {
                  const newContent = JSON.parse(e.target.value)
                  setEditedContent(newContent)
                } catch (error) {
                  setEditedContent(e.target.value)
                }
              }}
              className="w-full h-96 px-4 py-2 rounded-lg border border-light-border bg-secondary-bg focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-200 font-mono text-sm"
              placeholder="Enter document content as JSON"
            />
            <p className="mt-2 text-xs text-slate-gray">
              Content should be valid JSON. Use the format {`{"key": "value"}`} for simple values or{" "}
              {`{"key": {"nestedKey": "value"}}`} for nested objects.
            </p>
          </div>
        ) : viewMode === "raw" ? (
          <div className="bg-primary-bg rounded-lg p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm text-dark-text">
              {documentContent.raw_content || "No raw content available"}
            </pre>
          </div>
        ) : (
          <>
            {/* Keep existing parsed content rendering */}
            {Array.isArray(editedContent) ? (
              renderArrayContent(editedContent)
            ) : (
              <div className="grid gap-6">
                {Object.entries(editedContent).map(([key, value]) => (
                  <div
                    key={key}
                    className="group bg-primary-bg rounded-lg p-4 transition-all duration-200 hover:bg-hover-state"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-gray uppercase tracking-wide">
                          {key.toUpperCase()}
                        </span>
                      </div>
                      <div className="w-full">
                        <div className="text-dark-text">{renderValue(key, value)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
