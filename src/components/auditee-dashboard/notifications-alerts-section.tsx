import { ListCard } from "./list-card.tsx"
import { Bell, AlertCircle } from "lucide-react"
import { StatusBadge } from "./status-badge.tsx"

interface NotificationsAlertsProps {
  unreadNotificationsCount: number
  highPriorityNotifications: {
    title: string
    message: string
    priority: string
    created_at: string
    notification_id: number
  }[]
}

export function NotificationsAlertsSection({
  unreadNotificationsCount,
  highPriorityNotifications,
}: NotificationsAlertsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ListCard
        title="Unread Notifications"
        emptyMessage="No unread notifications."
        emptyIcon={Bell}
        className="lg:col-span-1"
      >
        <div className="flex flex-col items-center justify-center h-full py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <p className="text-4xl font-bold text-[#F59E0B]">{unreadNotificationsCount}</p>
          <p className="text-sm text-[#64748B] mt-2">Total unread notifications.</p>
        </div>
      </ListCard>

      <ListCard
        title="High Priority Notifications"
        emptyMessage="No high priority notifications."
        emptyIcon={AlertCircle}
        className="lg:col-span-1"
      >
        <div className="space-y-4">
          {highPriorityNotifications.map((notification, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-[#FEE2E2] border border-[#DC2626] border-opacity-20 rounded-lg"
            >
              <div className="w-10 h-10 bg-[#DC2626] rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#1E293B]">{notification.title}</p>
                <p className="text-sm text-[#64748B] line-clamp-2">{notification.message}</p>
                <p className="text-xs text-[#94A3B8] mt-1">{new Date(notification.created_at).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={notification.priority} />
            </div>
          ))}
        </div>
      </ListCard>
    </div>
  )
}
