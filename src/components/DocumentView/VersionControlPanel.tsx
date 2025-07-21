"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  GitBranch,
  ArrowLeft,
  ArrowRight,
  Clock,
  GitCommit,
  Upload,
  Plus,
  X,
  Calendar,
  FileText,
  Shield,
  Download,
  Eye,
  History,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import axios from "axios"
import { Button } from "../../components/ui/button.tsx"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog.tsx"
import { Textarea } from "../../components/ui/textarea.tsx"
import { toast } from "../../utils/toast.tsx"
import { Badge } from "../../components/ui/badge.tsx"

interface DocumentVersion {
  id: number
  version_number: number
  content: string
  file_path?: string
  created_at: string
}

interface VersionControlPanelProps {
  documentId: string
  document: {
    id: number
  }
}

const VersionControlPanel: React.FC<VersionControlPanelProps> = ({ documentId, document }) => {
  const [currentVersion, setCurrentVersion] = useState<DocumentVersion | null>(null)
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false)
  const [newVersionNotes, setNewVersionNotes] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"changes" | "versions">("changes")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/versions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const fetchedVersions = response.data.versions || []
        setVersions(fetchedVersions)
        if (fetchedVersions.length > 0) {
          setCurrentVersion(fetchedVersions[0])
        }
        setLoading(false)
      } catch (err) {
        console.error("Error fetching versions:", err)
        setError("Failed to load document versions")
        setLoading(false)
      }
    }

    fetchVersions()
  }, [documentId])

  const navigateVersion = (direction: "prev" | "next") => {
    if (!currentVersion) return
    const currentIndex = versions.findIndex((v) => v.id === currentVersion.id)
    if (direction === "prev" && currentIndex > 0) {
      setCurrentVersion(versions[currentIndex - 1])
    } else if (direction === "next" && currentIndex < versions.length - 1) {
      setCurrentVersion(versions[currentIndex + 1])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsNewVersionModalOpen(true)
  }

  const handleCreateNewVersion = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile && !newVersionNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide either a file or notes for the new version",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      let response

      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)
        formData.append("notes", newVersionNotes)

        response = await axios.post(`http://127.0.0.1:8000/documents/${documentId}/versions/file`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
      } else {
        response = await axios.post(
          `http://127.0.0.1:8000/documents/${documentId}/versions`,
          { content: newVersionNotes },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        )
      }

      if (response?.data?.version) {
        const newVersion = response.data.version
        const updatedVersions = [newVersion, ...versions]
        setVersions(updatedVersions)
        setCurrentVersion(newVersion)

        toast({
          title: "Success",
          description: "New version created successfully",
          variant: "default",
        })

        setNewVersionNotes("")
        setSelectedFile(null)
        setIsNewVersionModalOpen(false)
      }
    } catch (error) {
      console.error("Error creating new version:", error)
      toast({
        title: "Error",
        description: "Failed to create new version",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewVersion = async (version: DocumentVersion) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please log in again.",
          variant: "destructive",
        })
        return
      }

      // Create a URL for viewing the version content
      const url = `http://127.0.0.1:8000/documents/${documentId}/versions/${version.id}/content`

      // Fetch the content with the token in the headers
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch version content")
      }

      // Open the content in a new tab
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, "_blank")
    } catch (error) {
      console.error("Error viewing version:", error)
      toast({
        title: "Error",
        description: "Failed to view version",
        variant: "destructive",
      })
    }
  }

  const handleDownloadVersion = async (version: DocumentVersion) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please log in again.",
          variant: "destructive",
        })
        return
      }

      // Create a URL for downloading the version content
      const url = `http://127.0.0.1:8000/documents/${documentId}/versions/${version.id}/download`

      // Fetch the file with the token in the headers
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch version file")
      }

      // Extract content type to determine extension
      const contentType = response.headers.get("Content-Type")

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `${documentId}_v${version.version_number}`

      if (contentDisposition) {
        // Extract filename from Content-Disposition header
        const filenameMatch = contentDisposition.match(/filename=["']?([^"']+)["']?/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].trim()
        }
      }

      // Ensure filename has extension
      if (!filename.includes(".") && contentType && contentType !== "application/octet-stream") {
        // Try to get extension from content type
        const ext = contentType.split("/")[1]
        if (ext) {
          filename = `${filename}.${ext}`
        }
      }

      // Create blob from response
      const blob = await response.blob()

      // Create a blob with the correct content type
      const fileBlob = new Blob([blob], { type: contentType || "application/octet-stream" })

      // Create download link
      const blobUrl = window.URL.createObjectURL(fileBlob)
      const a = window.document.createElement("a")
      a.href = blobUrl
      a.download = filename
      window.document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(blobUrl)
      window.document.body.removeChild(a)

      toast({
        title: "Success",
        description: "File downloaded successfully",
        variant: "default",
      })
    } catch (error) {
      console.error("Error downloading version:", error)
      toast({
        title: "Error",
        description: "Failed to download version",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn transition-all duration-300 border border-[#E2E8F0]">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-5">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Version History
          </h3>
        </div>
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#003366]" />
          <p className="mt-4 text-[#64748B]">Loading version history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn transition-all duration-300 border border-[#E2E8F0]">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-5">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Version History
          </h3>
        </div>
        <div className="p-8 text-center text-red-500">
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

  if (!versions || versions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn transition-all duration-300 border border-[#E2E8F0]">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-5">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Version History
          </h3>
        </div>
        <div className="p-8 text-center bg-[#F8FAFC]">
          <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-[#E2E8F0] shadow-md">
            <GitBranch className="h-10 w-10 text-[#003366]" />
          </div>
          <p className="mb-6 text-[#1E293B] text-lg font-medium">No versions available for this document.</p>
          <p className="mb-8 text-[#64748B]">Create your first version to start tracking changes to this document.</p>
          <Button
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-8 py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 font-medium flex items-center justify-center mx-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create First Version
          </Button>
        </div>

        <Dialog open={isNewVersionModalOpen} onOpenChange={setIsNewVersionModalOpen}>
          <DialogContent
            className="sm:max-w-md rounded-xl overflow-hidden shadow-xl border border-[#E2E8F0]"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706]"></div>
            <DialogHeader className="pb-4 border-b border-[#E2E8F0]">
              <DialogTitle className="text-xl font-semibold flex items-center text-[#1E293B]">
                <GitCommit className="h-5 w-5 mr-2 text-[#003366]" />
                Create First Document Version
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateNewVersion}>
              <div className="py-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1E293B]">Upload File</label>
                  <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 text-center bg-[#F8FAFC] hover:bg-white hover:border-[#94A3B8] transition-colors duration-200 relative">
                    {selectedFile ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <FileText className="h-5 w-5 text-[#003366] flex-shrink-0" />
                          <span className="text-sm truncate max-w-[80%] text-[#1E293B]">{selectedFile.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="flex-shrink-0 p-1 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#DC2626] hover:text-white transition-colors duration-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-[#E2E8F0] shadow-sm">
                          <Upload className="h-7 w-7 text-[#64748B]" />
                        </div>
                        <p className="text-sm text-[#64748B]">Drag and drop your file here or</p>
                        <p className="mt-2">
                          <span className="text-sm px-4 py-1.5 bg-[#F1F5F9] text-[#003366] rounded-full font-medium hover:bg-[#E2E8F0] cursor-pointer transition-colors duration-200 inline-block">
                            Browse Files
                          </span>
                        </p>
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileChange}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1E293B]">Version Notes</label>
                  <Textarea
                    value={newVersionNotes}
                    onChange={(e) => setNewVersionNotes(e.target.value)}
                    placeholder="Describe what changed in this version..."
                    className="min-h-[120px] p-3 bg-white border border-[#E2E8F0] focus:border-[#003366] focus:ring focus:ring-[#003366]/20 rounded-lg shadow-sm text-[#1E293B]"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4 border-t border-[#E2E8F0] gap-3 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewVersionModalOpen(false)}
                  className="border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#64748B] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#002855] hover:to-[#004080] text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg px-6"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    <span>Create Version</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Version Navigation Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#E2E8F0]">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-5">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <History className="mr-2 h-5 w-5" />
            Version History
          </h3>
        </div>

        <div className="p-6 bg-[#F8FAFC]">
          {/* Timeline indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="h-2 bg-[#E2E8F0] rounded-full w-full max-w-md relative">
              {versions.map((version, index) => {
                const position = `${Math.max(0, Math.min(100, (index / (versions.length - 1)) * 100))}%`
                const isActive = currentVersion?.id === version.id
                return (
                  <div
                    key={version.id}
                    className={`absolute w-4 h-4 rounded-full transform -translate-y-1/2 transition-all duration-300 cursor-pointer ${
                      isActive ? "bg-[#F59E0B] scale-125 shadow-md" : "bg-[#94A3B8] hover:bg-[#64748B]"
                    }`}
                    style={{ left: position }}
                    onClick={() => setCurrentVersion(version)}
                    title={`Version ${version.version_number}`}
                  />
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateVersion("prev")}
              disabled={!currentVersion || currentVersion.id === versions[versions.length - 1].id}
              className="p-3 rounded-full bg-white text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#003366] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm border border-[#E2E8F0]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="text-center px-6 py-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="flex items-center justify-center space-x-2">
                <GitCommit className="h-5 w-5 text-[#003366]" />
                <span className="text-xl font-semibold text-[#1E293B]">Version {currentVersion?.version_number}</span>
              </div>
              <div className="flex items-center justify-center mt-2 text-[#64748B]">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {currentVersion &&
                    new Date(currentVersion.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                </span>
                <span className="mx-2 text-[#94A3B8]">•</span>
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {currentVersion && new Date(currentVersion.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigateVersion("next")}
              disabled={!currentVersion || currentVersion.id === versions[0].id}
              className="p-3 rounded-full bg-white text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#003366] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm border border-[#E2E8F0]"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#E2E8F0]">
        <div className="border-b border-[#E2E8F0]">
          <div className="flex">
            <button
              onClick={() => setActiveTab("changes")}
              className={`px-6 py-4 font-medium text-sm flex items-center ${
                activeTab === "changes"
                  ? "text-[#003366] border-b-2 border-[#003366]"
                  : "text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]"
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Changes
            </button>
            <button
              onClick={() => setActiveTab("versions")}
              className={`px-6 py-4 font-medium text-sm flex items-center ${
                activeTab === "versions"
                  ? "text-[#003366] border-b-2 border-[#003366]"
                  : "text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]"
              }`}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              All Versions
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "changes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1E293B] flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-[#003366]" />
                  Changes in Version {currentVersion?.version_number}
                </h3>
                <Badge className="bg-[#003366] text-white px-3 py-1 rounded-full">
                  {currentVersion?.version_number === 1 ? "Initial Version" : "Update"}
                </Badge>
              </div>

              {currentVersion && currentVersion.content ? (
                <div className="space-y-4">
                  <ul className="space-y-3">
                    {currentVersion.content
                      .split("\n")
                      .filter((line) => line.trim() !== "")
                      .map((change, index) => (
                        <li
                          key={index}
                          className="flex items-start p-3 hover:bg-[#F8FAFC] rounded-lg transition-colors duration-200"
                        >
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-[#F59E0B] mr-3 flex-shrink-0" />
                          <span className="text-[#1E293B]">{change}</span>
                        </li>
                      ))}
                  </ul>

                  {/* Version file actions */}
                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-[#E2E8F0]">
                    <Button
                      onClick={() => handleViewVersion(currentVersion)}
                      className="bg-[#F1F5F9] text-[#003366] hover:bg-[#E2E8F0] px-4 py-2 rounded-lg flex items-center transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Document
                    </Button>
                    <Button
                      onClick={() => handleDownloadVersion(currentVersion)}
                      className="bg-[#F1F5F9] text-[#003366] hover:bg-[#E2E8F0] px-4 py-2 rounded-lg flex items-center transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0] text-center">
                  <p className="text-[#64748B] italic">No change notes available for this version.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "versions" && (
            <div>
              <h3 className="text-lg font-semibold text-[#1E293B] mb-4 flex items-center">
                <GitBranch className="h-5 w-5 mr-2 text-[#003366]" />
                Document Version History
              </h3>

              <div className="overflow-hidden rounded-lg border border-[#E2E8F0]">
                <table className="min-w-full divide-y divide-[#E2E8F0]">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider"
                      >
                        Version
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider"
                      >
                        Notes
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-[#64748B] uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E2E8F0]">
                    {versions.map((version) => (
                      <tr
                        key={version.id}
                        className={`hover:bg-[#F8FAFC] transition-colors ${
                          currentVersion?.id === version.id ? "bg-[#F1F5F9]" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <GitCommit className="h-4 w-4 text-[#003366] mr-2" />
                            <span className="text-[#1E293B] font-medium">v{version.version_number}</span>
                            {version.version_number === 1 && (
                              <Badge className="ml-2 bg-[#F59E0B] text-white text-xs px-2 py-0.5 rounded-full">
                                Initial
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748B]">
                          {new Date(version.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1E293B]">
                          <div className="max-w-xs truncate">{version.content || "No notes provided"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setCurrentVersion(version)}
                              className="text-[#003366] hover:text-[#002855] p-1 rounded-full hover:bg-[#F1F5F9] transition-colors"
                              title="Select Version"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleViewVersion(version)}
                              className="text-[#003366] hover:text-[#002855] p-1 rounded-full hover:bg-[#F1F5F9] transition-colors"
                              title="View Version"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadVersion(version)}
                              className="text-[#003366] hover:text-[#002855] p-1 rounded-full hover:bg-[#F1F5F9] transition-colors"
                              title="Download Version"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleOpenModal}
          className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-6 py-3 rounded-lg flex items-center transform transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl font-medium"
        >
          <GitBranch className="h-5 w-5 mr-2" />
          Create New Version
        </Button>
      </div>

      {/* New Version Modal */}
      <Dialog open={isNewVersionModalOpen} onOpenChange={setIsNewVersionModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl overflow-hidden shadow-xl border border-[#E2E8F0] bg-white">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706]"></div>

          <DialogHeader className="pb-4 border-b border-[#E2E8F0]">
            <DialogTitle className="text-xl font-semibold flex items-center text-[#1E293B]">
              <GitCommit className="h-5 w-5 mr-2 text-[#003366]" />
              Create New Document Version
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateNewVersion}>
            <div className="py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#1E293B]">Upload New File (Optional)</label>
                <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 text-center bg-[#F8FAFC] hover:bg-white hover:border-[#94A3B8] transition-colors duration-200 relative">
                  {selectedFile ? (
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <FileText className="h-5 w-5 text-[#003366] flex-shrink-0" />
                        <span className="text-sm truncate max-w-[80%] text-[#1E293B]">{selectedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="flex-shrink-0 p-1 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#DC2626] hover:text-white transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-[#E2E8F0] shadow-sm">
                        <Upload className="h-7 w-7 text-[#64748B]" />
                      </div>
                      <p className="text-sm text-[#64748B]">Drag and drop your file here or</p>
                      <p className="mt-2">
                        <span className="text-sm px-4 py-1.5 bg-[#F1F5F9] text-[#003366] rounded-full font-medium hover:bg-[#E2E8F0] cursor-pointer transition-colors duration-200 inline-block">
                          Browse Files
                        </span>
                      </p>
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1.5">
                  Upload a new file to replace the current document version.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#1E293B]">Version Notes</label>
                <Textarea
                  value={newVersionNotes}
                  onChange={(e) => setNewVersionNotes(e.target.value)}
                  placeholder="Describe what changed in this version..."
                  className="min-h-[120px] p-3 bg-white border border-[#E2E8F0] focus:border-[#003366] focus:ring focus:ring-[#003366]/20 rounded-lg shadow-sm text-[#1E293B]"
                />
                <p className="text-xs text-[#94A3B8] mt-1.5">
                  Add detailed notes about the changes made in this version to help track document evolution.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-[#E2E8F0] gap-3 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewVersionModalOpen(false)}
                className="border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#64748B] rounded-lg font-medium transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#002855] hover:to-[#004080] text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg px-6"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <span>Create Version</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VersionControlPanel
