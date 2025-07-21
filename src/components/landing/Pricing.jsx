import { Check } from "lucide-react"

const Pricing = () => {
  const plans = [
    {
      name: "Basic",
      price: "$TBA",
      description: "Perfect for small teams getting started with document management",
      features: [
        "Up to 10,000 documents",
        "Basic OCR & classification",
        "Standard security features",
        "Email support",
        "5 user accounts",
      ],
      highlight: false,
      buttonText: "Get Started",
    },
    {
      name: "Professional",
      price: "$TBA",
      description: "Ideal for growing businesses with advanced audit needs",
      features: [
        "Up to 100,000 documents",
        "Advanced AI classification",
        "Audit workflow automation",
        "Priority support",
        "25 user accounts",
        "Custom integrations",
      ],
      highlight: true,
      buttonText: "Most Popular",
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored solutions for large organizations with complex requirements",
      features: [
        "Unlimited documents",
        "Full AI capabilities",
        "Custom workflow development",
        "Dedicated account manager",
        "Unlimited users",
        "On-premise deployment option",
        "24/7 premium support",
      ],
      highlight: false,
      buttonText: "Contact Sales",
    },
  ]

  return (
    <section id="pricing" className="bg-[#F8FAFC] py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-navy-blue/5 to-transparent rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-t from-soft-gold/5 to-transparent rounded-tr-full"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block bg-navy-blue/10 text-navy-blue text-sm font-medium px-4 py-1 rounded-full mb-4">
            Pricing Plans
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-lg text-[#64748B]">
            Choose the plan that best fits your organization's needs. All plans include our core document management
            features.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-xl ${
                plan.highlight ? "bg-gradient-to-b from-[#003366] to-[#004D99] text-white" : "bg-white text-[#1E293B]"
              } p-8 shadow-lg transition-all duration-300 hover:shadow-xl border ${
                plan.highlight ? "border-navy-blue" : "border-gray-100"
              } group hover:-translate-y-2`}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-soft-gold px-4 py-1 text-xs font-bold text-white shadow-md">
                  Most Popular
                </div>
              )}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-soft-gold/10 to-transparent rounded-bl-full opacity-50"></div>

              <h3 className={`text-2xl font-bold ${plan.highlight ? "text-white" : "text-[#1E293B]"}`}>{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-[#1E293B]"}`}>
                  {plan.price}
                </span>
                <span className={`ml-1 text-xl ${plan.highlight ? "text-white/80" : "text-[#64748B]"}`}>/month</span>
              </div>
              <p className={`mt-4 ${plan.highlight ? "text-white/80" : "text-[#64748B]"}`}>{plan.description}</p>

              <div className={`mt-8 h-px w-full ${plan.highlight ? "bg-white/20" : "bg-gray-100"}`}></div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <div
                      className={`mr-3 p-1 rounded-full ${plan.highlight ? "bg-soft-gold/20" : "bg-success-green/10"}`}
                    >
                      <Check
                        className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? "text-soft-gold" : "text-success-green"}`}
                      />
                    </div>
                    <span className={plan.highlight ? "text-white/90" : "text-[#1E293B]"}>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <button
                  className={`w-full rounded-lg py-3 px-4 font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${
                    plan.highlight
                      ? "bg-soft-gold hover:bg-[#D97706] text-white"
                      : "bg-navy-blue hover:bg-navy-blue/90 text-white"
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-white p-8 shadow-lg border border-gray-100" data-aos="fade-up">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-[#1E293B]">Need a custom solution?</h3>
              <p className="mt-2 text-[#64748B]">
                Contact our sales team for a tailored package that meets your specific requirements.
              </p>
            </div>
            <button className="bg-navy-blue hover:bg-navy-blue/90 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
              Contact for Custom Solution
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing
