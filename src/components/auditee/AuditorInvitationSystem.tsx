"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Mail, UserPlus, Clock, CheckCircle, X } from "lucide-react"

interface AuditorInvitation {
  id: number
  email: string
  status: "pending" | "accepted" | "declined" | "expired"
  invited_at: string
  responded_at: string | null
  inviter: {
    id: number
    name: string
  }
  token: string
  expires_at: string
}

interface InviteForm {
  email: string
  message: string
  role: string
  specializations: string[]
}

const AuditorInvitationSystem: React.FC = () => {
  const [invitations, setInvitations] = useState<AuditorInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: "",
    message: "",
    role: "auditor",
    specializations: [],
  })
  const [sendingInvite, setSendingInvite] = useState(false)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/auditor-invitations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error("Error fetching invitations:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async () => {
    if (!inviteForm.email.trim()) {
      alert("Please enter an email address")
      return
    }

    setSendingInvite(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/api/auditors/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(inviteForm),
      })

      if (response.ok) {
        setShowInviteModal(false)
        setInviteForm({
          email: "",
          message: "",
          role: "auditor",
          specializations: [],
        })
        fetchInvitations()
        alert("Invitation sent successfully!")
      } else {
        const error = await response.json()
        alert(error.detail || "Failed to send invitation")
      }
    } catch (error) {
      alert("Network error occurred")
    } finally {
      setSendingInvite(false)
    }
  }

  const resendInvitation = async (invitationId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/auditor-invitations/${invitationId}/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        fetchInvitations()
        alert("Invitation resent successfully!")
      }
    } catch (error) {
      alert("Failed to resend invitation")
    }
  }

  const cancelInvitation = async (invitationId: number) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/auditor-invitations/${invitationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        fetchInvitations()
        alert("Invitation cancelled successfully!")
      }
    } catch (error) {
      alert("Failed to cancel invitation")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[#F59E0B] bg-opacity-10 text-[#F59E0B]"
      case "accepted":
        return "bg-[#059669] bg-opacity-10 text-[#059669]"
      case "declined":
        return "bg-[#DC2626] bg-opacity-10 text-[#DC2626]"
      case "expired":
        return "bg-[#64748B] bg-opacity-10 text-[#64748B]"
      default:
        return "bg-[#64748B] bg-opacity-10 text-[#64748B]"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "accepted":
        return <CheckCircle className="w-4 h-4" />
      case "declined":
        return <X className="w-4 h-4" />
      case "expired":
        return <Clock className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Auditor Invitations</h1>
            <p className="text-[#64748B]">Invite and manage external auditors</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Invite Auditor
          </button>
        </div>
      </div>

      {/* Invitations List */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0]">
          <h3 className="text-lg font-semibold text-[#1E293B]">Recent Invitations</h3>
        </div>

        {invitations.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-16 h-16 text-[#64748B] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[#1E293B] mb-2">No invitations sent</h3>
            <p className="text-[#64748B] mb-6">Start by inviting your first auditor</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all"
            >
              Send First Invitation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-6 hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#003366] to-[#004D99] rounded-full flex items-center justify-center text-white font-semibold">
                      {invitation.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1E293B]">{invitation.email}</h4>
                      <div className="flex items-center gap-4 text-sm text-[#64748B]">
                        <span>Invited by {invitation.inviter.name}</span>
                        <span>•</span>
                        <span>{new Date(invitation.invited_at).toLocaleDateString()}</span>
                        {invitation.responded_at && (
                          <>
                            <span>•</span>
                            <span>Responded {new Date(invitation.responded_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invitation.status)}
                      <span className={`px-3 py-1 text-sm rounded font-medium ${getStatusColor(invitation.status)}`}>
                        {invitation.status.toUpperCase()}
                      </span>
                    </div>

                    {invitation.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => resendInvitation(invitation.id)}
                          className="px-3 py-1 text-sm border border-[#E2E8F0] rounded text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => cancelInvitation(invitation.id)}
                          className="px-3 py-1 text-sm text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-[#1E293B] mb-4">Invite Auditor</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Email Address *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="auditor@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="auditor">Auditor</option>
                  <option value="lead_auditor">Lead Auditor</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="specialist">Specialist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Personal Message</label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Add a personal message to the invitation..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendInvitation}
                disabled={sendingInvite}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {sendingInvite ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditorInvitationSystem
