import { FileSearch, BrainCircuit, ShieldCheck, BarChart4, ArrowRight, Users, Zap, Layers, BookOpen, FileLock2, FileStack, FileBarChart2, Check, ChevronRight, Sparkles, FileText, FileInput, FileOutput, FileDigit, FileCheck, FileArchive, FileClock, FileKey, FilePieChart, FileSignature, FileSpreadsheet, FileBadge } from "lucide-react"
import { useState } from "react"

const Features = () => {
  const [activeTab, setActiveTab] = useState('document'); // 'document' or 'audit'

  const documentFeatures = [
    {
      title: "AI-Powered Document Capture",
      description: "Automatically scan, classify and organize documents with 99% accuracy",
      icon: FileDigit,
      color: "bg-gradient-to-br from-blue-600 to-indigo-600",
      stats: "90% faster document processing",
      highlight: "Eliminate manual data entry forever"
    },
    {
      title: "Military-Grade Security",
      description: "Bank-level encryption with blockchain-verified document trails",
      icon: FileKey,
      color: "bg-gradient-to-br from-emerald-600 to-teal-600",
      stats: "100% compliance guaranteed",
      highlight: "GDPR, HIPAA, SOX ready out-of-the-box"
    },
    {
      title: "Intelligent Search",
      description: "Find any document in seconds with natural language queries",
      icon: FileSearch,
      color: "bg-gradient-to-br from-purple-600 to-fuchsia-600",
      stats: "Search 1M docs in <1 second",
      highlight: "Understands what you mean, not just what you type"
    },
    {
      title: "Version Control Pro",
      description: "Complete document history with blockchain verification",
      icon: FileClock,
      color: "bg-gradient-to-br from-amber-600 to-orange-600",
      stats: "Zero version conflicts",
      highlight: "See exactly who changed what and when"
    },
    {
      title: "Smart Collaboration",
      description: "Real-time co-editing with granular permissions",
      icon: FileText,
      color: "bg-gradient-to-br from-rose-600 to-pink-600",
      stats: "50% better team productivity",
      highlight: "Work together seamlessly across locations"
    },
    {
      title: "Automated Workflows",
      description: "Create custom document approval processes",
      icon: FileOutput,
      color: "bg-gradient-to-br from-violet-600 to-blue-600",
      stats: "Reduce process time by 75%",
      highlight: "Documents route themselves automatically"
    },
  ]

  const auditFeatures = [
    {
      title: "Automated Audit Planning",
      description: "AI-driven risk assessment for optimal audit scope and focus",
      icon: FilePieChart,
      color: "bg-gradient-to-br from-navy-blue to-[#004D99]",
      stats: "40% better risk identification",
      highlight: "Never miss critical audit areas again"
    },
    {
      title: "Digital Evidence Collection",
      description: "Automated sampling and extraction from financial systems",
      icon: FileSpreadsheet,
      color: "bg-gradient-to-br from-soft-gold to-[#D97706]",
      stats: "80% faster evidence gathering",
      highlight: "Direct integration with major accounting software"
    },
    {
      title: "Continuous Monitoring",
      description: "Real-time anomaly detection in financial data",
      icon: FileBarChart2,
      color: "bg-gradient-to-br from-success-green to-[#047857]",
      stats: "Identify 30% more irregularities",
      highlight: "AI spots patterns humans can't see"
    },
    {
      title: "Audit Workflow Automation",
      description: "Guided processes from planning to reporting",
      icon: FileCheck,
      color: "bg-gradient-to-br from-purple-600 to-indigo-600",
      stats: "Reduce audit duration by 50%",
      highlight: "Standardized yet customizable workflows"
    },
    {
      title: "AI-Assisted Reporting",
      description: "Automated generation of audit findings and recommendations",
      icon: FileSignature,
      color: "bg-gradient-to-br from-rose-500 to-pink-500",
      stats: "90% faster report generation",
      highlight: "Professional reports at the click of a button"
    },
    {
      title: "Compliance Certification",
      description: "Automated preparation of compliance documentation",
      icon: FileBadge,
      color: "bg-gradient-to-br from-amber-500 to-orange-500",
      stats: "100% audit-ready documentation",
      highlight: "Always prepared for regulatory inspections"
    },
  ]

  const enterpriseFeatures = [
    {
      title: "Regulatory Compliance",
      description: "Pre-built templates for SECP, SBP, FBR, GDPR, HIPAA, SOX",
      icon: FileLock2,
      benefit: "Stay audit-ready 24/7"
    },
    {
      title: "Custom Reporting",
      description: "Tailored dashboards with your branding and KPIs",
      icon: FileBarChart2,
      benefit: "Show stakeholders exactly what matters"
    },
    {
      title: "API Integrations",
      description: "Connect with your existing financial systems",
      icon: Layers,
      benefit: "Works with your current tech stack"
    }
  ]

  return (
    <section id="features" className="bg-[#F8FAFC] py-20 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-navy-blue/5 to-transparent rounded-bl-full -mr-20 -mt-20 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tl from-soft-gold/10 to-transparent rounded-tr-full -ml-20 -mb-20 animate-pulse-slow animation-delay-1000"></div>
      <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full bg-gradient-to-r from-purple-300/20 to-transparent blur-xl animate-float"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center bg-white text-navy-blue text-sm font-medium px-4 py-2 rounded-full mb-4 shadow-md border border-navy-blue/10">
            <Sparkles className="mr-2 h-4 w-4 text-soft-gold animate-pulse" />
            <span className="font-semibold">PAKISTAN'S MOST INTELLIGENT AUDIT PLATFORM</span>
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-[#1E293B] sm:text-5xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-navy-blue to-soft-gold">Two Powerful Modules</span>, One Complete Solution
          </h2>
          <p className="mt-6 text-xl text-[#64748B] max-w-3xl mx-auto leading-relaxed">
            FinAudit AI combines cutting-edge document management with financial audit automation to transform your compliance workflows.
          </p>
        </div>

        {/* Feature Toggle */}
        <div className="flex justify-center mt-12">
          <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab('document')}
              className={`px-8 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'document' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-[#64748B] hover:text-navy-blue'}`}
            >
              <div className="flex items-center">
                <FileStack className="mr-2 h-4 w-4" />
                Document Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-8 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'audit' ? 'bg-gradient-to-r from-navy-blue to-[#004D99] text-white shadow-md' : 'text-[#64748B] hover:text-navy-blue'}`}
            >
              <div className="flex items-center">
                <FileBarChart2 className="mr-2 h-4 w-4" />
                Financial Audit Automation
              </div>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {(activeTab === 'document' ? documentFeatures : auditFeatures).map((feature, index) => (
            <div
              key={index}
              className="relative group rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl border border-[#E2E8F0] transition-all duration-300 hover:-translate-y-2 overflow-hidden"
            >
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-[#F1F5F9] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
              
              <div className="relative z-10">
                <div
                  className={`mb-5 inline-flex rounded-xl p-3 ${feature.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-[#1E293B] group-hover:text-navy-blue transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="mb-4 text-[#64748B] leading-relaxed group-hover:text-[#334155] transition-colors duration-300">
                  {feature.description}
                </p>
                <div className="mt-6 pt-4 border-t border-[#E2E8F0]/50">
                  <div className="flex items-center text-sm font-semibold text-soft-gold mb-2">
                    <Check className="mr-2 h-4 w-4" /> {feature.stats}
                  </div>
                  <p className="text-xs font-medium text-navy-blue/80 italic">
                    {feature.highlight}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Combined Value Proposition */}
        <div className="mt-20 bg-gradient-to-r from-navy-blue/5 to-blue-600/5 rounded-2xl p-8 md:p-10 border border-[#E2E8F0] shadow-inner overflow-hidden">
          <div className="relative max-w-5xl mx-auto">
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-navy-blue/10 to-transparent rounded-full blur-lg"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-navy-blue to-[#004D99] text-white shadow-lg mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold text-[#1E293B]">The Power of Integration</h3>
                <p className="mt-3 text-lg text-[#64748B] max-w-2xl mx-auto">
                  When document management and audit automation work together seamlessly
                </p>
              </div>
              
              <div className="grid gap-8 md:grid-cols-3">
                {enterpriseFeatures.map((feature, index) => (
                  <div 
                    key={index} 
                    className="bg-white/90 p-6 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-300 hover:border-navy-blue/30"
                  >
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-navy-blue/10 p-3 rounded-lg text-navy-blue mr-4">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <h4 className="text-lg font-bold text-[#1E293B]">{feature.title}</h4>
                    </div>
                    <p className="text-[#64748B] text-sm mb-3">{feature.description}</p>
                    <div className="text-xs font-medium text-soft-gold flex items-center">
                      <Zap className="h-3 w-3 mr-1" /> {feature.benefit}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <button className="inline-flex items-center px-8 py-3.5 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-navy-blue to-[#004D99] hover:from-[#004D99] hover:to-navy-blue transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl">
                  See Full Platform Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features