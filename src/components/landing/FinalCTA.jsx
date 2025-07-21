import { ArrowRight } from "lucide-react"

const FinalCTA = () => {
  return (
    <section className="bg-white py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#003366] to-[#004D99] p-12 shadow-xl relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-soft-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-success-green/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:16px_16px]" />

          <div className="mx-auto max-w-3xl text-center relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Document & Audit Workflows?
            </h2>
            <p className="mt-4 text-xl text-white/80">
              Join leading organizations using FinAudit AI to save time and reduce compliance risks.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button className="bg-soft-gold hover:bg-[#D97706] text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center font-medium">
                Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button className="border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 font-medium">
                Schedule Consultation
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white border border-white/20">
                Start your free 14-day trial
              </div>
              <div className="rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white border border-white/20">
                No credit card required
              </div>
              <div className="rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white border border-white/20">
                Implementation in under 48 hours
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA
