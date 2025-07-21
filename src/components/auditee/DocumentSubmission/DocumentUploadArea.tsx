"use client"

import type React from "react"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, FileText } from "lucide-react"

interface DocumentUploadAreaProps {
  onFilesAdded: (files: File[]) => void
  isUploading?: boolean
}

const DocumentUploadArea: React.FC<DocumentUploadAreaProps> = ({ onFilesAdded, isUploading = false }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesAdded(acceptedFiles)
    },
    [onFilesAdded],
  )

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    disabled: isUploading,
    multiple: true,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-[#003366] bg-[#003366]/5"
            : isUploading
              ? "border-[#E2E8F0] bg-[#F8FAFC] cursor-not-allowed"
              : "border-[#E2E8F0] hover:border-[#003366] hover:bg-[#003366]/5"
        }`}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          <div
            className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${
              isDragActive
                ? "bg-[#003366] text-white"
                : isUploading
                  ? "bg-[#F1F5F9] text-[#94A3B8]"
                  : "bg-[#F8FAFC] text-[#64748B]"
            }`}
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#94A3B8] border-t-transparent"></div>
            ) : (
              <UploadCloud size={32} />
            )}
          </div>

          <div className="space-y-2">
            {isDragActive ? (
              <p className="text-[#003366] font-semibold text-lg">Drop the files here</p>
            ) : isUploading ? (
              <p className="text-[#94A3B8] font-medium">Uploading documents...</p>
            ) : (
              <>
                <p className="text-[#1E293B] font-semibold text-lg">Drag & drop files here, or click to browse</p>
                <p className="text-[#64748B]">Supports PDF, Excel, CSV, and image files (multiple files allowed)</p>
              </>
            )}
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-xs text-[#94A3B8] bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
              <FileText className="w-3 h-3" />
              <span>Max file size: 10MB per file</span>
            </div>
          </div>
        </div>
      </div>

      {/* Show selected files */}
      {acceptedFiles.length > 0 && !isUploading && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[#1E293B]">Selected Files ({acceptedFiles.length})</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {acceptedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#64748B]" />
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">{file.name}</p>
                    <p className="text-xs text-[#64748B]">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentUploadArea
