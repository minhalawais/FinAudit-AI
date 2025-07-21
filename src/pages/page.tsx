import Hero from "../components/landing/Hero"
import Features from "../components/landing/Features"
import Benefits from "../components/landing/Benefits"
import UseCases from "../components/landing/UseCases"
import Technology from "../components/landing/Technology"
import ProductShowcase from "../components/landing/ProductShowcase"
import Comparison from "../components/landing/Comparison"
import Testimonials from "../components/landing/Testimonials"
import Pricing from "../components/landing/Pricing"
import DemoRequest from "../components/landing/DemoRequest"
import FinalCTA from "../components/landing/FinalCTA"
import Navbar from "../components/landing/Navbar"
import Footer from "../components/landing/Footer"
import Teams from "../components/landing/Teams"

import "../index.css"

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Benefits />
        <UseCases />
        <ProductShowcase />
        <Comparison />
        <Teams />
        
        <Pricing />
        <DemoRequest />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

export default App

