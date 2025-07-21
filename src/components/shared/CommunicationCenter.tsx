"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Send, Paperclip, Users, Calendar, Phone, Video, Search } from "lucide-react"

interface Message {
  id: number
  content: string
  sender: {
    id: number
    name: string
    role: string
  }
  sent_at: string
  message_type: "text" | "file" | "system"
  attachments?: Array<{
    id: number
    filename: string
    file_size: number
    file_type: string
  }>
}

interface Conversation {
  id: number
  audit_id: number
  participants: Array<{
    id: number
    name: string
    email: string
    role: string
  }>
  last_message: Message | null
  unread_count: number
  created_at: string
}

const CommunicationCenter: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [auditId])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const url = auditId ? `http://127.0.0.1:8000/api/audits/${auditId}/conversations` : "http://127.0.0.1:8000/api/conversations"
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setConversations(data.conversations || [])

      if (data.conversations?.length > 0 && !selectedConversation) {
        setSelectedConversation(data.conversations[0])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/conversations/${conversationId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setSendingMessage(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          content: newMessage,
          message_type: "text",
        }),
      })

      if (response.ok) {
        setNewMessage("")
        fetchMessages(selectedConversation.id)
        fetchConversations() // Refresh to update last message
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-8xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Communication Center</h1>
          <p className="text-[#64748B]">Communicate with auditors and team members</p>
        </div>

        <div
          className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
          style={{ height: "calc(100vh - 200px)" }}
        >
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-[#E2E8F0] flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-[#E2E8F0]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC] transition-colors ${
                      selectedConversation?.id === conversation.id ? "bg-[#F8FAFC] border-l-4 border-l-[#003366]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#64748B]" />
                        <span className="font-medium text-[#1E293B] text-sm">
                          {conversation.participants.length} participants
                        </span>
                      </div>
                      {conversation.unread_count > 0 && (
                        <span className="bg-[#DC2626] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#64748B] mb-2">
                      {conversation.participants.map((p) => p.name).join(", ")}
                    </div>

                    {conversation.last_message && (
                      <div className="text-sm text-[#64748B] truncate">
                        <span className="font-medium">{conversation.last_message.sender.name}:</span>{" "}
                        {conversation.last_message.content}
                      </div>
                    )}

                    <div className="text-xs text-[#94A3B8] mt-1">
                      {conversation.last_message && formatTime(conversation.last_message.sent_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-[#1E293B]">Audit Communication</h3>
                        <div className="text-sm text-[#64748B]">
                          {selectedConversation.participants.map((p) => p.name).join(", ")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-white rounded-lg transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-white rounded-lg transition-colors">
                          <Video className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-white rounded-lg transition-colors">
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender.id === Number.parseInt(localStorage.getItem("userId") || "0")
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender.id === Number.parseInt(localStorage.getItem("userId") || "0")
                              ? "bg-[#003366] text-white"
                              : "bg-[#F1F5F9] text-[#1E293B]"
                          }`}
                        >
                          {message.sender.id !== Number.parseInt(localStorage.getItem("userId") || "0") && (
                            <div className="text-xs font-medium mb-1 opacity-70">{message.sender.name}</div>
                          )}
                          <div className="text-sm">{message.content}</div>
                          <div className="text-xs mt-1 opacity-70">{formatTime(message.sent_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-[#E2E8F0]">
                    <div className="flex items-end gap-3">
                      <button className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          placeholder="Type your message..."
                          rows={1}
                          className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent resize-none"
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="p-3 bg-[#003366] text-white rounded-lg hover:bg-[#004D99] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-[#64748B] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-[#1E293B] mb-2">No conversation selected</h3>
                    <p className="text-[#64748B]">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunicationCenter
