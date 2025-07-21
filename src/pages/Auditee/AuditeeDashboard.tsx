import AuditorLayout from "../../components/Layout/AuditorLayout.tsx"
import AuditeeDashboard from "../../components/auditee/AuditeeDashboard.tsx"

export default function AuditeeDashboardPage() {
  return (
    <AuditorLayout userRole="auditee">
      <AuditeeDashboard />
    </AuditorLayout>
  )
}
