"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "../../ui/Card.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Button } from "../../ui/button.tsx"
import { useAxios } from "../../../hooks/useAxios.ts"
import { Bell, AlertTriangle, Info, CheckCircle, Clock, Mail, Eye, EyeOff } from "lucide-react"

interface AuditNotification {
  id: number
  notification_type: string
  title: string
  message: string
  priority: "low" | "normal" | "high" | "critical"
  read: boolean
  read_at: string | null
  expires_at: string | null
  created_at: string
}

interface AuditNotificationsProps {
  auditId: number
}

const AuditNotifications: React.FC<AuditNotificationsProps> = ({ auditId }) => {
  const [notifications, setNotifications] = useState<AuditNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const axios = useAxios()

  useEffect(() => {
    fetchNotifications()
  }, [auditId, showUnreadOnly])

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`/api/audits/${auditId}/audit-notifications`, {
        params: { unread_only: showUnreadOnly },
      })
      setNotifications(response.data.notifications)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.patch(`/api/audits/notifications/${notificationId}/read`)
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n,
        ),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20"
      case "high":
        return "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20"
      case "normal":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
      case "low":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />
      case "high":
        return <AlertTriangle className="w-4 h-4" />
      case "normal":
        return <Info className="w-4 h-4" />
      case "low":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document_submission":
        return <Mail className="w-4 h-4" />
      case "deadline_warning":
        return <Clock className="w-4 h-4" />
      case "escalation":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#E2E8F0] border-t-[#8B5CF6]"></div>
          <p className="text-[#64748B] font-medium">Loading notifications...</p>
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl shadow-lg">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent">
              Audit Notifications
            </h2>
            <p className="text-[#64748B] mt-1">
              Stay updated with audit activities and alerts
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#DC2626] text-white">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-transparent"
        >
          {showUnreadOnly ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
          {showUnreadOnly ? "Show All" : "Unread Only"}
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-[#64748B]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">
              {showUnreadOnly ? "No unread notifications" : "No notifications"}
            </h3>
            <p className="text-[#64748B]">
              {showUnreadOnly
                ? "All notifications have been read"
                : "Notifications will appear here as audit activities occur"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 ${
                !notification.read
                  ? "bg-gradient-to-r from-[#8B5CF6]/5 to-white border-l-4 border-l-[#8B5CF6]"
                  : "bg-white/80"
              } backdrop-blur-sm`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-xl ${getPriorityColor(notification.priority).replace("text-", "bg-").replace("/10", "/20")}`}
                    >
                      {getTypeIcon(notification.notification_type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-[#1E293B]">{notification.title}</h4>
                        <Badge
                          className={`${getPriorityColor(notification.priority)} border font-medium flex items-center gap-1`}
                        >
                          {getPriorityIcon(notification.priority)}
                          {notification.priority.toUpperCase()}
                        </Badge>
                        {!notification.read && <div className="w-2 h-2 bg-[#8B5CF6] rounded-full"></div>}
                      </div>

                      <p className="text-sm text-[#64748B] mb-3 leading-relaxed">{notification.message}</p>

                      <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                          <span className="capitalize bg-[#F8FAFC] px-2 py-1 rounded-full border border-[#E2E8F0]">
                            {notification.notification_type.replace(/_/g, " ")}
                          </span>
                        </div>

                        {notification.expires_at && (
                          <span className="text-[#F59E0B]">
                            Expires: {new Date(notification.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(notification.id)}
                        className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#8B5CF6]/20 hover:text-[#8B5CF6] transition-all duration-200 bg-transparent"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Mark Read
                      </Button>
                    )}

                    {notification.read && notification.read_at && (
                      <div className="text-xs text-[#059669] bg-[#059669]/10 px-2 py-1 rounded-full border border-[#059669]/20">
                        Read {new Date(notification.read_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AuditNotifications
