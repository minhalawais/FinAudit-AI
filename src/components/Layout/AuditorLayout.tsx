"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Settings,
  Bell,
  Search,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Upload,
  List,
  Beaker,
  Zap,
} from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
  userRole: "auditor" | "auditee"
}

const AuditorLayout: React.FC<LayoutProps> = ({ children, userRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState(3)
  const navigate = useNavigate()
  const location = useLocation()

  const auditeeNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/auditee/dashboard" },
    { icon: FileText, label: "My Audits", href: "/audits" },
    { icon: Users, label: "Auditor Directory", href: "/auditee/auditors" },
    { icon: Shield, label: "Document Submissions", href: "/auditee/submissions" },
    { icon: Calendar, label: "Meetings", href: "/auditee/meetings" },
    { icon: Upload, label: "Upload Document", href: "/documents/upload" },
    { icon: List, label: "Document List", href: "/documents" },
    { icon: Beaker, label: "Document Analysis", href: "/documents/analysis" },
    { icon: Zap, label: "Document Automation", href: "/documents/automation" },
    { icon: BarChart3, label: "Reports", href: "/auditee/reports" },
    { icon: Settings, label: "Settings", href: "/auditee/settings" },
  ]

  const auditorNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/auditor/dashboard" },
    { icon: FileText, label: "Assigned Audits", href: "/auditor/audits" },
    { icon: CheckCircle, label: "Document Review", href: "/auditor/review" },
    { icon: AlertTriangle, label: "Findings", href: "/auditor/findings" },
    { icon: Calendar, label: "Meetings", href: "/auditor/meetings" },
    { icon: Upload, label: "Upload Document", href: "/documents/upload" },
    { icon: List, label: "Document List", href: "/documents" },
    { icon: Beaker, label: "Document Analysis", href: "/documents/analysis" },
    { icon: Zap, label: "Document Automation", href: "/documents/automation" },
    { icon: BarChart3, label: "Reports", href: "/auditor/reports" },
    { icon: Settings, label: "Settings", href: "/auditor/settings" },
  ]

  const navItems = userRole === "auditee" ? auditeeNavItems : auditorNavItems

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E2E8F0] transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#003366] to-[#004D99] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1E293B]">AuditPro</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#64748B] hover:text-[#1E293B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                    ${
                      isActive
                        ? "bg-gradient-to-r from-[#003366] to-[#004D99] text-white"
                        : "text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F1F5F9] cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1E293B] truncate">John Doe</p>
              <p className="text-xs text-[#64748B] capitalize">{userRole}</p>
            </div>
            <LogOut className="w-4 h-4 text-[#64748B]" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-[#E2E8F0] h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#64748B] hover:text-[#1E293B]">
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-80 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-lg">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#DC2626] text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            <div className="w-8 h-8 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}

export default AuditorLayout
