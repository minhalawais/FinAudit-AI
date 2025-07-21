"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Users,
  FileText,
  X,
  Brain,
  Zap,
  AlertTriangle,
  Shield,
  TrendingUp,
  Clock,
  Calendar,
  DollarSign,
  FileSearch,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useAxios } from "../../hooks/useAxios.ts"
import axios from "axios"

interface EnhancedFinancialAuditFormData {
  name: string
  description: string
  financial_audit_type: string
  scope: string
  start_date: string
  end_date: string
  deadline: string
  materiality_threshold: number
  estimated_budget: number | null
  audit_methodology: string
  compliance_frameworks: string[]
  industry_type: string
  template_id: number | null
  auditor_emails: string[]
}

interface ValidationResult {
  is_valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

interface AuditorRecommendation {
  auditor_id: number
  name: string
  email: string
  match_score: number
  reasons: string[]
  hourly_rate: number
}

interface AuditTemplate {
  id: number
  name: string
  description: string
  industry_type: string
  compliance_frameworks: string[]
  audit_methodology: string
  template_data: any
}

const FinancialAuditCreationWizard: React.FC = () => {
  const navigate = useNavigate()
  const axiosInstance = useAxios()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [auditorRecommendations, setAuditorRecommendations] = useState<AuditorRecommendation[]>([])
  const [templates, setTemplates] = useState<AuditTemplate[]>([])
  const [historicalInsights, setHistoricalInsights] = useState<any>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>('all')

  const [formData, setFormData] = useState<EnhancedFinancialAuditFormData>({
    name: "",
    description: "",
    financial_audit_type: "vendor_payments",
    scope: "",
    start_date: "",
    end_date: "",
    deadline: "",
    materiality_threshold: 50000,
    estimated_budget: null,
    audit_methodology: "risk_based",
    compliance_frameworks: [],
    industry_type: "financial_services",
    template_id: null,
    auditor_emails: [],
  })

  const steps = [
    { id: 1, title: "Basic Information", icon: FileText },
    { id: 2, title: "Templates & Compliance", icon: Shield },
    { id: 3, title: "AI Validation & Insights", icon: Brain },
    { id: 4, title: "Smart Auditor Matching", icon: Users },
    { id: 5, title: "Review & Create", icon: CheckCircle },
  ]

  const financialAuditTypes = [
    { value: "vendor_payments", label: "Vendor Payments", description: "Review vendor payment processes and controls" },
    {
      value: "expense_reimbursements",
      label: "Expense Reimbursements",
      description: "Audit employee expense reimbursement processes",
    },
    { value: "tax_compliance", label: "Tax Compliance", description: "Review tax compliance and filing processes" },
    { value: "payroll_audit", label: "Payroll Audit", description: "Audit payroll processing and controls" },
    {
      value: "revenue_recognition",
      label: "Revenue Recognition",
      description: "Review revenue recognition policies and practices",
    },
    { value: "accounts_payable", label: "Accounts Payable", description: "Audit accounts payable processes" },
    {
      value: "accounts_receivable",
      label: "Accounts Receivable",
      description: "Review accounts receivable management",
    },
    { value: "inventory_valuation", label: "Inventory Valuation", description: "Audit inventory valuation methods" },
    { value: "custom", label: "Custom Financial Audit", description: "Define your own financial audit scope" },
  ]

  const auditMethodologies = [
    {
      value: "risk_based",
      label: "Risk-Based",
      description: "Focus on high-risk areas identified through risk assessment",
    },
    {
      value: "compliance_based",
      label: "Compliance-Based",
      description: "Ensure adherence to specific regulations and standards",
    },
    {
      value: "substantive",
      label: "Substantive Testing",
      description: "Detailed testing of transactions and balances",
    },
    { value: "analytical", label: "Analytical Procedures", description: "Use data analytics and trend analysis" },
    { value: "hybrid", label: "Hybrid Approach", description: "Combination of multiple methodologies" },
  ]

  const complianceFrameworks = [
    { value: "sox", label: "SOX", description: "Sarbanes-Oxley Act compliance" },
    { value: "gdpr", label: "GDPR", description: "General Data Protection Regulation" },
    { value: "hipaa", label: "HIPAA", description: "Health Insurance Portability and Accountability Act" },
    { value: "iso27001", label: "ISO 27001", description: "Information Security Management" },
    { value: "pci_dss", label: "PCI DSS", description: "Payment Card Industry Data Security Standard" },
  ]

  const industryTypes = [
    { value: "healthcare", label: "Healthcare" },
    { value: "financial_services", label: "Financial Services" },
    { value: "technology", label: "Technology" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "retail", label: "Retail" },
    { value: "government", label: "Government" },
    { value: "education", label: "Education" },
    { value: "other", label: "Other" },
  ]

  useEffect(() => {
    fetchTemplates()
  }, [formData.industry_type])

  // Auto-trigger validation when entering step 3
  useEffect(() => {
    if (currentStep === 3 && !validationResult && !loading) {
      validateAuditData()
    }
  }, [currentStep])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await axios.get(
        `http://127.0.0.1:8000/api/audits/templates/all`,
        {
          params: { industry_type: formData.industry_type },
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      );
  
      const data = response.data;
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      alert("Failed to load templates. Please try again.");
    }
  };

  const validateAuditData = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/api/audits/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.status === 200) {
        const data = await response.json()
        setValidationResult(data.validation)
        return data.validation.is_valid
      }
    } catch (error) {
      console.error("Validation failed:", error)
      alert("Validation failed. Please try again.")
      setValidationResult({
        is_valid: false,
        errors: ["Validation service temporarily unavailable"],
        warnings: [],
        suggestions: [],
      })
    } finally {
      setLoading(false)
    }
    return false
  }

  const fetchAuditorRecommendations = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.post("/api/audits/recommendations/auditors/enhanced", {
        financial_audit_type: formData.financial_audit_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        industry_type: formData.industry_type,
        compliance_frameworks: formData.compliance_frameworks
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      })
  
      if (response.status === 200) {
        setAuditorRecommendations(response.data.recommendations || [])
      }
    } catch (error) {
      console.error("Error fetching auditor recommendations:", error)
      alert("Failed to fetch auditor recommendations. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Prepare the data in the format expected by the backend
      const requestData = {
        ...formData,
        // Ensure proper type conversion for numbers
        materiality_threshold: Number(formData.materiality_threshold),
        estimated_budget: formData.estimated_budget ? Number(formData.estimated_budget) : null,
        // Convert empty arrays to undefined if needed
        compliance_frameworks: formData.compliance_frameworks.length > 0 
          ? formData.compliance_frameworks 
          : undefined,
        auditor_emails: formData.auditor_emails.length > 0 
          ? formData.auditor_emails 
          : undefined,
        // Ensure dates are properly formatted
        start_date: formData.start_date,
        end_date: formData.end_date,
        deadline: formData.deadline,
      };
  
      // Remove undefined values
      const payload = Object.fromEntries(
        Object.entries(requestData).filter(([_, v]) => v !== undefined)
      );
  
      const response = await axiosInstance.post(
        "/api/audits/create-enhanced", 
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.status === 200 || response.status === 201) {
        const result = response.data;
        alert("Enhanced financial audit created successfully!");
        navigate(`/audits/${result.audit_id}`);
      }
    } catch (error) {
      console.error("Error creating audit:", error);
      const errorMessage =
        error.response?.data?.detail?.message || 
        error.response?.data?.message || 
        "Failed to create audit. Please check your data and try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 3) {
      if (validationResult && !validationResult.is_valid) {
        alert("Please fix the validation errors before proceeding.")
        return
      }
    }

    if (currentStep === 4) {
      await fetchAuditorRecommendations()
    }

    setCurrentStep(Math.min(steps.length, currentStep + 1))
  }

  const handlePreviousStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1))
    if (currentStep === 3) {
      setValidationResult(null)
    }
  }

  const applyTemplate = (template: AuditTemplate) => {
    setFormData((prev) => ({
      ...prev,
      template_id: template.id,
      audit_methodology: template.audit_methodology,
      compliance_frameworks: template.compliance_frameworks,
      scope: template.template_data?.default_scope || prev.scope,
    }))
  }

  const toggleComplianceFramework = (framework: string) => {
    setFormData((prev) => ({
      ...prev,
      compliance_frameworks: prev.compliance_frameworks.includes(framework)
        ? prev.compliance_frameworks.filter((f) => f !== framework)
        : [...prev.compliance_frameworks, framework],
    }))
  }

  const addRecommendedAuditor = (auditor: AuditorRecommendation) => {
    if (!formData.auditor_emails.includes(auditor.email)) {
      setFormData((prev) => ({
        ...prev,
        auditor_emails: [...prev.auditor_emails, auditor.email],
      }))
    }
  }

  const toggleSection = (section: string) => {
    if (expandedSection === 'all') {
      // If all sections are expanded, keep them expanded (don't toggle)
      return
    }
    setExpandedSection(expandedSection === section ? null : section)
  }
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/audits")}
            className="p-2 text-[#64748B] hover:text-[#003366] hover:bg-[#F1F5F9] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1E293B]">Create Enhanced Financial Audit</h1>
            <p className="text-sm text-[#64748B]">Step-by-step wizard for comprehensive financial audits</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-full text-sm">
            <Zap className="w-4 h-4" />
            AI-Enhanced
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep >= step.id
                    ? "bg-[#003366] border-[#003366] text-white"
                    : "border-[#E2E8F0] text-[#64748B]"
                }`}
              >
                {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>
              <div className="ml-3 hidden md:block">
                <p className={`text-sm font-medium ${currentStep >= step.id ? "text-[#003366]" : "text-[#64748B]"}`}>
                  Step {step.id}
                </p>
                <p className={`text-xs ${currentStep >= step.id ? "text-[#003366]" : "text-[#64748B]"}`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${currentStep > step.id ? "bg-[#003366]" : "bg-[#E2E8F0]"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1E293B]">Basic Audit Information</h2>
              <div className="text-sm text-[#64748B]">Step 1 of {steps.length}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Audit Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                  placeholder="e.g., Q4 2024 Vendor Payments Audit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Industry Type *</label>
                <select
                  value={formData.industry_type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, industry_type: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                >
                  {industryTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('auditType')}
              >
                <h3 className="font-medium text-[#1E293B]">Financial Audit Type *</h3>
                {expandedSection === 'auditType' ? <ChevronUp className="text-[#64748B]" /> : <ChevronDown className="text-[#64748B]" />}
              </div>
              
              {(expandedSection === 'all' || expandedSection === 'auditType') && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {financialAuditTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.financial_audit_type === type.value
                          ? "border-[#003366] bg-[#F1F5F9]"
                          : "border-[#E2E8F0] hover:border-[#003366]"
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, financial_audit_type: type.value }))}
                    >
                      <h3 className="font-medium text-[#1E293B] mb-1">{type.label}</h3>
                      <p className="text-sm text-[#64748B]">{type.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                placeholder="Describe the purpose and objectives of this financial audit"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#E2E8F0] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-[#F59E0B]" />
                  <label className="block text-sm font-medium text-[#1E293B]">Materiality Threshold ($) *</label>
                </div>
                <input
                  type="number"
                  value={formData.materiality_threshold}
                  onChange={(e) => setFormData((prev) => ({ ...prev, materiality_threshold: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                  placeholder="50000"
                />
                <p className="text-xs text-[#64748B] mt-2">
                  Transactions above this amount will receive detailed review
                </p>
              </div>

              <div className="border border-[#E2E8F0] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-[#F59E0B]" />
                  <label className="block text-sm font-medium text-[#1E293B]">Estimated Budget ($)</label>
                </div>
                <input
                  type="number"
                  value={formData.estimated_budget || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      estimated_budget: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                  placeholder="Auto-calculated if left blank"
                />
                <p className="text-xs text-[#64748B] mt-2">AI will estimate if not provided</p>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('timeline')}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#003366]" />
                  <h3 className="font-medium text-[#1E293B]">Audit Timeline</h3>
                </div>
                {expandedSection === 'timeline' ? <ChevronUp className="text-[#64748B]" /> : <ChevronDown className="text-[#64748B]" />}
              </div>
              
              {(expandedSection === 'all' || expandedSection === 'timeline')&& (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-2">Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-2">End Date *</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-2">Final Deadline *</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Templates & Compliance */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1E293B]">Templates & Compliance Framework</h2>
              <div className="text-sm text-[#64748B]">Step 2 of {steps.length}</div>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('methodology')}
              >
                <h3 className="font-medium text-[#1E293B]">Audit Methodology *</h3>
                {expandedSection === 'methodology' ? <ChevronUp className="text-[#64748B]" /> : <ChevronDown className="text-[#64748B]" />}
              </div>
              
              {(expandedSection === 'all' || expandedSection === 'methodology') && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {auditMethodologies.map((methodology) => (
                    <div
                      key={methodology.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.audit_methodology === methodology.value
                          ? "border-[#003366] bg-[#F1F5F9]"
                          : "border-[#E2E8F0] hover:border-[#003366]"
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, audit_methodology: methodology.value }))}
                    >
                      <h3 className="font-medium text-[#1E293B] mb-1">{methodology.label}</h3>
                      <p className="text-sm text-[#64748B]">{methodology.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-[#E2E8F0] rounded-lg p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('compliance')}
              >
                <h3 className="font-medium text-[#1E293B]">Compliance Frameworks</h3>
                {expandedSection === 'compliance' ? <ChevronUp className="text-[#64748B]" /> : <ChevronDown className="text-[#64748B]" />}
              </div>
              
              {(expandedSection === 'all' || expandedSection === 'compliance') && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {complianceFrameworks.map((framework) => (
                    <div
                      key={framework.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.compliance_frameworks.includes(framework.value)
                          ? "border-[#003366] bg-[#F1F5F9]"
                          : "border-[#E2E8F0] hover:border-[#003366]"
                      }`}
                      onClick={() => toggleComplianceFramework(framework.value)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-[#1E293B]">{framework.label}</h3>
                        {formData.compliance_frameworks.includes(framework.value) && (
                          <CheckCircle className="w-5 h-5 text-[#003366]" />
                        )}
                      </div>
                      <p className="text-sm text-[#64748B]">{framework.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {templates.length > 0 && (
              <div className="border border-[#E2E8F0] rounded-lg p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('templates')}
                >
                  <h3 className="font-medium text-[#1E293B]">Available Templates</h3>
                  {expandedSection === 'templates' ? <ChevronUp className="text-[#64748B]" /> : <ChevronDown className="text-[#64748B]" />}
                </div>
                
                {(expandedSection === 'all' || expandedSection === 'templates') && (
                  <div className="mt-4 space-y-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.template_id === template.id
                            ? "border-[#003366] bg-[#F1F5F9]"
                            : "border-[#E2E8F0] hover:border-[#003366]"
                        }`}
                        onClick={() => applyTemplate(template)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-[#1E293B]">{template.name}</h3>
                          <div className="flex items-center gap-2">
                            {template.compliance_frameworks.map((fw) => (
                              <span key={fw} className="px-2 py-1 bg-[#E2E8F0] text-[#64748B] text-xs rounded">
                                {fw.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-[#64748B]">{template.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border border-[#E2E8F0] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileSearch className="w-5 h-5 text-[#003366]" />
                <label className="block text-sm font-medium text-[#1E293B]">Audit Scope *</label>
              </div>
              <textarea
                value={formData.scope}
                onChange={(e) => setFormData((prev) => ({ ...prev, scope: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                placeholder="Define the specific areas, processes, and controls to be audited"
              />
            </div>
          </div>
        )}

        {/* Step 3: AI Validation & Insights */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-[#8B5CF6]" />
                <h2 className="text-xl font-semibold text-[#1E293B]">AI Validation & Insights</h2>
              </div>
              <div className="text-sm text-[#64748B]">Step 3 of {steps.length}</div>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
                <span className="text-[#64748B]">Analyzing audit parameters with AI...</span>
                <p className="text-xs text-[#94A3B8]">This may take a few moments</p>
              </div>
            )}

            {!loading && !validationResult && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center max-w-md">
                  <Brain className="w-12 h-12 text-[#8B5CF6] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#1E293B] mb-2">Preparing AI Analysis</h3>
                  <p className="text-[#64748B] mb-6">Our AI will validate your audit parameters and provide insights to optimize your audit plan.</p>
                  <button
                    onClick={validateAuditData}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-lg hover:from-[#7C3AED] hover:to-[#6D28D9] transition-all shadow-sm"
                  >
                    Start AI Validation
                  </button>
                </div>
              </div>
            )}

            {!loading && validationResult && (
              <div className="space-y-4">
                {/* Validation Status */}
                <div
                  className={`p-4 rounded-lg border-2 ${
                    validationResult.is_valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {validationResult.is_valid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <h3 className="font-medium">
                      {validationResult.is_valid ? "Validation Passed" : "Validation Issues Found"}
                    </h3>
                  </div>
                  {validationResult.is_valid ? (
                    <p className="text-sm text-green-700">
                      Your audit configuration looks good! You can proceed to the next step.
                    </p>
                  ) : (
                    <p className="text-sm text-red-700">
                      {validationResult.errors.length} critical issue{validationResult.errors.length !== 1 ? 's' : ''} found that need your attention.
                    </p>
                  )}
                </div>

                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <X className="w-5 h-5 text-red-600" />
                      <h4 className="font-medium text-red-800">Errors to Fix:</h4>
                    </div>
                    <ul className="space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="text-red-700 text-sm pl-7">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-medium text-yellow-800">Warnings:</h4>
                    </div>
                    <ul className="space-y-2">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index} className="text-yellow-700 text-sm pl-7">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {validationResult.suggestions.length > 0 && (
                  <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-blue-800">AI Suggestions:</h4>
                    </div>
                    <ul className="space-y-2">
                      {validationResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-blue-700 text-sm pl-7">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Re-validate Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => {
                      setValidationResult(null)
                      validateAuditData()
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-lg hover:from-[#7C3AED] hover:to-[#6D28D9] transition-all shadow-sm"
                  >
                    Re-run Validation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Smart Auditor Matching */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-[#8B5CF6]" />
                <h2 className="text-xl font-semibold text-[#1E293B]">Smart Auditor Matching</h2>
              </div>
              <div className="text-sm text-[#64748B]">Step 4 of {steps.length}</div>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
                <span className="text-[#64748B]">Finding best auditor matches...</span>
                <p className="text-xs text-[#94A3B8]">Analyzing skills, availability, and past performance</p>
              </div>
            )}

            {auditorRecommendations.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-[#1E293B]">Recommended Auditors</h3>
                <p className="text-sm text-[#64748B] mb-4">Based on your audit requirements and historical performance data</p>
                
                <div className="space-y-4">
                  {auditorRecommendations.map((auditor) => (
                    <div
                      key={auditor.auditor_id}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.auditor_emails.includes(auditor.email)
                          ? "border-[#003366] bg-[#F1F5F9]"
                          : "border-[#E2E8F0] hover:border-[#003366]"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-[#1E293B]">{auditor.name}</h4>
                          <p className="text-sm text-[#64748B]">{auditor.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium text-[#1E293B]">{auditor.match_score}%</span>
                              <div className="w-16 bg-[#E2E8F0] rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    auditor.match_score > 75 ? 'bg-[#059669]' : 
                                    auditor.match_score > 50 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'
                                  }`} 
                                  style={{ width: `${auditor.match_score}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-sm text-[#64748B]">${auditor.hourly_rate}/hr</div>
                          </div>
                          <button
                            onClick={() => addRecommendedAuditor(auditor)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              formData.auditor_emails.includes(auditor.email)
                                ? "bg-[#003366] text-white"
                                : "bg-[#E2E8F0] text-[#64748B] hover:bg-[#003366] hover:text-white"
                            }`}
                          >
                            {formData.auditor_emails.includes(auditor.email) ? "Selected" : "Select"}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {auditor.reasons.map((reason, index) => (
                          <span key={index} className="px-2 py-1 bg-[#E2E8F0] text-[#64748B] text-xs rounded">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Auditor Addition */}
            <div className="border-t border-[#E2E8F0] pt-6 mt-6">
              <h3 className="font-medium text-[#1E293B] mb-4">Add Auditors Manually</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter auditor email"
                  id="auditor-email-input"
                  className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const email = (e.target as HTMLInputElement).value.trim();
                      if (email && !formData.auditor_emails.includes(email)) {
                        setFormData((prev) => ({
                          ...prev,
                          auditor_emails: [...prev.auditor_emails, email],
                        }));
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById("auditor-email-input") as HTMLInputElement;
                    const email = input.value.trim();
                    if (email && !formData.auditor_emails.includes(email)) {
                      setFormData((prev) => ({
                        ...prev,
                        auditor_emails: [...prev.auditor_emails, email],
                      }));
                      input.value = "";
                    }
                  }}
                  className="px-6 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Selected Auditors */}
              {formData.auditor_emails.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-[#1E293B] mb-2">Selected Auditors:</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.auditor_emails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-1 bg-[#E2E8F0] rounded-full">
                        <span className="text-sm text-[#64748B]">{email}</span>
                        <button
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              auditor_emails: prev.auditor_emails.filter((_, i) => i !== index),
                            }))
                          }
                          className="text-[#64748B] hover:text-[#DC2626] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review & Create */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1E293B]">Review & Create Audit</h2>
              <div className="text-sm text-[#64748B]">Step 5 of {steps.length}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="p-4 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-[#003366]" />
                  <h3 className="font-medium text-[#1E293B]">Basic Information</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-[#64748B]">Name:</span> 
                    <span className="text-[#1E293B] ml-2">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Type:</span> 
                    <span className="text-[#1E293B] ml-2">{formData.financial_audit_type}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Industry:</span> 
                    <span className="text-[#1E293B] ml-2">{formData.industry_type}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Methodology:</span> 
                    <span className="text-[#1E293B] ml-2">{formData.audit_methodology}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Materiality:</span> 
                    <span className="text-[#1E293B] ml-2">${formData.materiality_threshold.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-[#003366]" />
                  <h3 className="font-medium text-[#1E293B]">Timeline</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-[#64748B]">Start:</span> 
                    <span className="text-[#1E293B] ml-2">{formData.start_date}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">End:</span> 
                    <span className="text-[#1E293B] ml-2">{formData.end_date}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Deadline:</span> 
                    <span className="text-[#1E293B] ml-2">{formData.deadline}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Duration:</span> 
                    <span className="text-[#1E293B] ml-2">
                      {Math.ceil(
                        (new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) /
                          (1000 * 60 * 60 * 24),
                      )}{" "}
                      days
                    </span>
                  </div>
                </div>
              </div>

              {/* Compliance */}
              <div className="p-4 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-[#003366]" />
                  <h3 className="font-medium text-[#1E293B]">Compliance Frameworks</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.compliance_frameworks.length > 0 ? (
                    formData.compliance_frameworks.map((fw) => (
                      <span key={fw} className="px-2 py-1 bg-[#E2E8F0] text-[#64748B] text-xs rounded">
                        {fw.toUpperCase()}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#64748B] text-sm">None selected</span>
                  )}
                </div>
              </div>

              {/* Auditors */}
              <div className="p-4 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-[#003366]" />
                  <h3 className="font-medium text-[#1E293B]">Assigned Auditors</h3>
                </div>
                <div className="space-y-1">
                  {formData.auditor_emails.length > 0 ? (
                    formData.auditor_emails.map((email, index) => (
                      <div key={index} className="text-sm text-[#1E293B]">
                        {email}
                      </div>
                    ))
                  ) : (
                    <span className="text-[#64748B] text-sm">No auditors assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Scope */}
            <div className="p-4 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
              <div className="flex items-center gap-2 mb-3">
                <FileSearch className="w-5 h-5 text-[#003366]" />
                <h3 className="font-medium text-[#1E293B]">Audit Scope</h3>
              </div>
              <p className="text-sm text-[#64748B]">{formData.scope || "No scope defined"}</p>
            </div>

            {/* Description */}
            <div className="p-4 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-[#003366]" />
                <h3 className="font-medium text-[#1E293B]">Description</h3>
              </div>
              <p className="text-sm text-[#64748B]">{formData.description || "No description provided"}</p>
            </div>

            {/* Final Confirmation */}
            <div className="p-4 border-2 border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#059669]" />
                <h3 className="font-medium text-[#1E293B]">Ready to create your enhanced financial audit</h3>
              </div>
              <p className="text-sm text-[#64748B] mt-2 ml-8">
                Review all the information above carefully before submitting. You can go back to make changes if needed.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8 border-t border-[#E2E8F0] mt-8">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors ${
              currentStep === 1
                ? "text-[#94A3B8] cursor-not-allowed"
                : "text-[#64748B] hover:text-[#003366] hover:bg-[#F1F5F9]"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={handleNextStep}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-[#003366] to-[#004D99] text-white rounded-lg hover:from-[#002244] hover:to-[#003366] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Audit...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Enhanced Audit
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FinancialAuditCreationWizard