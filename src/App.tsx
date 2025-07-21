import type React from "react"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Layout from "./components/Layout/Layout.tsx"
import Login from "./pages/Auth/Login.tsx"
import SignUp from "./pages/Auth/Register.tsx"
import Dashboard from "./pages/Dashboard/MainDashboard.tsx"
import DocumentUpload from "./pages/Documents/DocumentUpload.tsx"
import DocumentList from "./pages/Documents/DocumentList.tsx"
import DocumentView from "./pages/Documents/DocumentView.tsx"
import DocumentAnalysis from "./pages/Documents/DocumentAnalysis.tsx"
import DocumentAutomation from "./pages/Documents/DocumentAutomation.tsx"
import UserSettings from "./pages/Settings/UserSettings.tsx"
import SystemSettings from "./pages/Settings/SystemSettings.tsx"
import Home from "./pages/page.tsx"
import "./styles/globals.css"; // Import here

// Auditee Components
import CompanyAuditDashboard from "./components/auditee/CompanyAuditDashboard.tsx"
import AuditeeDashboard from "./components/auditee/AuditeeDashboard.tsx"
import AuditCreationWizard from "./components/auditee/AuditCreationWizard.tsx"
import AuditorDirectory from "./components/auditee/AuditorDirectory.tsx"
import DocumentSubmissionCenter from "./components/auditee/DocumentSubmissionCenter.tsx"
import ComplianceTracker from "./components/auditee/ComplianceTracker.tsx"
import AuditorPerformance from "./components/auditee/AuditorPerformance.tsx"
import AuditList from "./components/auditee/AuditList.tsx"
// Auditor Components
import AuditorDashboard from "./components/auditor/AuditorDashboard.tsx"
import DocumentReviewCenter from "./components/auditor/DocumentReviewCenter.tsx"
import FindingsManager from "./components/auditor/FindingsManager.tsx"

// Shared Components
import AuditDetailsPage from "./components/audit/AuditDetailsPage.tsx"
import MeetingScheduler from "./components/shared/MeetingScheduler.tsx"
import AddRequirementPage from "./pages/Auditee/AddRequirementPage.tsx"
import ViewRequirementPage from "./pages/Auditee/ViewRequirementsPage.tsx"
import AuditTeamManagement from "./components/audit/AuditDetails/AuditTeamManagement.tsx"
// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

const RoleBasedRoute: React.FC<{
  element: React.ReactElement
  allowedRoles: string[]
}> = ({ element, allowedRoles }) => {
  return element
  const isAuthenticated = !!localStorage.getItem("token")
  const userRole = localStorage.getItem("userRole") // Assuming role is stored in localStorage

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(userRole || "")) {
    return <Navigate to="/dashboard" replace />
  }

  return element
}

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const isAuthenticated = !!localStorage.getItem("token")
  return isAuthenticated ? element : <Navigate to="/login" replace />
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/documents/upload"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <DocumentUpload />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/documents"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <DocumentList />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/documents/:id"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <DocumentView />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/documents/analysis"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <DocumentAnalysis />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/documents/automation"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <DocumentAutomation />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/settings/user"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <UserSettings />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/settings/system"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <SystemSettings />
                  </Layout>
                }
              />
            }
          />

          {/* Shared Audit Routes */}
          <Route
            path="/audits/:auditId"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <AuditDetailsPage />
                  </Layout>
                }
              />
            }
          />

          <Route
            path="/audits/:auditId/meetings"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <MeetingScheduler />
                  </Layout>
                }
              />
            }
          />

          {/* Auditee Routes (Company Employees) */}
          <Route
            path="/auditee/dashboard"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <CompanyAuditDashboard />
                  </Layout>
                }
              />
            }
          />

          <Route
            path="/audits/create"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <AuditCreationWizard />
                  </Layout>
                }
              />
            }
          />

          <Route
            path="/auditors"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <AuditorDirectory />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/auditee_dashboard"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <AuditeeDashboard />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/audits/:auditId/submit"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <DocumentSubmissionCenter />
                  </Layout>
                }
              />
            }
          />

          <Route
            path="/compliance"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <ComplianceTracker />
                  </Layout>
                }
              />
            }
          />

          <Route
            path="/auditors/performance"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <AuditorPerformance />
                  </Layout>
                }
              />
            }
          />

          {/* Auditor Routes (External Professionals) */}
          <Route
            path="/auditor/dashboard"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <AuditorDashboard />
                  </Layout>
                }
              />
            }
          />

          <Route
            path="/auditor/audits/:auditId/review"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <DocumentReviewCenter auditId={0} />
                  </Layout>
                }
              />
            }
          />
        <Route
          path="/auditor/documents/review"
          element={
            <PrivateRoute
              element={
                <Layout>
                  <DocumentReviewCenter auditId={0} />
                </Layout>
              }
            />
          }
        />
          <Route
            path="/audits/list"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <AuditList />
                  </Layout>
                }
              />
            }
          />
          <Route
            path="/audits/:auditId/findings"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <FindingsManager />
                  </Layout>
                }
              />
            }
          />
            <Route
            path="/audits/:auditId/requirements"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <ViewRequirementPage />
                  </Layout>
                }
              />
            }
          />
            <Route
            path="/audits/:auditId/requirements/add"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <AddRequirementPage />
                  </Layout>
                }
              />
            }
          />
                      <Route
            path="/audits/:auditId/audit-team"
            element={
              <PrivateRoute
                element={
                  <Layout>
                    <AuditTeamManagement />
                  </Layout>
                }
              />
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
