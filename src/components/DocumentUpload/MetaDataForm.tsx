"use client"

import type React from "react"
import { useState } from "react"
import { Plus, X } from "lucide-react"
import type { UploadedFile } from "../../types/documentUpload.ts"

interface MetadataFormProps {
  files: UploadedFile[]
  onMetadataChange: (fileId: string, metadata: Record<string, string>) => void
}

const MetadataForm: React.FC<MetadataFormProps> = ({ files, onMetadataChange }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [customKey, setCustomKey] = useState("")
  const [customValue, setCustomValue] = useState("")

  const defaultMetadataFields = ["Document Type", "Fiscal Year", "Department"]

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId)
    const fileMetadata = files.find((f) => f.id === fileId)?.metadata || {}
    setMetadata({
      ...defaultMetadataFields.reduce((acc, field) => ({ ...acc, [field]: fileMetadata[field] || "" }), {}),
      ...fileMetadata,
    })
  }

  const handleMetadataChange = (key: string, value: string) => {
    const updatedMetadata = { ...metadata, [key]: value }
    setMetadata(updatedMetadata)
    if (selectedFile) {
      onMetadataChange(selectedFile, updatedMetadata)
    }
  }

  const handleAddCustomMetadata = () => {
    if (customKey && customValue) {
      handleMetadataChange(customKey, customValue)
      setCustomKey("")
      setCustomValue("")
    }
  }

  const handleRemoveMetadata = (key: string) => {
    const { [key]: _, ...rest } = metadata
    setMetadata(rest)
    if (selectedFile) {
      onMetadataChange(selectedFile, rest)
    }
  }

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-navy-blue mb-4">Add Metadata</h2>
      <div className="space-y-4">
        <select
          value={selectedFile || ""}
          onChange={(e) => handleFileSelect(e.target.value)}
          className="w-full p-2 border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-soft-gold"
        >
          <option value="">Select a file</option>
          {files.map((file) => (
            <option key={file.id} value={file.id}>
              {file.file.name}
            </option>
          ))}
        </select>
        {selectedFile && (
          <div className="space-y-4">
            {defaultMetadataFields.map((field) => (
              <div key={field} className="flex items-center space-x-2">
                <label className="w-1/3 text-slate-gray">{field}:</label>
                <input
                  type="text"
                  value={metadata[field] || ""}
                  onChange={(e) => handleMetadataChange(field, e.target.value)}
                  className="flex-1 p-2 border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-soft-gold"
                  placeholder={`Enter ${field.toLowerCase()}`}
                />
              </div>
            ))}
            <div className="border-t border-light-border my-4"></div>
            <h3 className="text-lg font-semibold text-navy-blue mb-2">Custom Metadata</h3>
            {Object.entries(metadata)
              .filter(([key]) => !defaultMetadataFields.includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={key}
                    readOnly
                    className="w-1/3 p-2 border border-light-border rounded-md bg-hover-state"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleMetadataChange(key, e.target.value)}
                    className="flex-1 p-2 border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-soft-gold"
                  />
                  <button
                    onClick={() => handleRemoveMetadata(key)}
                    className="p-2 text-slate-gray hover:text-error-red transition-colors duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Custom key"
                className="w-1/3 p-2 border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-soft-gold"
              />
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Custom value"
                className="flex-1 p-2 border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-soft-gold"
              />
              <button
                onClick={handleAddCustomMetadata}
                className="p-2 text-slate-gray hover:text-soft-gold transition-colors duration-200 rounded-full hover:bg-hover-state"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MetadataForm

