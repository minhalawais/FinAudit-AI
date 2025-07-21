"use client"

import { useState } from "react"
import { ArrowRight, FileText, Shield, BarChart2, Zap, Check, Award, Sparkles, Lock, BrainCircuit } from "lucide-react"

const Hero = () => {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log("Email submitted:", email)
    setIsSubmitted(true)
    setEmail("")
    // Reset submission status after 3 seconds
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen pt-20 md:pt-24 flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#001f3f] via-[#003366] to-[#004080]"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-1/4 -left-10 w-96 h-96 rounded-full bg-gradient-to-r from-soft-gold/10 to-success-green/10 blur-[120px] animate-float"></div>
      <div className="absolute bottom-1/3 -right-10 w-96 h-96 rounded-full bg-gradient-to-r from-navy-blue/15 to-soft-gold/10 blur-[150px] animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-[#004080]/10 to-[#001f3f]/10 blur-[180px] animate-pulse"></div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col mb-10">
        <div className="mx-auto max-w-7xl flex flex-col justify-center flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column: Text Content */}
            <div className="flex flex-col space-y-6">
              {/* Trust Badge */}
              <div className="flex animate-fadeIn">
                <div className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full border border-white/20">
                  <Award className="mr-2 h-4 w-4 text-soft-gold" />
                  Pakistan's First AI-Powered Audit Platform
                </div>
              </div>

              {/* Main Heading */}
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl animate-fadeInUp">
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white to-soft-gold/80">
                    Revolutionizing Financial Audits
                  </span>
                  <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-soft-gold/80 to-white">
                    with Intelligent Automation
                  </span>
                </h1>

                <p className="mt-6 text-xl text-white/90 max-w-xl animate-fadeInUp animation-delay-200">
                  FinAudit AI is Pakistan's pioneering audit intelligence platform that transforms manual processes into 
                  strategic advantages with AI-powered document analysis and real-time compliance insights.
                </p>
              </div>

              {/* Key Benefits */}
              <div className="space-y-3 animate-fadeInUp animation-delay-300">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-soft-gold mr-2" />
                  <span className="text-white">Cut audit preparation time by 70% with AI document processing</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-soft-gold mr-2" />
                  <span className="text-white">Eliminate compliance risks with automated GDPR/HIPAA/SOX controls</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-soft-gold mr-2" />
                  <span className="text-white">Gain strategic insights beyond basic compliance checks</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 mt-6 animate-fadeInUp animation-delay-400">
                <button className="relative group bg-soft-gold hover:bg-[#D97706] text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center font-semibold">
                  <span className="relative z-10 flex items-center">
                    Request Demo <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-soft-gold to-[#D97706] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </button>

                <button className="relative group border-2 border-white text-white px-6 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 font-semibold">
                  <span className="relative z-10 flex items-center">See How It Works</span>
                  <span className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </button>
              </div>
            </div>

            {/* Right Column: Dashboard Preview */}
            <div className="relative order-first lg:order-last mx-auto max-w-lg lg:max-w-full animate-fadeInUp animation-delay-500">
              <div className="overflow-hidden rounded-2xl bg-white/5 p-1 shadow-2xl backdrop-blur-sm border border-white/20 transform perspective-1000 hover:rotate-y-3 transition-transform duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-blue/70 via-transparent to-transparent z-10 pointer-events-none"></div>
                  <img
                    src="/dashboard.png"
                    alt="FinAudit AI Dashboard showing real-time audit insights and document intelligence"
                    className="w-full rounded-xl object-cover shadow-lg"
                    loading="eager"
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                      <div className="h-3 w-3 rounded-full bg-error-red"></div>
                      <div className="h-3 w-3 rounded-full bg-warning-orange"></div>
                      <div className="h-3 w-3 rounded-full bg-success-green"></div>
                      <span className="ml-2 text-xs text-white">Live Risk Dashboard</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unique Value Proposition Section */}
          <div className="mt-16 animate-fadeInUp animation-delay-600">
            <h3 className="text-2xl font-bold text-white text-center mb-8">Why FinAudit AI Stands Out</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mr-4">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">AI That Understands</h3>
                </div>
                <p className="text-white/80">
                  Our proprietary NLP models are specifically trained on financial and legal documents for unparalleled accuracy in the Pakistani context.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mr-4">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Local Compliance Built-In</h3>
                </div>
                <p className="text-white/80">
                  Pre-configured with all SECP, SBP, and FBR regulations so you're always audit-ready for Pakistani authorities.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 mr-4">
                    <BrainCircuit className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Continuous Learning</h3>
                </div>
                <p className="text-white/80">
                  Our AI adapts to your business and regulatory changes, getting smarter with each audit cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero