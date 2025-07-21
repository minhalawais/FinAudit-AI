import { 
  FileSearch, ShieldCheck, BarChart2, Users, FileText, Layers, 
  FileLock2, FileStack, ArrowRight, BrainCircuit, GitMerge, 
  FileClock, FileSpreadsheet, FilePieChart, FileSignature, FileBadge 
} from "lucide-react"

const ProductShowcase = () => {
  const showcaseItems = [
    {
      title: "AI-Powered Document Intelligence",
      description: "Automatically classify, tag and extract data from documents with 95%+ accuracy using our advanced OCR and NLP technology.",
      image: "/ai-powered.png",
      icon: FileSearch,
      color: "bg-gradient-to-br from-navy-blue to-[#004D99]",
      features: [
        "90% faster document retrieval",
        "Automatic metadata extraction",
        "Smart document classification"
      ],
      stat: "95% accuracy"
    },
    {
      title: "AI Financial Analysis Engine",
      description: "Deep learning models analyze financial documents to detect anomalies, patterns and risks human auditors might miss.",
      image: "/ai-analysis.png",
      icon: BrainCircuit,
      color: "bg-gradient-to-br from-purple-600 to-fuchsia-600",
      features: [
        "Automated risk scoring",
        "Anomaly detection algorithms",
        "Predictive analytics",
        "Trend identification"
      ],
      stat: "40% more findings"
    },
    {
      title: "Enterprise Version Control",
      description: "Complete document history with blockchain verification and granular change tracking for full auditability.",
      image: "/version-control.png",
      icon: GitMerge,
      color: "bg-gradient-to-br from-amber-600 to-orange-600",
      features: [
        "Blockchain-verified history",
        "Side-by-side diff comparisons",
        "Rollback to any version",
        "Change attribution"
      ],
      stat: "Zero conflicts"
    },
    {
      title: "Automated Audit Workflows",
      description: "End-to-end digital audit processes from planning to reporting with built-in quality controls.",
      image: "/audit-workflows.png",
      icon: Layers,
      color: "bg-gradient-to-br from-navy-blue to-[#004D99]",
      features: [
        "Customizable audit templates",
        "Automated evidence collection",
        "Real-time progress tracking",
        "Built-in quality gates"
      ],
      stat: "50% faster audits"
    },
    {
      title: "Continuous Transaction Monitoring",
      description: "Real-time analysis of financial transactions with automated alerts for suspicious activity.",
      image: "/transaction-monitoring.png",
      icon: FileSpreadsheet,
      color: "bg-gradient-to-br from-emerald-600 to-teal-600",
      features: [
        "Automated sampling",
        "Pattern recognition",
        "Custom threshold alerts",
        "Regulatory reporting"
      ],
      stat: "30% more findings"
    },
    {
      title: "Audit Reporting Suite",
      description: "Automated generation of professional audit reports with findings, recommendations and action plans.",
      image: "/audit-reporting.png",
      icon: FileSignature,
      color: "bg-gradient-to-br from-rose-600 to-pink-600",
      features: [
        "Pre-built report templates",
        "AI-assisted writing",
        "Visual data presentation",
        "Stakeholder dashboards"
      ],
      stat: "90% faster reporting"
    },
    {
      title: "Compliance Certification Manager",
      description: "Automated preparation and maintenance of compliance documentation for regulators.",
      image: "/compliance-manager.png",
      icon: FileBadge,
      color: "bg-gradient-to-br from-violet-600 to-blue-600",
      features: [
        "Regulatory change tracking",
        "Auto-generated filings",
        "Evidence linking",
        "Audit-ready documentation"
      ],
      stat: "100% audit-ready"
    },
    {
      title: "Military-Grade Security Controls",
      description: "Bank-level security with end-to-end encryption, blockchain verification and granular access controls.",
      image: "/security-controls.png",
      icon: ShieldCheck,
      color: "bg-gradient-to-br from-success-green to-[#047857]",
      features: [
        "256-bit AES encryption",
        "Blockchain audit trails",
        "SOC 2 Type II certified",
        "Granular permissions"
      ],
      stat: "100% compliance"
    }
  ]

  return (
    <section id="product-showcase" className="bg-gradient-to-b from-[#F8FAFC] to-white py-32 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
      <div className="absolute top-0 left-0 w-2/3 h-1/2 bg-gradient-to-br from-navy-blue/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-2/3 h-1/2 bg-gradient-to-tl from-soft-gold/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-success-green/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-[#7C3AED]/10 rounded-full blur-2xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Enhanced Header Section */}
        <div className="mx-auto max-w-4xl text-center mb-24">
          <div className="inline-flex items-center bg-navy-blue/10 text-navy-blue text-sm font-medium px-5 py-2 rounded-full mb-6 shadow-sm animate-fadeIn">
            <FileText className="mr-2 h-4 w-4 text-soft-gold" />
            <span className="relative inline-block">
              PLATFORM SHOWCASE
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-soft-gold to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1E293B] mb-6 relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-navy-blue to-soft-gold animate-gradientFlow">
              Comprehensive
            </span> Audit & Document Solutions
            <div className="absolute -bottom-3 left-0 w-full h-1 bg-gradient-to-r from-navy-blue/70 to-soft-gold/70 rounded-full"></div>
          </h2>
          <p className="mt-8 text-xl text-[#64748B] max-w-3xl mx-auto leading-relaxed">
            FinAudit AI combines cutting-edge document management with financial audit automation to transform your compliance workflows.
          </p>
        </div>

        {/* Scrollable Showcase Container */}
        <div className="overflow-y-auto h-[600px] pr-4">
          {/* Enhanced Showcase Items */}
          <div className="space-y-40">
            {showcaseItems.map((item, index) => (
              <div
                key={index}
                className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-16 relative`}
              >
                {/* Connector Lines between showcase items */}
                {index < showcaseItems.length - 1 && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-20 h-20 w-1 bg-gradient-to-b from-navy-blue/30 to-transparent hidden lg:block"></div>
                )}
                
                {/* Image Column with Enhanced Design */}
                <div className="lg:w-1/2 relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-navy-blue/20 via-soft-gold/20 to-success-green/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-tiltSlow"></div>
                  
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl transform transition-all duration-500 group-hover:scale-[1.02] group-hover:-rotate-1">
                    {/* Floating UI Elements */}
                    <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full bg-soft-gold/10 border border-soft-gold/20 transform rotate-12 animate-float"></div>
                    <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-navy-blue/10 border border-navy-blue/20 transform -rotate-12 animate-float animation-delay-500"></div>
                    
                    {/* Image Container with Improved Styling */}
                    <div className="relative z-10 overflow-hidden rounded-2xl bg-gradient-to-br from-[#003366] to-[#004D99] p-2">
                      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
                      
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full rounded-xl object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      
                      {/* Overlay Icon */}
                      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg">
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    {/* Enhanced Floating Stat Badge */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl px-6 py-3 border border-[#E2E8F0] animate-float">
                      <div className="flex items-center">
                        <div className="mr-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">RESULTS:</div>
                        <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-navy-blue to-soft-gold">{item.stat}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Column with Enhanced Design */}
                <div className="lg:w-1/2">
                  <div className="relative group h-full bg-white/70 backdrop-blur-sm rounded-2xl p-10 shadow-xl border border-[#E2E8F0] hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    {/* Enhanced Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F8FAFC] to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
                    <div className="absolute inset-0 bg-grid-pattern opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10">
                      {/* Enhanced Icon Design */}
                      <div
                        className={`mb-8 mr-4 inline-flex rounded-2xl p-5 ${item.color} text-white shadow-lg transform transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:rotate-3`}
                      >
                        <item.icon className="h-8 w-8" />
                      </div>
                      
                      {/* Enhanced Title Design */}
                      <h3 className="mb-5 text-3xl font-bold text-[#1E293B] group-hover:text-navy-blue transition-colors duration-300 relative inline-block">
                        {item.title}
                        <div className="absolute -bottom-1 left-0 w-1/2 h-1 bg-gradient-to-r from-soft-gold to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-full"></div>
                      </h3>
                      
                      {/* Enhanced Description Design */}
                      <p className="text-lg text-[#64748B] group-hover:text-[#334155] transition-colors duration-300 mb-8 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Enhanced Features List */}
                      <div className="space-y-4">
                        {item.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] hover:border-navy-blue/30 hover:bg-gradient-to-r hover:from-white hover:to-[#F1F5F9] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md group/feature"
                          >
                            <div className={`flex-shrink-0 mr-4 h-3 w-3 rounded-full ${item.color.replace('bg-gradient-to-br', '')} group-hover/feature:animate-pulse`}></div>
                            <span className="text-[#1E293B] font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Learn More Link */}
                      <div className="mt-8 text-right">
                        <a href="#" className="inline-flex items-center text-navy-blue font-medium hover:text-soft-gold transition-colors duration-300 group/link">
                          Learn more
                          <ArrowRight className="ml-2 h-4 w-4 transform group-hover/link:translate-x-1 transition-transform duration-300" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="mt-20 text-center">
          <div className="relative mx-auto max-w-4xl">
            {/* Background decoration for CTA */}
            <div className="absolute -inset-4 bg-gradient-to-r from-navy-blue/30 via-soft-gold/30 to-success-green/30 rounded-3xl blur-lg opacity-50 animate-pulse-slow"></div>
            
            <div className="relative bg-white rounded-2xl shadow-2xl p-12 border border-[#E2E8F0] overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-navy-blue/5 rounded-br-full"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-soft-gold/5 rounded-tl-full"></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="text-left">
                  <h3 className="text-3xl font-bold text-[#1E293B] mb-4">Ready to see FinAudit AI in action?</h3>
                  <p className="text-[#64748B] text-lg">Schedule a personalized demo with our product experts.</p>
                </div>
                <button className="px-8 py-4 bg-gradient-to-br from-navy-blue to-[#004D99] text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center whitespace-nowrap group">
                  Request Live Demo
                  <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animation Styles */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(30, 41, 59, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(30, 41, 59, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        @keyframes float {
          0% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0); }
        }
        
        @keyframes pulse-slow {
          0% { opacity: 0.4; }
          50% { opacity: 0.7; }
          100% { opacity: 0.4; }
        }
        
        @keyframes tiltSlow {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(1deg); }
          75% { transform: rotate(-1deg); }
          100% { transform: rotate(0deg); }
        }
        
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-tiltSlow {
          animation: tiltSlow 8s ease-in-out infinite;
        }
        
        .animate-gradientFlow {
          background-size: 200% 200%;
          animation: gradientFlow 3s ease infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }
        
        .animation-delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </section>
  )
}

export default ProductShowcase