import { Check, X, Zap, ChevronRight, Award, Shield, BarChart2, FileText, Users } from "lucide-react"

const Comparison = () => {
  const features = [
    {
      name: "AI-Powered Document Intelligence",
      icon: FileText,
      description: "Automated classification, tagging and data extraction"
    },
    {
      name: "Automated Audit Workflows", 
      icon: BarChart2,
      description: "End-to-end digital audit processes with smart automation"
    },
    {
      name: "Real-Time Collaboration",
      icon: Users,
      description: "Simultaneous document editing and commenting"
    },
    {
      name: "Military-Grade Security",
      icon: Shield,
      description: "256-bit encryption, SOC 2 Type II certified"
    },
    {
      name: "Compliance Certifications",
      icon: Award,
      description: "GDPR, HIPAA, SOX, PCI DSS ready"
    },
    {
      name: "Blockchain Audit Trails",
      icon: FileText,
      description: "Immutable record of all document activities"
    }
  ]

  const competitors = [
    {
      name: "FinAudit AI",
      tagline: "All-in-one AI platform for documents & audits",
      pricing: "Value-based pricing",
      features: [true, true, true, true, true, true],
      highlight: true
    },
    {
      name: "Traditional DMS",
      tagline: "Basic document storage with limited features",
      pricing: "$15-30/user/month",
      features: [false, false, true, true, false, true],
      highlight: false
    },
    {
      name: "Generic Cloud Storage",
      tagline: "Simple file sharing with no audit capabilities",
      pricing: "$5-10/user/month", 
      features: [false, false, true, false, false, false],
      highlight: false
    },
    {
      name: "Legacy Audit Software",
      tagline: "Complex tools with steep learning curve",
      pricing: "$50+/user/month",
      features: [false, true, false, true, true, false],
      highlight: false
    }
  ]

  return (
    <section id="comparison" className="bg-white py-10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-[#E2E8F0]/[0.02] bg-[length:40px_40px]"></div>
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-navy-blue/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-soft-gold/5 to-transparent rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center bg-navy-blue/10 text-navy-blue text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Zap className="mr-2 h-4 w-4 text-soft-gold" />
            WHY CHOOSE FINAUDIT AI
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-[#1E293B] sm:text-5xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-navy-blue to-soft-gold">Superior</span> to Traditional Solutions
          </h2>
          <p className="mt-6 text-xl text-[#64748B] max-w-3xl mx-auto">
            FinAudit AI combines the best of document management and audit automation in one powerful platform.
          </p>
        </div>

        <div className="mt-16" data-aos="fade-up">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-[#E2E8F0]">
            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr>
                    <th className="w-1/3 px-6 py-5 text-left text-sm font-semibold text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      Key Features
                    </th>
                    {competitors.map((competitor, index) => (
                      <th
                        key={index}
                        className={`px-6 py-5 text-center text-sm font-semibold ${
                          competitor.highlight
                            ? "bg-gradient-to-b from-navy-blue to-[#004D99] text-white"
                            : "bg-[#F8FAFC] text-[#64748B]"
                        } border-b border-[#E2E8F0]`}
                      >
                        <div className="flex flex-col items-center">
                          <div className={`text-lg font-bold ${competitor.highlight ? "text-white" : "text-[#1E293B]"}`}>
                            {competitor.name}
                          </div>
                          <div className="text-xs mt-1">{competitor.tagline}</div>
                          <div className={`text-xs mt-2 px-3 py-1 rounded-full ${
                            competitor.highlight 
                              ? "bg-white/20 text-white" 
                              : "bg-[#E2E8F0] text-[#64748B]"
                          }`}>
                            {competitor.pricing}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, featureIndex) => (
                    <tr key={featureIndex} className={featureIndex % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"}>
                      <td className="px-6 py-5 border-b border-[#E2E8F0]">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-4 ${
                            featureIndex % 2 === 0 
                              ? "bg-navy-blue/10 text-navy-blue" 
                              : "bg-soft-gold/10 text-soft-gold"
                          }`}>
                            <feature.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#1E293B]">{feature.name}</div>
                            <div className="text-xs text-[#64748B] mt-1">{feature.description}</div>
                          </div>
                        </div>
                      </td>
                      {competitors.map((competitor, competitorIndex) => (
                        <td
                          key={competitorIndex}
                          className={`px-6 py-5 text-center border-b border-[#E2E8F0] ${
                            competitor.highlight ? "bg-navy-blue/5" : ""
                          }`}
                        >
                          {competitor.features[featureIndex] ? (
                            <div className="flex justify-center">
                              <div className="bg-success-green/10 p-2 rounded-full">
                                <Check className="h-5 w-5 text-success-green" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <div className="bg-[#DC2626]/10 p-2 rounded-full">
                                <X className="h-5 w-5 text-[#DC2626]" />
                              </div>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-[#F8FAFC] px-6 py-4 border-t border-[#E2E8F0]">
              <div className="flex justify-between items-center">
                <div className="text-sm text-[#64748B]">
                  * Feature availability based on standard plans
                </div>
                <button className="flex items-center text-sm font-medium text-navy-blue hover:text-[#004D99]">
                  View detailed feature comparison <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Comparison