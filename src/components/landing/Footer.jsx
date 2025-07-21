import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Use Cases", href: "#use-cases" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Contact", href: "#demo-request" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "#" },
        { name: "Help Center", href: "#" },
        { name: "API Reference", href: "#" },
        { name: "Privacy Policy", href: "#" },
      ],
    },
  ]

  const socialLinks = [
    { icon: Facebook, href: "#" },
    { icon: Twitter, href: "#" },
    { icon: Linkedin, href: "https://github.com/minhalawais" },
    { icon: Instagram, href: "#" },
  ]

  return (
    <footer className="bg-[#F8FAFC] border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-[#003366] to-[#004D99] flex items-center justify-center text-white font-bold text-xl">
                FA
              </div>
              <span className="ml-2 text-xl font-bold text-[#1E293B]">FinAudit AI</span>
            </div>
            <p className="text-[#64748B] mb-6 max-w-md">
              FinAudit AI is an intelligent document management and financial audit automation platform that helps
              organizations streamline their workflows and ensure compliance.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-navy-blue mr-3" />
                <a
                  href="mailto:info@finaudit.ai"
                  className="text-[#64748B] hover:text-navy-blue transition-colors duration-300"
                >
                  minhal@finaudit.live
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-navy-blue mr-3" />
                <a
                  href="tel:+1234567890"
                  className="text-[#64748B] hover:text-navy-blue transition-colors duration-300"
                >
                  +92 (312) 061-4727
                </a>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-navy-blue mr-3 mt-1" />
                <span className="text-[#64748B]">
                  Lahore ,Pakistan
                  
                  
                </span>
              </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h3 className="text-[#1E293B] font-semibold mb-6">{column.title}</h3>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-[#64748B] hover:text-navy-blue transition-colors duration-300">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#64748B] text-sm">&copy; {currentYear} FinAudit AI. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              {socialLinks.map((social, index) => {
                const Icon = social.icon
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="text-[#64748B] hover:text-navy-blue transition-colors duration-300 p-2 rounded-full hover:bg-navy-blue/10"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
