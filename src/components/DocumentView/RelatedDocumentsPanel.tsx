"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FileText, ChevronRight, Loader2 } from "lucide-react"
import axios from "axios"

interface RelatedDocument {
  id: number
  name: string
  type: string
  size: string
}

interface RelatedDocumentsPanelProps {
  documentId: string
  document: {
    id: number
  }
}

const RelatedDocumentsPanel: React.FC<RelatedDocumentsPanelProps> = ({ documentId, document }) => {
  const [relatedDocuments, setRelatedDocuments] = useState<RelatedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRelatedDocuments = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/related`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setRelatedDocuments(response.data.relatedDocuments || [])
        setLoading(false)
      } catch (err) {
        console.error("Error fetching related documents:", err)
        setError("Failed to load related documents")
        setLoading(false)
      }
    }

    fetchRelatedDocuments()
  }, [documentId])

  if (loading) {
    return (
      <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Related Documents
          </h3>
        </div>
        <div className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-navy-blue" />
          <p className="mt-4 text-slate-gray">Loading related documents...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Related Documents
          </h3>
        </div>
        <div className="p-6 text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Related Documents
        </h3>
      </div>

      {/* Document list */}
      <div className="divide-y divide-light-border">
        {relatedDocuments.map((relatedDoc) => (
          <Link
            key={relatedDoc.id}
            to={`/documents/${relatedDoc.id}`}
            className="group block transition-all duration-200 ease-in-out hover:bg-hover-state"
          >
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0">
                <div className="bg-primary-bg p-2 rounded-lg mr-4">
                  <FileText className="h-6 w-6 text-navy-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-dark-text font-medium truncate">{relatedDoc.name}</p>
                  <div className="flex items-center mt-1 text-sm">
                    <span className="text-soft-gold font-medium">{relatedDoc.type}</span>
                    <span className="mx-2 text-muted-text">•</span>
                    <span className="text-slate-gray">{relatedDoc.size}</span>
                  </div>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-slate-gray transform transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {(!relatedDocuments || relatedDocuments.length === 0) && (
        <div className="px-6 py-8 text-center">
          <p className="text-muted-text">No related documents found</p>
        </div>
      )}
    </div>
  )
}

export default RelatedDocumentsPanel
