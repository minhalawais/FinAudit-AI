import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom

const Navbar = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Benefits", href: "#benefits" },
    { name: "Use Cases", href: "#use-cases" },
    { name: "Pricing", href: "#pricing" },
    { name: "Contact", href: "#demo-request" },
  ];

  const handleLogin = () => {
    navigate("/login"); // Use navigate to redirect to login page
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <a href="#" className="flex items-center">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-full" />
              <span className={`ml-2 text-xl font-bold ${isScrolled ? "text-[#003366]" : "text-white"}`}>
                FinAudit AI
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-soft-gold ${
                  isScrolled ? "text-[#1E293B]" : "text-white"
                }`}
              >
                {link.name}
              </a>
            ))}
            <button 
              onClick={handleLogin}
              className="bg-soft-gold hover:bg-[#D97706] text-white px-4 py-2 rounded-md transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-md ${isScrolled ? "text-[#1E293B]" : "text-white"}`}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-lg shadow-lg p-4 absolute left-4 right-4 top-16 border border-gray-100 animate-fadeIn">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-[#1E293B] hover:text-soft-gold font-medium px-4 py-2 rounded-md hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <button
                className="bg-soft-gold hover:bg-[#D97706] text-white px-4 py-2 rounded-md transition-all duration-300 shadow-md hover:shadow-lg"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogin();
                }}
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;