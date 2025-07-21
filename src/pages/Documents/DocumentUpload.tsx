"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { UploadCloud, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import UploadArea from "../../components/DocumentUpload/UploadArea.tsx"
import FileList from "../../components/DocumentUpload/FileList.tsx"
import MetadataForm from "../../components/DocumentUpload/MetaDataForm.tsx"
import UploadProgress from "../../components/DocumentUpload/UploadProgress.tsx"
import PreviewModal from "../../components/DocumentUpload/PreviewModal.tsx"
import type { UploadedFile } from "../../types/documentUpload.ts"
import axios from "axios"

// Toast component for notifications
const Toast: React.FC<{ type: "success" | "error"; message: string; onClose: () => void }> = ({
  type,
  message,
  onClose,
}) => {
  const bgColor = type === "success" ? "bg-success-green" : "bg-error-red"
  const icon = type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />

  return (
    <div className={`fixed top-20 right-4 p-4 rounded-md text-white ${bgColor} flex items-center space-x-2 shadow-lg`}>
      {icon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-sm font-semibold">
        Close
      </button>
    </div>
  )
}

const DocumentUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    // Fetch the token from localStorage or your auth state management
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000) // Auto-close toast after 5 seconds
  }

  const handleFilesAdded = (newFiles: File[]) => {
    const updatedFiles = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      metadata: {},
      status: "pending",
    }))
    setFiles((prevFiles) => [...prevFiles, ...updatedFiles])
  }

  const handleUpload = async () => {
    if (!token) {
      showToast("error", "You must be logged in to upload documents.")
      return
    }

    setUploading(true)
    const uploadedFiles: UploadedFile[] = []

    try {
      for (const file of files) {
        if (file.status === "pending") {
          const formData = new FormData()
          formData.append("file", file.file)

          // Ensure metadata is not empty and add title if not present
          const metadata = {
            ...file.metadata,
            title: file.metadata.title || file.file.name,
          }
          formData.append("metadata", JSON.stringify(metadata))

          const response = await axios.post("http://127.0.0.1:8000/documents", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setFiles((prevFiles) =>
                prevFiles.map((f) => (f.id === file.id ? { ...f, progress: percentCompleted } : f)),
              )
            },
          })

          uploadedFiles.push(file)
          setFiles((prevFiles) =>
            prevFiles.map((f) => (f.id === file.id ? { ...f, status: "uploaded", serverResponse: response.data } : f)),
          )
        }
      }

      if (uploadedFiles.length > 0) {
        showToast("success", `${uploadedFiles.length} file(s) uploaded successfully!`)
        // Clear all files after successful upload instead of just filtering
        setFiles([])
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setFiles((prevFiles) => prevFiles.map((f) => (f.status === "pending" ? { ...f, status: "error" } : f)))
      showToast(
        "error",
        `Error uploading files: ${error.response?.data?.detail || "Unknown error"}`,
      )
    } finally {
      setUploading(false)
    }
  }

  const handleMetadataChange = (fileId: string, metadata: Record<string, string>) => {
    setFiles((prevFiles) => prevFiles.map((file) => (file.id === fileId ? { ...file, metadata } : file)))
  }

  const handlePreview = (file: UploadedFile) => {
    setPreviewFile(file)
  }

  const handleClosePreview = () => {
    setPreviewFile(null)
  }

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId))
  }, [])

  const handleDelete = (fileId: string) => {
    handleRemoveFile(fileId)
  }

  return (
    <div className="min-h-screen bg-primary-background p-8">
      <div className="max-w-4xl mx-auto bg-secondary-background rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-dark-text mb-6">Document Upload</h1>

        <UploadArea onFilesAdded={handleFilesAdded} />

        {files.length > 0 && (
          <>
            <FileList files={files} onPreview={handlePreview} onDelete={handleRemoveFile} />
            <MetadataForm files={files} onMetadataChange={handleMetadataChange} />
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading || files.every((f) => f.status === "uploaded")}
                className="bg-navy-blue text-white px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors duration-300 flex items-center"
              >
                <UploadCloud className="mr-2" />
                {uploading ? "Uploading..." : "Upload Files"}
              </button>
            </div>
            {uploading && <UploadProgress files={files} />}
          </>
        )}

        {files.length === 0 && (
          <div className="text-center text-muted-text mt-8">
            <AlertCircle className="mx-auto mb-4" size={48} />
            <p>No files selected. Drag and drop files or use the upload button above.</p>
          </div>
        )}

        {files.some((file) => file.status === "error") && (
          <div className="mt-4 p-4 bg-error-red/10 text-error-red rounded-md">
            <p>Some files failed to upload. Please try again or contact support if the problem persists.</p>
          </div>
        )}
      </div>

      {previewFile && <PreviewModal file={previewFile} onClose={handleClosePreview} />}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}

export default DocumentUpload

