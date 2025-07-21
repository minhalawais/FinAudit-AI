import AuditorLayout from "../../components/Layout/AuditorLayout.tsx"
import AuditList from "../../components/auditee/AuditList.tsx"

export default function AuditListPage() {
  return (
    <AuditorLayout userRole="auditee">
      <AuditList />
    </AuditorLayout>
  )
}
