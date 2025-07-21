import { Users, Code, Scale, Github, Linkedin, Twitter } from "lucide-react"
import { useState } from "react"

const Teams = () => {
  const [activeTab, setActiveTab] = useState("software")

  const softwareTeam = [
    {
      name: "Minhal Awais",
      role: "Lead Software Engineer",
      image: "/minhalawais.png",
      bio: "Proven Lead Software Engineer with a track record of developing innovative solutions, including a complete Grievance Management SaaS and its mobile application at Fruit of Sustainability. Excelled in a team environment at TTI Testing Laboratories by enhancing process efficiency through scripting. Skilled in Python and adept at fostering collaboration.",
      social: {
        linkedin: "https://www.linkedin.com/in/minhal-awais-601216227/?originalSubdomain=pk",
        github: "https://github.com/minhalawais",
        twitter: "#",
      },
      skills: ["Python", "SaaS Development", "Mobile Apps", "Process Automation"],
    },
    {
      name: "Moiz Amjad",
      role: "Python Developer",
      image: "/moiz_amjad.jpg",
      bio: "Motivated and detail-oriented Python Developer with a strong academic foundation in Artificial Intelligence and practical experience. Proficient in Python, with skills in Machine Learning, Deep Learning, Natural Language Processing, and Computer Vision. Experienced in web automation and data scraping using Selenium and Beautiful Soup, and comfortable working with relational and graph databases including MySQL, PostgreSQL, and Ne04j.",
      social: {
        linkedin: "https://www.linkedin.com/in/malik-moiz11/",
        github: "https://github.com/moizx85",
        twitter: "#",
      },
      skills: ["Python", "Machine Learning", "NLP", "Computer Vision", "Data Scraping"],
    },
    {
      name: "Sarim Zahid Saeed",
      role: "AI Developer & Data Scientist",
      image: "/sarim_zahid.png",
      bio: "As a passionate AI Developer and Data Scientist, I specialize in building and deploying cutting-edge AI and machine learning solutions. With a strong foundation in Python, C++, and JavaScript, I bring a versatile skill set to every project, whether it's creating custom AI models, developing high-performance APIs with FastAPI, or analyzing complex data to derive actionable insights.",
      social: {
        linkedin: "https://www.linkedin.com/in/sarim-zahid-4b3636265/",
        github: "https://github.com/Mikkk1",
        twitter: "#",
      },
      skills: ["AI Model Development", "Machine Learning", "NLP", "Computer Vision", "FastAPI", "AWS"],
    },
  ]

  const legalTeam = [
    {
      name: "TBA",
      role: "Legal Advisor",
      image: "https://placehold.co/300x300/003366/FFFFFF/png?text=JD",
      bio: "TBA",
      social: {
        linkedin: "#",
        github: "#",
        twitter: "#",
      },
      skills: ["Financial Regulations", "Compliance", "Legal Consultation", "Risk Assessment"],
    },
  ]

  const activeTeam = activeTab === "software" ? softwareTeam : legalTeam

  return (
    <section id="teams" className="bg-white py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-gray-100 bg-[length:30px_30px] opacity-20"></div>
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-navy-blue/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-soft-gold/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute -left-24 top-1/3 w-48 h-48 bg-soft-gold/5 rounded-full blur-2xl"></div>
      <div className="absolute -right-24 bottom-1/4 w-64 h-64 bg-navy-blue/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center bg-gradient-to-r from-navy-blue/10 to-soft-gold/10 text-navy-blue text-sm font-medium px-6 py-2 rounded-full mb-6 backdrop-blur-sm">
            <Users className="mr-2 h-4 w-4 text-soft-gold" />
            OUR TEAM
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-[#1E293B] sm:text-5xl">
            Meet the{" "}
            <span className="relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-navy-blue to-soft-gold">Experts</span>
              <span className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-navy-blue to-soft-gold rounded-full"></span>
            </span>{" "}
            Behind FinAudit AI
          </h2>
          <p className="mt-8 text-xl text-[#64748B] max-w-3xl mx-auto">
            Our team of dedicated professionals combines deep technical expertise with industry knowledge to deliver
            cutting-edge solutions for financial auditing and compliance.
          </p>
        </div>

        {/* Team Tabs */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <button 
              className={`inline-flex items-center px-8 py-4 rounded-xl font-medium shadow-md transition-all duration-300 ${
                activeTab === "software" 
                  ? "bg-gradient-to-r from-navy-blue to-navy-blue/90 text-white scale-105 shadow-xl shadow-navy-blue/20" 
                  : "bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
              }`}
              onClick={() => setActiveTab("software")}
            >
              <Code className="mr-3 h-5 w-5" />
              Software & Core Team
            </button>
            <button 
              className={`inline-flex items-center px-8 py-4 rounded-xl font-medium shadow-md transition-all duration-300 ${
                activeTab === "legal" 
                  ? "bg-gradient-to-r from-navy-blue to-navy-blue/90 text-white scale-105 shadow-xl shadow-navy-blue/20" 
                  : "bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
              }`}
              onClick={() => setActiveTab("legal")}
            >
              <Scale className="mr-3 h-5 w-5" />
              Legal Team
            </button>
          </div>

          {/* Team Cards */}
          <div className="space-y-16">
            {activeTeam.map((member, index) => (
              <div
                key={index}
                className="group bg-white rounded-3xl shadow-xl border border-[#E2E8F0] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-navy-blue/5 hover:border-navy-blue/20"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Image Column */}
                  <div className="lg:w-1/3 relative overflow-hidden">
                    <div className="h-full bg-gradient-to-br from-navy-blue to-[#004D99] p-0.5">
                      <div className="relative overflow-hidden h-full">
                        <img
                          src={member.image || "/placeholder.svg"}
                          alt={member.name}
                          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>

                      {/* Social Links */}
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <a
                          href={member.social.linkedin}
                          className="bg-white/25 backdrop-blur-md p-3 rounded-full hover:bg-white/50 transition-colors duration-300 hover:scale-110"
                        >
                          <Linkedin className="h-5 w-5 text-white" />
                        </a>
                        <a
                          href={member.social.github}
                          className="bg-white/25 backdrop-blur-md p-3 rounded-full hover:bg-white/50 transition-colors duration-300 hover:scale-110"
                        >
                          <Github className="h-5 w-5 text-white" />
                        </a>
                        <a
                          href={member.social.twitter}
                          className="bg-white/25 backdrop-blur-md p-3 rounded-full hover:bg-white/50 transition-colors duration-300 hover:scale-110"
                        >
                          <Twitter className="h-5 w-5 text-white" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="lg:w-2/3 p-8 lg:p-12">
                    <div className="inline-block mb-3 text-soft-gold font-medium px-4 py-1 rounded-full bg-soft-gold/10">
                      {member.role}
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-[#1E293B] mb-4 group-hover:text-navy-blue transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-[#64748B] mb-8 leading-relaxed">{member.bio}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {member.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-[#F1F5F9] text-[#334155] px-4 py-1.5 rounded-full text-sm font-medium group-hover:bg-navy-blue/10 transition-colors duration-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State for Legal Team - Only shown when no legal team members exist and legal tab is selected */}
          {activeTab === "legal" && legalTeam.length === 0 && (
            <div className="mt-12">
              <div className="bg-[#F8FAFC] rounded-2xl border border-dashed border-[#CBD5E1] p-16 text-center">
                <Scale className="h-16 w-16 text-[#CBD5E1] mx-auto mb-6" />
                <h3 className="text-2xl font-medium text-[#64748B]">Legal Team Expansion</h3>
                <p className="text-[#94A3B8] mt-3 max-w-lg mx-auto">
                  We're currently expanding our legal team to enhance our compliance and regulatory expertise.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Join Our Team CTA */}
        <div className="mt-28 text-center">
          <div className="relative group overflow-hidden inline-flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-navy-blue/5 via-soft-gold/5 to-navy-blue/5 rounded-3xl p-10 border border-[#E2E8F0] shadow-xl w-full max-w-4xl mx-auto">
            {/* Animated background */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm -z-10"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-navy-blue/20 to-soft-gold/20 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 -z-20"></div>
            
            <div className="text-left mb-8 sm:mb-0 sm:mr-10">
              <h3 className="text-3xl font-bold text-[#1E293B]">Join Our Growing Team</h3>
              <p className="text-[#64748B] mt-3">We're always looking for talented individuals to join our mission.</p>
            </div>
            <button className="px-8 py-4 bg-gradient-to-r from-navy-blue to-navy-blue/90 hover:from-navy-blue/90 hover:to-navy-blue text-white rounded-xl font-medium transition-all duration-300 whitespace-nowrap shadow-lg hover:shadow-xl hover:shadow-navy-blue/20 hover:scale-105">
              View Open Positions
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Teams