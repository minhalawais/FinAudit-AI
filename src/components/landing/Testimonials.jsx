import { Quote } from "lucide-react"

const Testimonials = () => {
  const testimonials = [
    {
      quote:
        "FinAudit AI has transformed our audit process, reducing preparation time by 40% and improving accuracy across the board.",
      author: "Sarah Johnson",
      title: "CFO, Financial Services Inc.",
      image: "https://placehold.co/80x80/003366/FFFFFF/png?text=SJ",
    },
    {
      quote:
        "The document management capabilities are exceptional. We can now find any document in seconds rather than hours.",
      author: "Michael Chen",
      title: "Head of Compliance, HealthTech Solutions",
      image: "https://placehold.co/80x80/003366/FFFFFF/png?text=MC",
    },
    {
      quote:
        "Implementation was seamless, and the ROI was evident within the first month. Highly recommended for any finance team.",
      author: "David Rodriguez",
      title: "Audit Director, Global Energy Corp",
      image: "https://placehold.co/80x80/003366/FFFFFF/png?text=DR",
    },
  ]

  return (
    <section id="testimonials" className="bg-white py-20 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute -left-20 top-20 w-40 h-40 rounded-full bg-navy-blue/5 blur-3xl"></div>
      <div className="absolute -right-20 bottom-20 w-60 h-60 rounded-full bg-soft-gold/5 blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block bg-navy-blue/10 text-navy-blue text-sm font-medium px-4 py-1 rounded-full mb-4">
            Customer Success Stories
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl">What Our Customers Say</h2>
          <p className="mt-4 text-lg text-[#64748B]">
            Join leading organizations using FinAudit AI to save time and reduce compliance risks.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative rounded-xl bg-[#F8FAFC] p-8 shadow-md transition-all duration-300 hover:shadow-xl border border-gray-100 group hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-navy-blue/10 to-transparent rounded-bl-full"></div>
              <Quote className="absolute right-6 top-6 h-8 w-8 text-navy-blue/10" />
              <p className="mb-8 text-[#1E293B] relative z-10">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <img
                  src={testimonial.image || "/placeholder.svg"}
                  alt={testimonial.author}
                  className="w-12 h-12 mr-4 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-300"
                />
                <div>
                  <p className="font-semibold text-[#1E293B] group-hover:text-navy-blue transition-colors duration-300">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-[#64748B]">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl bg-gradient-to-r from-[#003366] to-[#004D99] p-8 shadow-xl" data-aos="fade-up">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h3 className="text-xl font-bold text-white md:text-2xl">Case Study: Global Financial Services Firm</h3>
              <p className="mt-2 text-white/80">
                Achieved 65% reduction in audit preparation time and 90% faster document retrieval.
              </p>
            </div>
            <button className="rounded-lg bg-white px-6 py-3 font-medium text-navy-blue shadow-md transition-all duration-300 hover:bg-[#F1F5F9] hover:shadow-lg transform hover:scale-105">
              Read Case Study
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          <div className="rounded-full bg-[#F1F5F9] px-6 py-2 text-sm font-medium text-[#64748B] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors duration-300 cursor-pointer">
            Trusted by 100+ enterprises
          </div>
          <div className="rounded-full bg-[#F1F5F9] px-6 py-2 text-sm font-medium text-[#64748B] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors duration-300 cursor-pointer">
            4.9/5 average rating
          </div>
          <div className="rounded-full bg-[#F1F5F9] px-6 py-2 text-sm font-medium text-[#64748B] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors duration-300 cursor-pointer">
            99.9% uptime
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
