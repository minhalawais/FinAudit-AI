"use client"

import type React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  FileText,
  Upload,
  BarChart3,
  Settings,
  Users,
  ClipboardCheck,
  TrendingUp,
  Shield,
  Plus,
  CheckCircle,
  List,
  Eye
} from "lucide-react"

interface SidebarProps {
  isExpanded: boolean
  onExpandToggle: (expanded: boolean) => void
  isMobile: boolean
  currentPath: string
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onExpandToggle, isMobile, currentPath }) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Get user role from localStorage
  const userRole = localStorage.getItem("userRole");

  const menuItems = [
    // Dashboard
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      roles: ["admin", "manager", "employee", "auditor", "auditee"],
    },

    // Audit Management Section
    {
      title: "Audit Management",
      isSection: true,
      roles: ["admin", "manager", "auditor", "auditee"],
    },
    {
      title: "Audit Dashboard",
      icon: Shield,
      path: "/auditee_dashboard",
      roles: ["admin","auditor"],
    },
    {
      title: "Create Audit",
      icon: Plus,
      path: "/audits/create",
      roles: ["admin", "manager", "auditee"],
    },
    {
      title: "Audit List",
      icon: List,
      path: "/audits/list",
      roles: ["admin", "manager", "auditor", "auditee"],
    },
    {
      title: "Auditor Directory",
      icon: Users,
      path: "/auditors",
      roles: ["admin", "manager", "auditee"],
    },
    {
      title: "Compliance Tracker",
      icon: CheckCircle,
      path: "/compliance",
      roles: ["admin", "manager", "auditee"],
    },

    // Document Management Section
    {
      title: "Document Management",
      isSection: true,
      roles: ["admin", "manager", "employee", "auditor", "auditee"],
    },
    {
      title: "Documents",
      icon: FileText,
      path: "/documents",
      roles: ["admin", "manager", "employee", "auditor", "auditee"],
    },
    {
      title: "Upload Documents",
      icon: Upload,
      path: "/documents/upload",
      roles: ["admin", "manager", "employee", "auditee"],
    },

    // Settings Section
    {
      title: "Settings",
      isSection: true,
      roles: ["admin", "manager", "employee", "auditor", "auditee"],
    },
    {
      title: "User Settings",
      icon: Settings,
      path: "/settings/user",
      roles: ["admin", "manager", "employee", "auditor", "auditee"],
    },
    {
      title: "System Settings",
      icon: Settings,
      path: "/settings/system",
      roles: ["admin"],
    },
  ]

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole))

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile) {
      onExpandToggle(false)
    }
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard"
    }
    return currentPath.startsWith(path)
  }

  return (
    <div
      className={`
      h-full bg-white border-r border-gray-200 flex flex-col
      ${isExpanded ? "w-64" : "w-16"}
      transition-all duration-300 ease-in-out
    `}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {isExpanded && (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 text-sm">Audit System</span>
              <span className="text-xs text-gray-500 capitalize">{userRole}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {filteredMenuItems.map((item, index) => {
            if (item.isSection) {
              return isExpanded ? (
                <div key={index} className="px-3 py-2 mt-6 first:mt-0">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{item.title}</h3>
                </div>
              ) : (
                <div key={index} className="border-t border-gray-200 my-2" />
              )
            }

            const Icon = item.icon!
            const active = isActive(item.path!)

            return (
              <button
                key={index}
                onClick={() => handleNavigation(item.path!)}
                className={`
                  w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    active
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                  ${!isExpanded ? "justify-center" : ""}
                `}
                title={!isExpanded ? item.title : undefined}
              >
                <Icon
                  className={`
                  h-5 w-5 flex-shrink-0
                  ${active ? "text-blue-700" : "text-gray-400"}
                  ${isExpanded ? "mr-3" : ""}
                `}
                />
                {isExpanded && <span className="truncate">{item.title}</span>}
                {active && !isExpanded && <div className="absolute left-0 w-1 h-6 bg-blue-700 rounded-r" />}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {isExpanded ? (
          <div className="text-xs text-gray-500 text-center">
            <p>Audit Management v2.0</p>
            <p>© 2024 Your Company</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 bg-green-500 rounded-full" title="System Online" />
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
