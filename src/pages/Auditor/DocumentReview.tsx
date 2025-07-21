import AuditorLayout from "../../components/Layout/AuditorLayout.tsx"
import DocumentReviewCenter from "../../components/auditor/DocumentReviewCenter.tsx"

export default function DocumentReviewPage() {
  return (
    <AuditorLayout userRole="auditor">
      <DocumentReviewCenter />
    </AuditorLayout>
  )
}
