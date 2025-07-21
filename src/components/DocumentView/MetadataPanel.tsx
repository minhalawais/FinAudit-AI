"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Edit2, Save, X, ChevronDown, ChevronRight, Loader2, AlertTriangle } from "lucide-react"
import axios from "axios"

interface Metadata {
  [key: string]: string | object | any
}

interface MetadataPanelProps {
  documentId: string
  document: {
    id: string | number
    title: string
  }
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({ documentId, document }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedMetadata, setEditedMetadata] = useState<Metadata>({})
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/metadata`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setEditedMetadata(response.data.metadata || {})
        setLoading(false)
      } catch (err) {
        console.error("Error fetching metadata:", err)
        setError("Failed to load document metadata")
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [documentId])

  const handleSave = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      await axios.post(`http://127.0.0.1:8000/documents/${documentId}/metadata`, editedMetadata, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setIsEditing(false)
      setLoading(false)
    } catch (error) {
      console.error("Error saving metadata:", error)
      setError("Failed to save metadata")
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reload the metadata from the server to discard changes
    const fetchMetadata = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/metadata`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setEditedMetadata(response.data.metadata || {})
      } catch (err) {
        console.error("Error fetching metadata:", err)
      }
    }

    fetchMetadata()
    setIsEditing(false)
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const renderComplexValue = (key: string, value: any, depth = 0) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection(key)}
            className="flex items-center text-navy-blue hover:text-soft-gold transition-colors"
          >
            {expandedSections[key] ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            <span className="font-medium">View Details</span>
          </button>

          {expandedSections[key] && (
            <div className="ml-4 pl-4 border-l-2 border-light-border">
              {Object.entries(value).map(([nestedKey, nestedValue]) => (
                <div key={nestedKey} className="py-2">
                  <span className="text-slate-gray font-medium">{nestedKey}:</span>
                  <div className="mt-1">{renderValue(nestedKey, nestedValue, depth + 1)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    return renderValue(key, value, depth)
  }

  const renderValue = (key: string, value: any, depth = 0) => {
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
                      {renderValue(itemKey, itemValue, depth + 1)}
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
            <h3 className="text-lg font-semibold text-white">Document Metadata</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-navy-blue" />
          <p className="mt-4 text-slate-gray">Loading metadata...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Document Metadata</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start text-red-600">
            <AlertTriangle className="h-6 w-6 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Error loading metadata</h4>
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

  // Handle empty metadata
  if (!editedMetadata || Object.keys(editedMetadata).length === 0) {
    return (
      <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Document Metadata</h3>
            <button
              onClick={() => {
                setEditedMetadata({})
                setIsEditing(true)
              }}
              className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-4 py-2 rounded-lg flex items-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Add Metadata
            </button>
          </div>
        </div>
        <div className="p-6 text-center text-slate-gray">No metadata available for this document.</div>
      </div>
    )
  }

  return (
    <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
      <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Document Metadata</h3>
          <div className="flex gap-2">
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
                Edit Metadata
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6">
          {Object.entries(editedMetadata).map(([key, value]) => (
            <div
              key={key}
              className="group bg-primary-bg rounded-lg p-4 transition-all duration-200 hover:bg-hover-state"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center">
                  <label htmlFor={key} className="text-sm font-medium text-slate-gray uppercase tracking-wide">
                    {key}
                  </label>
                </div>
                <div className="w-full">
                  {isEditing ? (
                    <textarea
                      id={key}
                      value={typeof value === "object" ? JSON.stringify(value, null, 2) : value}
                      onChange={(e) => {
                        try {
                          const newValue = typeof value === "object" ? JSON.parse(e.target.value) : e.target.value
                          setEditedMetadata({
                            ...editedMetadata,
                            [key]: newValue,
                          })
                        } catch (error) {
                          // Handle invalid JSON input
                          setEditedMetadata({
                            ...editedMetadata,
                            [key]: e.target.value,
                          })
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-light-border bg-secondary-bg focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-200 font-mono text-sm"
                      rows={typeof value === "object" ? 4 : 1}
                    />
                  ) : (
                    <div className="text-dark-text">{renderComplexValue(key, value)}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MetadataPanel
