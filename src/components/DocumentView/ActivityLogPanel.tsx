"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Clock,
  User,
  AlertCircle,
  Edit,
  Eye,
  Download,
  Upload,
  Trash2,
  Loader2,
  MessageSquare,
  GitBranch,
} from "lucide-react"
import axios from "axios"

interface Activity {
  action: string
  user: string
  timestamp: string
  type?: string
}

interface ActivityLogPanelProps {
  documentId: string
  document: {
    id: number
  }
}

const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ documentId, document }) => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://127.0.0.1:8000/documents/${documentId}/activities`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setActivities(response.data.activities || [])
        setLoading(false)
      } catch (err) {
        console.error("Error fetching activities:", err)
        setError("Failed to load activity log")
        setLoading(false)
      }
    }

    fetchActivities()
  }, [documentId])

  // Update the getActivityIcon function to handle more activity types
  const getActivityIcon = (action: string) => {
    if (action.toLowerCase().includes("edit") || action.toLowerCase().includes("update")) return Edit
    if (action.toLowerCase().includes("view")) return Eye
    if (action.toLowerCase().includes("download")) return Download
    if (action.toLowerCase().includes("upload") || action.toLowerCase().includes("add")) return Upload
    if (action.toLowerCase().includes("delete") || action.toLowerCase().includes("remove")) return Trash2
    if (action.toLowerCase().includes("error")) return AlertCircle
    if (action.toLowerCase().includes("workflow")) return Clock
    if (action.toLowerCase().includes("annotation")) return MessageSquare
    if (action.toLowerCase().includes("version")) return GitBranch
    return Clock
  }

  // Update the getActivityColor function to handle more activity types
  const getActivityColor = (action: string) => {
    if (action.toLowerCase().includes("error")) return "text-error-red"
    if (action.toLowerCase().includes("delete") || action.toLowerCase().includes("remove")) return "text-warning-orange"
    if (action.toLowerCase().includes("edit") || action.toLowerCase().includes("update")) return "text-soft-gold"
    if (action.toLowerCase().includes("upload") || action.toLowerCase().includes("add")) return "text-success-green"
    if (action.toLowerCase().includes("workflow_approve")) return "text-emerald-500"
    if (action.toLowerCase().includes("workflow_reject")) return "text-rose-500"
    if (action.toLowerCase().includes("workflow")) return "text-blue-500"
    if (action.toLowerCase().includes("annotation")) return "text-purple-500"
    if (action.toLowerCase().includes("version")) return "text-indigo-500"
    if (action.toLowerCase().includes("view") || action.toLowerCase().includes("download")) return "text-cyan-500"
    return "text-slate-gray"
  }

  // Add a function to get a more user-friendly activity description
  const getActivityDescription = (action: string, type?: string) => {
    // Format the action string to be more readable
    const formattedAction = action.replace(/_/g, " ")

    // Special cases for certain activity types
    if (action.includes("workflow_approve")) {
      return "Approved workflow step"
    } else if (action.includes("workflow_reject")) {
      return "Rejected workflow step"
    } else if (action.includes("add_annotation")) {
      return "Added annotation"
    } else if (action.includes("delete_annotation")) {
      return "Removed annotation"
    } else if (action.includes("add_version")) {
      return "Created new version"
    } else if (action.includes("add_version_with_file")) {
      return "Uploaded new version"
    } else if (action.includes("view_version")) {
      return "Viewed document version"
    } else if (action.includes("download_version")) {
      return "Downloaded document version"
    } else if (action.includes("update_content")) {
      return "Updated document content"
    } else if (action.includes("update_metadata")) {
      return "Updated document metadata"
    }

    // Capitalize first letter of each word
    return formattedAction.replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
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
      <div className="bg-secondary-bg rounded-xl shadow-card border border-light-border animate-fadeIn">
        <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Activity Log</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-navy-blue" />
          <p className="mt-4 text-slate-gray">Loading activity log...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-secondary-bg rounded-xl shadow-card border border-light-border animate-fadeIn">
        <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Activity Log</h3>
          </div>
        </div>
        <div className="p-6 text-center text-red-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
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

  return (
    <div className="bg-secondary-bg rounded-xl shadow-card border border-light-border animate-fadeIn">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Activity Log</h3>
          <span className="text-sm text-primary-bg px-3 py-1 rounded-full bg-opacity-20 bg-white">
            {activities.length} activities
          </span>
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-light-border">
        {activities.map((activity, index) => {
          const IconComponent = getActivityIcon(activity.action)
          const iconColor = getActivityColor(activity.action)

          // Update the activity list rendering to include the new function
          return (
            <div key={index} className="px-6 py-4 hover:bg-primary-bg transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className={`${iconColor} p-2 rounded-lg bg-primary-bg`}>
                  <IconComponent className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-dark-text font-medium truncate">
                      {getActivityDescription(activity.action, activity.type)}
                    </p>
                    <span className="text-sm text-muted-text">{formatTimestamp(activity.timestamp)}</span>
                  </div>

                  <div className="flex items-center mt-1">
                    <User className="h-4 w-4 text-slate-gray mr-1" />
                    <p className="text-sm text-slate-gray truncate">{activity.user}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {activities.length === 0 && (
        <div className="px-6 py-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-text mb-3" />
          <p className="text-dark-text font-medium">No activity yet</p>
          <p className="text-sm text-muted-text mt-1">
            Activities will appear here when users interact with the document
          </p>
        </div>
      )}
    </div>
  )
}

export default ActivityLogPanel
