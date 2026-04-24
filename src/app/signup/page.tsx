"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FiEye, 
  FiEyeOff, 
  FiArrowRight, 
  FiMail, 
  FiLock,
  FiUser,
  FiActivity,
  FiShield,
  FiCheckCircle,
  FiKey,
  FiZap,
  FiTrendingUp
} from "react-icons/fi";

const BACKEND_URL = "";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill all fields.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the terms.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        setError(message || "Failed to send OTP.");
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setSuccess("OTP sent to your email! Please enter it to verify.");
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  async function handleVerifyOtpAndSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, otp }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        setError(message || "Verification failed. Please try again.");
        setLoading(false);
        return;
      }

      const { token, refreshToken } = await response.json();
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      setSuccess("Account created successfully! Redirecting...");
      
      window.dispatchEvent(new CustomEvent("userAuthenticated"));
      
      setTimeout(() => {
        setLoading(false);
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  const canSubmit = Boolean(name.trim() && email.trim() && password && password.length >= 6 && agreed && !loading);
  const canVerify = Boolean(otp.trim().length === 6 && !loading);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 selection:bg-teal-200 text-slate-900 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left features panel */}
        <div className="hidden md:flex flex-col justify-center gap-8 p-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 space-y-10">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 shadow-lg shadow-teal-500/30 flex items-center justify-center text-white text-xl font-bold tracking-tighter ring-4 ring-white/10 mb-6">
                FS
              </div>
              <h3 className="text-3xl font-extrabold tracking-tight">Join FinSense today</h3>
            </div>
            
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <span className="flex-shrink-0 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                   <FiZap size={16} />
                </span>
                <div>
                  <div className="font-bold text-lg">Smart spending insights</div>
                  <div className="text-sm text-slate-400 font-medium">Auto-categorize and highlight saving opportunities instantly.</div>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex-shrink-0 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                   <FiTrendingUp size={16} />
                </span>
                <div>
                  <div className="font-bold text-lg">Goal-based projections</div>
                  <div className="text-sm text-slate-400 font-medium">See exactly how small daily changes affect your long-term goals.</div>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex-shrink-0 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/20 text-green-400 border border-green-500/30">
                   <FiShield size={16} />
                </span>
                <div>
                  <div className="font-bold text-lg">Privacy-first guarantee</div>
                  <div className="text-sm text-slate-400 font-medium">We keep your financial data strictly secure and completely private.</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Form panel */}
        <div className="py-12 px-8 sm:px-16 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl text-slate-800 font-extrabold tracking-tight mb-2">Create your account</h2>
            <p className="text-sm font-medium text-slate-500">Start tracking and get personalized insights instantly.</p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5 border-b border-slate-100 pb-8 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUser className="text-slate-400" />
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-slate-50 font-semibold text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
                    placeholder="Your full name"
                    aria-label="Full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-slate-50 font-semibold text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
                    placeholder="you@example.com"
                    aria-label="Email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border border-slate-200 bg-slate-50 font-semibold text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
                    placeholder="At least 6 characters"
                    aria-label="Password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center px-2 text-slate-400 hover:text-teal-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-4 cursor-pointer group mt-2 w-fit">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded bg-white checked:bg-teal-500 checked:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 transition-all cursor-pointer"
                  />
                  <FiCheckCircle size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-slate-600 select-none">
                  I agree to FinSense's <a href="#" className="font-bold text-teal-600 hover:text-teal-700">Terms of Service</a> and <a href="#" className="font-bold text-teal-600 hover:text-teal-700">Privacy Policy</a>
                </span>
              </label>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm font-bold animate-pulse mt-4">
                  <FiActivity size={18} className="shrink-0" />
                  {error}
                </div>
              )}
            
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all outline-none mt-6 ${canSubmit ? "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-lg shadow-teal-500/20 transform hover:-translate-y-0.5" : "bg-slate-100 text-slate-400 cursor-not-allowed"} disabled:opacity-80`}
              >
                {loading ? "Sending OTP..." : "Get OTP"} <FiArrowRight />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpAndSignup} className="space-y-5 border-b border-slate-100 pb-8 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Enter OTP Sent to Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiKey className="text-slate-400" />
                  </div>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-slate-50 font-semibold text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
                    placeholder="123456"
                    aria-label="OTP"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm font-bold animate-pulse mt-4">
                  <FiActivity size={18} className="shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm font-bold mt-4">
                  <FiShield size={18} className="shrink-0" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={!canVerify}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all outline-none mt-6 ${canVerify ? "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-lg shadow-teal-500/20 transform hover:-translate-y-0.5" : "bg-slate-100 text-slate-400 cursor-not-allowed"} disabled:opacity-80`}
              >
                {loading ? "Verifying..." : "Verify & Create Account"} <FiArrowRight />
              </button>
            </form>
          )}

          <div className="text-center text-sm font-medium text-slate-600">
            Already have an account? <Link className="text-teal-600 font-bold hover:text-teal-700 transition-colors" href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
