"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs.tsx"
import AuditDetailsOverview from "./AuditDetailsOverview.tsx"
import DocumentSubmissionCenter from "../../auditee/DocumentSubmissionCenter.tsx"
import DocumentReviewCenter from "../../auditor/DocumentReviewCenter.tsx"
import AuditFindings from "./AuditFindings.tsx"
import AuditMeetings from "./AuditMeetings.tsx"
import AIInsights from "./AIInsights.tsx"
import AuditTeam from "./AuditTeam.tsx"
import AuditTimeline from "./AuditTimeline.tsx"
import ComplianceCheckpoints from "./ComplianceCheckpoints.tsx"
import AuditNotifications from "./AuditNotifications.tsx"

interface AuditDetailsTabsEnhancedProps {
  auditId: number
  auditData: any
}

const AuditDetailsTabsEnhanced: React.FC<AuditDetailsTabsEnhancedProps> = ({ auditId, auditData }) => {
  const [activeTab, setActiveTab] = React.useState("overview")

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="findings"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Findings
          </TabsTrigger>
          <TabsTrigger
            value="meetings"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Meetings
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Compliance
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Timeline
          </TabsTrigger>
          <TabsTrigger
            value="ai-insights"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            AI Insights
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="data-[state=active]:bg-white data-[state=active]:text-[#003366] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E2E8F0] rounded-xl transition-all duration-200"
          >
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8">
          <AuditDetailsOverview auditId={auditId} auditData={auditData} />
        </TabsContent>

        <TabsContent value="documents" className="mt-8">
          <div className="space-y-8">
            <DocumentSubmissionCenter auditId={auditId} />
            <DocumentReviewCenter auditId={auditId} />
          </div>
        </TabsContent>

        <TabsContent value="findings" className="mt-8">
          <AuditFindings auditId={auditId} />
        </TabsContent>

        <TabsContent value="meetings" className="mt-8">
          <AuditMeetings auditId={auditId} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-8">
          <ComplianceCheckpoints auditId={auditId} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-8">
          <AuditNotifications auditId={auditId} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-8">
          <AuditTimeline auditId={auditId} />
        </TabsContent>

        <TabsContent value="ai-insights" className="mt-8">
          <AIInsights auditId={auditId} />
        </TabsContent>

        <TabsContent value="team" className="mt-8">
          <AuditTeam auditId={auditId} auditData={auditData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AuditDetailsTabsEnhanced
