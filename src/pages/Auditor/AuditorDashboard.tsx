import AuditorLayout from "../../components/Layout/AuditorLayout.tsx"
import AuditorDashboard from "../../components/auditor/AuditorDashboard.tsx"

export default function AuditorDashboardPage() {
  return (
    <AuditorLayout userRole="auditor">
      <AuditorDashboard />
    </AuditorLayout>
  )
}
