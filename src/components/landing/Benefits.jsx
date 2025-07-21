import { CheckCircle, ArrowRight, ChevronRight, Shield, Clock, Award } from "lucide-react"

const Benefits = () => {
  const benefits = [
    "Reduce operational costs by 30% with automated workflows",
    "Eliminate compliance risks with immutable audit trails",
    "Enable remote collaboration with real-time document editing",
    "Gain actionable insights with intelligent analytics",
    "Streamline audit processes with AI-powered risk assessment",
    "Enhance document security with role-based access control",
  ]

  const tags = [
    {
      text: "SOC 2 Type II compliant",
      icon: Shield
    },
    {
      text: "256-bit encryption",
      icon: Shield
    },
    {
      text: "99.9% uptime SLA",
      icon: Clock
    },
    {
      text: "24/7 customer support",
      icon: Award
    }
  ]

  return (
    <section id="benefits" className="bg-white flex items-center relative overflow-hidden">
      {/* Enhanced Decorative Elements */}
      <div className="absolute -left-20 top-20 w-96 h-96 rounded-full bg-navy-blue/5 blur-3xl opacity-70"></div>
      <div className="absolute -right-20 bottom-20 w-80 h-80 rounded-full bg-soft-gold/5 blur-3xl opacity-80"></div>
      <div className="absolute left-1/3 bottom-0 w-64 h-64 rounded-full bg-success-green/5 blur-2xl opacity-60"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-10 mb-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="inline-flex items-center bg-navy-blue/10 text-navy-blue text-sm font-semibold px-5 py-2 rounded-full mb-2 shadow-sm">
                  <span className="mr-2">✦</span>
                  WHY CHOOSE FINAUDIT AI
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#1E293B]">
                  Transform Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-navy-blue to-soft-gold">Financial Audit Process</span>
                </h2>
                <p className="text-lg text-[#64748B] max-w-xl">
                  Our AI-driven solution reduces manual work by 70% while ensuring 100% compliance with regulatory standards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start bg-[#F8FAFC] p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white border border-transparent hover:border-[#E2E8F0] group"
                  >
                    <div className="bg-success-green/10 p-1.5 rounded-full mr-3 flex-shrink-0 group-hover:bg-success-green/20 transition-colors duration-300">
                      <CheckCircle className="h-5 w-5 text-success-green group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <p className="text-[#1E293B] text-sm sm:text-base group-hover:text-navy-blue transition-colors duration-300 font-medium">
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {tags.map((tag, index) => (
                  <div 
                    key={index}
                    className="flex items-center rounded-lg bg-[#F1F5F9] px-4 py-2 text-sm font-medium text-[#1E293B] border border-[#E2E8F0] hover:bg-white transition-colors duration-300 cursor-pointer group"
                  >
                    <tag.icon className="h-4 w-4 mr-2 text-navy-blue opacity-70 group-hover:opacity-100" />
                    {tag.text}
                  </div>
                ))}
              </div>

              <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-navy-blue to-[#004D99] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 mt-2">
                Schedule a Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              {/* Main Image Container with Enhanced Visual Elements */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003366] to-[#004D99] p-3 shadow-xl">
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                
                <img
                  src="/benefits.png"
                  alt="FinAudit AI Benefits Dashboard"
                  className="w-full rounded-xl object-cover"
                />

                {/* Enhanced Floating Elements */}
                <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-soft-gold to-[#D97706] flex items-center justify-center text-white font-bold text-lg shadow-inner">
                      70%
                    </div>
                    <span className="ml-3 text-white font-medium">Less Manual Work</span>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-success-green to-[#047857] flex items-center justify-center text-white font-bold text-lg shadow-inner">
                      100%
                    </div>
                    <span className="ml-3 text-white font-medium">Compliance</span>
                  </div>
                </div>
                
                {/* Add interface elements to make it look like a real dashboard */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/5 backdrop-blur-sm w-3/4 h-32 rounded-lg border border-white/10 opacity-50"></div>
              </div>

              {/* Enhanced Decorative Elements */}
              <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-2xl bg-gradient-to-br from-soft-gold to-[#D97706] shadow-lg transform rotate-12"></div>
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-2xl bg-gradient-to-br from-success-green to-[#047857] shadow-lg transform -rotate-12"></div>
              
              {/* Additional visual accents */}
              <div className="absolute top-1/2 -right-4 h-8 w-8 rounded-full bg-navy-blue/20 backdrop-blur-sm"></div>
              <div className="absolute bottom-1/4 -left-4 h-6 w-6 rounded-full bg-soft-gold/30 backdrop-blur-sm"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom grid background pattern (defined inline for convenience) */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </section>
  )
}

export default Benefits