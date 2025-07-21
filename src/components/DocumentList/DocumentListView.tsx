"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { File, CheckCircle, Download, Edit2, Share2, Info, Trash2 } from "lucide-react"
import type { Document } from "../../types/documentUpload.ts"
import { formatFileType, formatFileSize } from "../../utils/fileFormatters.ts"

interface DocumentListViewProps {
  documents: Document[]
  selectedDocuments: string[]
  onToggleSelection: (id: string) => void
  onOpenDocument: (id: string) => void
}

const DocumentListView: React.FC<DocumentListViewProps> = ({
  documents,
  selectedDocuments,
  onToggleSelection,
  onOpenDocument,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; docId: string } | null>(null)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, docId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, docId })
  }, [])

  const handleAction = useCallback(
    (action: string) => {
      if (contextMenu) {
        console.log(`Performing ${action} on document ${contextMenu.docId}`)
        // Implement the action here
      }
      setContextMenu(null)
    },
    [contextMenu],
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu && !(event.target as Element).closest(".context-menu")) {
        setContextMenu(null)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [contextMenu])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Processed":
      case "completed":
        return "bg-success-green/10 text-success-green"
      case "Analyzing":
      case "in_progress":
        return "bg-warning-orange/10 text-warning-orange"
      case "Error":
      case "rejected":
        return "bg-error-red/10 text-error-red"
      case "timed_out":
        return "bg-purple-200 text-purple-700"
      default:
        return "bg-gray-200 text-gray-700"
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-light-border">
        <thead className="bg-primary-bg">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-gray uppercase tracking-wider w-10"></th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-gray uppercase tracking-wider">Name</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-gray uppercase tracking-wider">Type</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-gray uppercase tracking-wider">Size</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-gray uppercase tracking-wider">
              Upload Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-gray uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-light-border">
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="group hover:bg-hover-state transition-colors duration-200 cursor-pointer"
              onContextMenu={(e) => handleContextMenu(e, doc.id)}
              onDoubleClick={() => onOpenDocument(doc.id)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onToggleSelection(doc.id)}
                  className={`p-1.5 rounded-full transition-all duration-300 
                    ${
                      selectedDocuments.includes(doc.id)
                        ? "bg-success-green text-white"
                        : "bg-slate-gray/10 text-slate-gray hover:bg-navy-blue/10 hover:text-navy-blue"
                    }`}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-primary-bg group-hover:bg-white transition-colors duration-200">
                    <File className="w-5 h-5 text-navy-blue" />
                  </div>
                  <span className="ml-3 font-medium text-dark-text">{doc.title}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-slate-gray">{formatFileType(doc.file_type)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-slate-gray">{formatFileSize(doc.file_size)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-slate-gray">{formatDate(doc.created_at)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(doc.workflow_status)}`}
                >
                  {doc.workflow_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white shadow-lg rounded-lg py-2 w-48 context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleAction("download")}
            className="w-full text-left px-4 py-2 hover:bg-hover-state flex items-center"
          >
            <Download className="w-4 h-4 mr-2" /> Download
          </button>
          <button
            onClick={() => handleAction("rename")}
            className="w-full text-left px-4 py-2 hover:bg-hover-state flex items-center"
          >
            <Edit2 className="w-4 h-4 mr-2" /> Rename
          </button>
          <button
            onClick={() => handleAction("share")}
            className="w-full text-left px-4 py-2 hover:bg-hover-state flex items-center"
          >
            <Share2 className="w-4 h-4 mr-2" /> Share
          </button>
          <button
            onClick={() => handleAction("info")}
            className="w-full text-left px-4 py-2 hover:bg-hover-state flex items-center"
          >
            <Info className="w-4 h-4 mr-2" /> File Information
          </button>
          <button
            onClick={() => handleAction("delete")}
            className="w-full text-left px-4 py-2 hover:bg-hover-state flex items-center text-error-red"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default DocumentListView

