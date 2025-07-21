interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (s: string) => {
    switch (s.toLowerCase().replace(/ /g, "_")) {
      case "planned":
        return "bg-[#64748B] bg-opacity-10 text-[#64748B]"
      case "in_progress":
        return "bg-[#F59E0B] bg-opacity-10 text-[#F59E0B]"
      case "completed":
      case "approved":
      case "passed":
      case "resolved":
      case "closed":
        return "bg-[#059669] bg-opacity-10 text-[#059669]"
      case "cancelled":
      case "rejected":
      case "failed":
      case "overdue":
      case "critical":
      case "open":
        return "bg-[#DC2626] bg-opacity-10 text-[#DC2626]"
      case "pending":
      case "needs_revision":
      case "warning":
      case "major":
        return "bg-[#F97316] bg-opacity-10 text-[#F97316]"
      case "minor":
      case "informational":
        return "bg-[#F59E0B] bg-opacity-10 text-[#F59E0B]"
      case "low":
        return "bg-[#059669] bg-opacity-10 text-[#059669]"
      case "medium":
        return "bg-[#F59E0B] bg-opacity-10 text-[#F59E0B]"
      case "high":
        return "bg-[#F97316] bg-opacity-10 text-[#F97316]"
      default:
        return "bg-[#64748B] bg-opacity-10 text-[#64748B]"
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
        status,
      )} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}
