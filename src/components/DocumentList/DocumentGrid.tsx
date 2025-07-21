"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { File, CheckCircle, Download, Edit2, Share2, Info, Trash2, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatFileType, formatFileSize } from "../../utils/fileFormatters.ts"

interface DocumentGridProps {
  documents: Document[]
  selectedDocuments: string[]
  onToggleSelection: (id: string) => void
  onOpenDocument: (id: string) => void
}

const FileTypeIcon = ({ fileType }: { fileType: string }) => {
  const iconMap: { [key: string]: React.ElementType } = {
    "application/pdf": FileText,
    "image/jpeg": File,
    "image/png": File,
    "image/gif": File,
    default: File,
  }

  const IconComponent = iconMap[fileType] || iconMap["default"]

  return (
    <div
      className="w-16 h-16 flex items-center justify-center bg-primary-bg/10 rounded-2xl 
      transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-bg/20"
    >
      <IconComponent className="w-8 h-8 text-navy-blue/70" />
    </div>
  )
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      <AnimatePresence>
        {documents.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="group relative bg-white rounded-2xl shadow-card hover:shadow-lg 
              border border-light-border/50 transition-all duration-300 
              hover:border-navy-blue/20 cursor-pointer overflow-hidden"
            onContextMenu={(e) => handleContextMenu(e, doc.id)}
            onClick={() => onOpenDocument(doc.id)}
          >
            {/* Selection Button */}
            <div className="absolute top-3 right-3 z-10">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSelection(doc.id)
                }}
                className={`p-2 rounded-full transition-all duration-300 
                  ${
                    selectedDocuments.includes(doc.id)
                      ? "bg-success-green/20 text-success-green"
                      : "bg-slate-gray/10 text-slate-gray hover:bg-navy-blue/10 hover:text-navy-blue"
                  }`}
              >
                <CheckCircle className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Document Content */}
            <div className="p-6 pb-4">
              <div className="flex flex-col items-center">
                {/* Icon */}
                <div className="mb-4 relative">
                  <FileTypeIcon fileType={doc.file_type} />
                </div>

                {/* Document Info */}
                <h3
                  className="text-dark-text font-semibold text-center mb-2 line-clamp-1 
                  group-hover:text-navy-blue transition-colors"
                >
                  {doc.title}
                </h3>
                <p className="text-sm text-slate-gray mb-1 flex items-center">
                  <span className="mr-2">{formatFileType(doc.file_type)}</span>
                  <span className="text-xs text-muted-text">• {formatFileSize(doc.file_size)}</span>
                </p>
                <p className="text-xs text-muted-text">{formatDate(doc.created_at)}</p>
              </div>
            </div>

            {/* Hover Overlay */}
            <div
              className="absolute inset-0 rounded-2xl bg-navy-blue/5 opacity-0 
              group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-white shadow-2xl rounded-xl py-2 w-56 context-menu 
              border border-light-border/50 overflow-hidden"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {[
              { icon: Download, text: "Download", action: "download", color: "text-navy-blue" },
              { icon: Edit2, text: "Rename", action: "rename", color: "text-slate-gray" },
              { icon: Share2, text: "Share", action: "share", color: "text-success-green" },
              { icon: Info, text: "File Information", action: "info", color: "text-primary-bg" },
              { icon: Trash2, text: "Delete", action: "delete", color: "text-error-red" },
            ].map((item) => (
              <motion.button
                key={item.action}
                whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAction(item.action)}
                className={`w-full text-left px-4 py-2.5 flex items-center 
                  ${item.color} hover:bg-hover-state transition-colors`}
              >
                <item.icon className="w-5 h-5 mr-3 opacity-70" />
                {item.text}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DocumentGrid

