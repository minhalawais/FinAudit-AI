import type React from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { login } from "../../utils/api.ts";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
  
    try {
      const data = await login(username, password);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userRole", data.role);  // Store role
      navigate("/dashboard");
    } catch (error) {
      setError("Invalid username or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E2E8F0]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Section - Branding and Illustration */}
          <div className="bg-gradient-to-r from-[#003366] to-[#004D99] p-12 flex flex-col justify-center items-center text-white">
            <div className="flex flex-col items-center gap-4">
              {/* Updated Financial/Audit-related SVG Icon */}
              <svg
                width="80"
                height="80"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#F59E0B]"
              >
                {/* Document base */}
                <rect x="20" y="15" width="60" height="70" rx="4" stroke="#F59E0B" strokeWidth="4" />
                
                {/* Document lines */}
                <line x1="32" y1="35" x2="68" y2="35" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                <line x1="32" y1="45" x2="68" y2="45" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                <line x1="32" y1="55" x2="68" y2="55" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                
                {/* Magnifying glass */}
                <circle cx="65" cy="65" r="20" stroke="#F59E0B" strokeWidth="4" />
                <line x1="80" y1="80" x2="90" y2="90" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
                
                {/* AI circuit elements */}
                <circle cx="35" cy="70" r="6" fill="#F59E0B" />
                <circle cx="50" cy="70" r="6" fill="#F59E0B" />
                <line x1="35" y1="70" x2="50" y2="70" stroke="#F59E0B" strokeWidth="3" />
              </svg>
              
              {/* Brand Name and Updated Tagline */}
              <h1 className="text-5xl font-bold text-[#F59E0B]">FinAudit AI</h1>
              <p className="text-xl text-[#E2E8F0] text-center font-medium">
                Transforming Financial Audits
              </p>
              <p className="text-lg text-[#E2E8F0] text-center">
                AI-Powered Precision • Seamless Automation • Secure Compliance
              </p>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="p-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-[#1E293B]">Welcome Back</h2>
              <p className="text-sm text-[#64748B]">
                Sign in to access your dashboard
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-[#DC2626] p-3 rounded-lg flex items-start">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 flex-shrink-0 mt-0.5"
                >
                  <path
                    d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-[#1E293B]"
                >
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#1E293B]"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[#003366] hover:text-[#004D99] font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#003366] to-[#004D99] text-white py-3 px-4 rounded-lg hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#003366] focus:ring-offset-2 transition-all flex items-center justify-center font-medium disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="pt-6 border-t border-[#E2E8F0]">
              <p className="text-sm text-center text-[#64748B]">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-[#003366] font-medium hover:text-[#004D99] hover:underline transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;