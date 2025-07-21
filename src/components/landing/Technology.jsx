import { Cpu, BrainCircuit, FileSearch, Cloud, Shield, Database, GitBranch, Lock } from "lucide-react"

const Technology = () => {
  const technologies = [
    {
      category: "AI/ML Frameworks",
      items: ["TensorFlow", "PyTorch", "Scikit-learn", "Hugging Face"],
      icon: BrainCircuit,
      color: "bg-gradient-to-br from-navy-blue to-[#004D99]",
      gradient: "from-navy-blue/10 to-navy-blue/5",
      description: "State-of-the-art models for document analysis and financial pattern detection"
    },
    {
      category: "Natural Language Processing",
      items: ["SpaCy", "BERT", "GPT-3.5", "LangChain"],
      icon: FileSearch,
      color: "bg-gradient-to-br from-soft-gold to-[#D97706]",
      gradient: "from-soft-gold/10 to-soft-gold/5",
      description: "Advanced text understanding for contract analysis and compliance monitoring"
    },
    {
      category: "Data Extraction",
      items: ["Tesseract OCR", "Amazon Textract", "Custom AI Models", "PDF.js"],
      icon: Cpu,
      color: "bg-gradient-to-br from-success-green to-[#047857]",
      gradient: "from-success-green/10 to-success-green/5",
      description: "High-accuracy data capture from documents, emails, and financial systems"
    },
    {
      category: "Cloud Infrastructure",
      items: ["AWS ECS", "Elasticsearch", "PostgreSQL", "Redis"],
      icon: Cloud,
      color: "bg-gradient-to-br from-[#7C3AED] to-[#5B21B6]",
      gradient: "from-[#7C3AED]/10 to-[#7C3AED]/5",
      description: "Enterprise-grade infrastructure with 99.99% uptime SLA"
    },
    {
      category: "Security & Compliance",
      items: ["256-bit Encryption", "SOC 2 Type II", "GDPR Tools", "HIPAA Controls"],
      icon: Shield,
      color: "bg-gradient-to-br from-[#DC2626] to-[#B91C1C]",
      gradient: "from-[#DC2626]/10 to-[#DC2626]/5",
      description: "Military-grade security protocols for sensitive financial data"
    },
    {
      category: "Development Stack",
      items: ["React.js", "Python/Django", "Docker", "Kubernetes"],
      icon: GitBranch,
      color: "bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]",
      gradient: "from-[#2563EB]/10 to-[#2563EB]/5",
      description: "Modern development practices for scalable, maintainable solutions"
    }
  ]

  return (
    <section id="technology" className="h-screen flex flex-col justify-center bg-[#F8FAFC] relative overflow-hidden py-8">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px]"></div>
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-navy-blue/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-soft-gold/5 to-transparent rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl text-center mb-8">
          <span className="inline-flex items-center bg-navy-blue/10 text-navy-blue text-sm font-medium px-3 py-1 rounded-full mb-4">
            <Cpu className="mr-2 h-3 w-3 text-soft-gold" />
            TECHNOLOGY STACK
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-[#1E293B]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-navy-blue to-soft-gold">Enterprise-Grade</span> Technical Foundation
          </h2>
          <p className="mt-3 text-lg text-[#64748B] max-w-2xl mx-auto">
            FinAudit AI combines cutting-edge AI with bank-grade security infrastructure.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {technologies.map((tech, index) => (
            <div
              key={index}
              className="relative group rounded-xl bg-white p-4 shadow-md transition-all duration-300 hover:shadow-xl border border-[#E2E8F0] hover:border-navy-blue/20 overflow-hidden"
            >
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
              
              <div className="flex items-start space-x-4 relative z-10">
                <div
                  className={`flex-shrink-0 inline-flex rounded-lg p-3 ${tech.color} text-white transform transition-all duration-300 group-hover:scale-110`}
                >
                  <tech.icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-base font-bold text-[#1E293B] group-hover:text-navy-blue transition-colors duration-300">
                    {tech.category}
                  </h3>
                  <p className="text-sm text-[#64748B] group-hover:text-[#334155] transition-colors duration-300 mb-2 line-clamp-2">
                    {tech.description}
                  </p>

                  {/* Technology List */}
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${tech.gradient} border border-[#E2E8F0]`}>
                    <div className="flex flex-wrap gap-2">
                      {tech.items.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-white/80 text-xs font-medium text-[#1E293B] border border-[#E2E8F0]">
                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-soft-gold"></span>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Security Badges - Compact Version */}
        <div className="mt-8 bg-gradient-to-r from-navy-blue/5 to-success-green/5 rounded-xl p-4 border border-[#E2E8F0]">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-3 md:mb-0 md:mr-4">
              <h3 className="text-lg font-bold text-[#1E293B]">Enterprise-Grade Security</h3>
              <p className="text-xs text-[#64748B]">
                Meeting the highest security standards for financial data protection
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] flex items-center justify-center shadow-sm">
                <Lock className="h-4 w-4 text-navy-blue mr-1" />
                <span className="text-xs font-medium">256-bit AES</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] flex items-center justify-center shadow-sm">
                <Database className="h-4 w-4 text-navy-blue mr-1" />
                <span className="text-xs font-medium">SOC 2 Type II</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] flex items-center justify-center shadow-sm">
                <Shield className="h-4 w-4 text-navy-blue mr-1" />
                <span className="text-xs font-medium">GDPR Ready</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] flex items-center justify-center shadow-sm">
                <Cloud className="h-4 w-4 text-navy-blue mr-1" />
                <span className="text-xs font-medium">HIPAA Controls</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Partners Marquee */}
      <div className="mt-auto pt-4 overflow-hidden">
        <div className="flex justify-center items-center">
          <div className="text-xs font-medium text-[#64748B] mr-4">Trusted Technology Partners</div>
          <div className="flex space-x-8 items-center">
            {Array(6).fill().map((_, i) => (
              <div key={i} className="flex items-center justify-center h-12 w-20 bg-white rounded-lg border border-[#E2E8F0] shadow-sm">
                <img 
                  src={`http://127.0.0.1:8000/api/placeholder/80/40`} 
                  alt={`Tech Partner ${i+1}`}
                  className="max-h-6 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Technology