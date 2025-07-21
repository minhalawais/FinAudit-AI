"use client"

import { useState } from "react"
import { CheckCircle } from "lucide-react"

const DemoRequest = () => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    message: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://127.0.0.1:8000/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });
  
      if (!response.ok) {
        throw new Error('Failed to submit demo request');
      }
  
      setIsSubmitted(true);
      setFormState({
        name: "",
        email: "",
        company: "",
        role: "",
        message: "",
      });
  
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error("Error submitting demo request:", error);
      // You might want to show an error message to the user
    }
  };

  return (
    <section id="demo-request" className="bg-white py-20 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute -left-20 top-20 w-40 h-40 rounded-full bg-navy-blue/5 blur-3xl"></div>
      <div className="absolute -right-20 bottom-20 w-60 h-60 rounded-full bg-soft-gold/5 blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block bg-navy-blue/10 text-navy-blue text-sm font-medium px-4 py-1 rounded-full mb-4">
            Get Started
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl">Request a Demo</h2>
          <p className="mt-4 text-lg text-[#64748B]">
            See how FinAudit AI can transform your document management and audit processes.
          </p>
        </div>

        <div className="mt-12 mx-auto max-w-2xl">
          {isSubmitted ? (
            <div className="rounded-xl bg-success-green/10 p-8 text-center border border-success-green/20 shadow-md animate-fadeIn">
              <CheckCircle className="mx-auto h-16 w-16 text-success-green animate-pulse" />
              <h3 className="mt-6 text-2xl font-semibold text-[#1E293B]">Thank You!</h3>
              <p className="mt-4 text-[#64748B]">
                Your demo request has been received. Our team will contact you shortly.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 bg-[#F8FAFC] p-8 rounded-xl shadow-lg border border-gray-100"
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#1E293B] mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-300"
                    placeholder="Minhal Awais"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1E293B] mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-300"
                    placeholder="minhalawais1@gmail.com"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-[#1E293B] mb-2">
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    value={formState.company}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-300"
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-[#1E293B] mb-2">
                    Job Title
                  </label>
                  <input
                    id="role"
                    name="role"
                    value={formState.role}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-300"
                    placeholder="CFO, Audit Director, etc."
                  />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#1E293B] mb-2">
                  How can we help you?
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-300"
                  placeholder="Tell us about your specific needs and challenges..."
                />
              </div>
              <div className="text-center">
                <button
                  type="submit"
                  className="bg-navy-blue hover:bg-navy-blue/90 text-white px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg font-medium"
                >
                  Request Demo
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default DemoRequest
