"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MessageSquare, Trash2, Send, User, Clock, Loader2, AlertTriangle } from "lucide-react"
import axios from "axios"

interface Annotation {
  id: number
  text: string
  user_id: number
  created_at: string
  user?: string
}

interface AnnotationPanelProps {
  documentId: string
  document: {
    id: number
  }
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({ documentId, document }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [newAnnotation, setNewAnnotation] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchAnnotations = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/annotations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Transform the data to include user name if not already present
        const annotationsWithUser = response.data.annotations.map((annotation: Annotation) => ({
          ...annotation,
          user: annotation.user || "User " + annotation.user_id,
        }))

        setAnnotations(annotationsWithUser)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching annotations:", err)
        setError("Failed to load document annotations")
        setLoading(false)
      }
    }

    fetchAnnotations()
  }, [documentId])

  const addAnnotation = async () => {
    if (!newAnnotation.trim()) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `http://127.0.0.1:8000/documents/${documentId}/annotations`,
        { text: newAnnotation.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Add the new annotation to the list
      const newAnnotationData = response.data.annotation
      setAnnotations([newAnnotationData, ...annotations])
      setNewAnnotation("")
    } catch (err) {
      console.error("Error adding annotation:", err)
      alert("Failed to add annotation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteAnnotation = async (id: number) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://127.0.0.1:8000/documents/${documentId}/annotations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Remove the deleted annotation from the list
      setAnnotations(annotations.filter((annotation) => annotation.id !== id))
    } catch (err) {
      console.error("Error deleting annotation:", err)
      alert("Failed to delete annotation. Please try again.")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      addAnnotation()
    }
  }

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-gradient-to-r from-navy-blue to-[#004D99] p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="text-white" size={20} />
            <h3 className="text-lg font-semibold text-white">Annotations</h3>
          </div>
        </div>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-navy-blue" />
          <p className="ml-2 text-slate-gray">Loading annotations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-gradient-to-r from-navy-blue to-[#004D99] p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="text-white" size={20} />
            <h3 className="text-lg font-semibold text-white">Annotations</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-blue to-[#004D99] p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="text-white" size={20} />
          <h3 className="text-lg font-semibold text-white">Annotations</h3>
        </div>
        <span className="text-sm bg-white bg-opacity-20 text-white px-3 py-1 rounded-full">
          {annotations.length} notes
        </span>
      </div>

      {/* Input Area */}
      <div className="relative">
        <textarea
          value={newAnnotation}
          onChange={(e) => setNewAnnotation(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Add a new annotation..."
          className="w-full px-4 py-3 pr-12 bg-secondary-bg border border-light-border rounded-xl focus:ring-2 focus:ring-navy-blue focus:border-navy-blue placeholder:text-muted-text resize-none min-h-[80px]"
          disabled={isSubmitting}
        />
        <button
          onClick={addAnnotation}
          disabled={!newAnnotation.trim() || isSubmitting}
          className="absolute right-3 bottom-3 p-2 text-navy-blue hover:bg-primary-bg rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={20} />}
        </button>
      </div>

      {/* Annotations List */}
      <div className="space-y-4">
        {annotations.length > 0 ? (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className="group bg-secondary-bg border border-light-border p-4 rounded-xl hover:border-navy-blue transition-colors duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-bg rounded-lg">
                    <User size={16} className="text-navy-blue" />
                  </div>
                  <div>
                    <span className="font-medium text-dark-text">{annotation.user}</span>
                    <div className="flex items-center mt-1 text-sm text-muted-text">
                      <Clock size={12} className="mr-1" />
                      {formatTimestamp(annotation.created_at)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteAnnotation(annotation.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-error-red hover:bg-error-red hover:bg-opacity-10 rounded-lg transition-all duration-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="mt-3 text-slate-gray whitespace-pre-wrap">{annotation.text}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-text mb-3" />
            <p className="text-dark-text font-medium">No annotations yet</p>
            <p className="text-sm text-muted-text mt-1">Start adding annotations to this document</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnnotationPanel
