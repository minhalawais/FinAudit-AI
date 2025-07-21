import { Building2, Stethoscope, Scale, Zap, Banknote, Factory, Plane, ShoppingCart, ShieldCheck, ArrowRight, CircleChevronRight } from "lucide-react"
import { useState } from "react"

const UseCases = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const industryGroups = [
    [
      {
        name: "Enterprise Finance",
        description: "Digitize financial audits with AI-powered document processing and automated compliance workflows.",
        icon: Banknote,
        color: "bg-gradient-to-br from-navy-blue to-[#004D99]",
        gradient: "from-navy-blue/10 to-navy-blue/5",
        features: [
          "Automated financial document indexing",
          "AI-powered anomaly detection",
          "Real-time audit trail generation"
        ],
        stat: "70% faster audit completion"
      },
      {
        name: "Healthcare Providers",
        description: "Secure document management with automated compliance for financial and operational audits.",
        icon: Stethoscope,
        color: "bg-gradient-to-br from-success-green to-[#047857]",
        gradient: "from-success-green/10 to-success-green/5",
        features: [
          "Audit-ready financial documentation",
          "Automated expense report verification",
          "Cross-department audit coordination"
        ],
        stat: "60% reduction in audit prep time"
      },
      {
        name: "Legal & Accounting",
        description: "Centralized audit documentation with version control and secure client collaboration.",
        icon: Scale,
        color: "bg-gradient-to-br from-soft-gold to-[#D97706]",
        gradient: "from-soft-gold/10 to-soft-gold/5",
        features: [
          "Automated financial document review",
          "Audit checklist digitization",
          "Secure client portal integration"
        ],
        stat: "80% less paper documentation"
      },
      {
        name: "Manufacturing",
        description: "End-to-end digital audit workflows for financial and operational compliance.",
        icon: Factory,
        color: "bg-gradient-to-br from-[#DC2626] to-[#B91C1C]",
        gradient: "from-[#DC2626]/10 to-[#DC2626]/5",
        features: [
          "Automated inventory audit trails",
          "Supplier financial documentation",
          "Regulatory compliance reporting"
        ],
        stat: "50% faster audit responses"
      }
    ],
    [
      {
        name: "Government",
        description: "Transparent financial audit management with secure document retention policies.",
        icon: Building2,
        color: "bg-gradient-to-br from-[#7C3AED] to-[#5B21B6]",
        gradient: "from-[#7C3AED]/10 to-[#7C3AED]/5",
        features: [
          "Automated FOIA financial document processing",
          "Public fund audit documentation",
          "Chain-of-custody tracking"
        ],
        stat: "65% faster audit resolution"
      },
      {
        name: "Retail & E-Commerce",
        description: "Automated financial documentation for inventory audits and revenue verification.",
        icon: ShoppingCart,
        color: "bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]",
        gradient: "from-[#2563EB]/10 to-[#2563EB]/5",
        features: [
          "Automated sales audit documentation",
          "Digital inventory audit trails",
          "Financial discrepancy alerts"
        ],
        stat: "45% faster financial close"
      },
      {
        name: "Aviation & Logistics",
        description: "Digital audit trails for financial operations and maintenance documentation.",
        icon: Plane,
        color: "bg-gradient-to-br from-[#059669] to-[#047857]",
        gradient: "from-[#059669]/10 to-[#059669]/5",
        features: [
          "Automated expense documentation",
          "Maintenance financial records",
          "Audit-ready financial packages"
        ],
        stat: "55% faster audit preparation"
      },
      {
        name: "Insurance & Banking",
        description: "AI-powered financial document analysis and automated compliance reporting.",
        icon: ShieldCheck,
        color: "bg-gradient-to-br from-[#9333EA] to-[#6B21A8]",
        gradient: "from-[#9333EA]/10 to-[#9333EA]/5",
        features: [
          "Automated claims financial audit",
          "Regulatory documentation generation",
          "Fraud pattern detection"
        ],
        stat: "60% faster financial audits"
      }
    ]
  ];

  return (
    <section id="use-cases" className="bg-[#F8FAFC] h-screen flex items-center relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-navy-blue/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-soft-gold/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-radial from-success-green/5 to-transparent opacity-40 rounded-full blur-xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-8">
        <div className="mx-auto max-w-4xl text-center mb-8">
          <div className="inline-flex items-center bg-navy-blue/10 text-navy-blue text-sm font-medium px-5 py-2 rounded-full shadow-sm mb-4">
            <Zap className="mr-2 h-4 w-4 text-soft-gold animate-pulse" />
            <span className="tracking-wide font-semibold">INDUSTRY SOLUTIONS</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1E293B]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-navy-blue to-soft-gold">Universal</span> Financial Audit Digitalization
          </h2>
          <p className="mt-4 text-lg text-[#64748B] max-w-3xl mx-auto">
            Our document management and audit platform transforms financial compliance across all industries with AI-powered automation.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 bg-[#E2E8F0] rounded-lg">
            <button 
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 ${activeTab === 0 ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}
              onClick={() => setActiveTab(0)}
            >
              Corporate Sectors
            </button>
            <button 
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 ${activeTab === 1 ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}
              onClick={() => setActiveTab(1)}
            >
              Public & Financial Services
            </button>
          </div>
        </div>

        {/* Industries Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {industryGroups[activeTab].map((industry, index) => (
            <div
              key={index}
              className="relative group rounded-xl bg-white p-5 shadow-md transition-all duration-300 hover:shadow-lg border border-[#E2E8F0] hover:border-navy-blue/20 overflow-hidden"
            >
              {/* Background accent */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-3xl ${industry.gradient} opacity-40 transition-all duration-300 group-hover:opacity-60`}></div>
              
              <div className="relative z-10">
                <div className="flex items-start mb-4">
                  <div
                    className={`flex-shrink-0 rounded-lg p-3 ${industry.color} text-white transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-md mr-3`}
                  >
                    <industry.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-[#1E293B] group-hover:text-navy-blue transition-colors duration-300">
                    {industry.name}
                  </h3>
                </div>
                
                <p className="text-sm text-[#64748B] group-hover:text-[#334155] transition-colors duration-300 mb-4 line-clamp-2">
                  {industry.description}
                </p>

                {/* Simplified Feature List */}
                <div className="space-y-2 mb-3">
                  {industry.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="flex-shrink-0 mt-1.5 mr-2 h-1.5 w-1.5 rounded-full bg-soft-gold"></span>
                      <p className="text-xs text-[#1E293B] line-clamp-1">{feature}</p>
                    </div>
                  ))}
                </div>

                {/* Industry Stat with improved styling */}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs font-bold text-navy-blue bg-navy-blue/5 px-2.5 py-1 rounded-md">
                    {industry.stat}
                  </span>
                  <CircleChevronRight className="h-5 w-5 text-soft-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center bg-white rounded-xl shadow-md p-4 border border-[#E2E8F0] hover:shadow-lg transition-all duration-300">
            <div className="mr-4">
              <h3 className="text-base font-bold text-[#1E293B]">Customized for Any Industry</h3>
              <p className="text-xs text-[#64748B]">Every business needs financial audit documentation</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-navy-blue to-[#004D99] hover:from-[#004D99] hover:to-navy-blue text-white rounded-lg text-sm font-medium transition-all duration-300 flex items-center whitespace-nowrap">
              See Industry Solutions
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Visual indicator for pagination */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex space-x-2">
            <div 
              className={`h-2 w-8 rounded-full transition-all duration-300 ${activeTab === 0 ? 'bg-navy-blue' : 'bg-[#E2E8F0]'}`}
              onClick={() => setActiveTab(0)}
            ></div>
            <div 
              className={`h-2 w-8 rounded-full transition-all duration-300 ${activeTab === 1 ? 'bg-navy-blue' : 'bg-[#E2E8F0]'}`}
              onClick={() => setActiveTab(1)}
            ></div>
          </div>
        </div>
      </div>

      {/* Custom grid background pattern */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(0,51,102,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,51,102,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </section>
  )
}

export default UseCases