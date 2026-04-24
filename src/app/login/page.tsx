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
  FiActivity,
  FiZap,
  FiShield,
  FiTrendingUp
} from "react-icons/fi";

const BACKEND_URL = "";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      console.log("Sending request...");
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      console.log("Request sent");

      if (!response.ok) {
        const { message } = await response.json();
        setError(message || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      const { token, refreshToken } = await response.json();
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      setSuccess("Login successful! Redirecting...");
      
      // Dispatch custom event to notify header about authentication
      window.dispatchEvent(new CustomEvent("userAuthenticated"));
      
      setTimeout(() => {
        setLoading(false); // Ensure loading is reset before redirect
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error during login:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

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
              <h3 className="text-3xl font-extrabold tracking-tight">Why people love FinSense</h3>
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

        {/* Right: form */}
        <div className="py-12 px-8 sm:px-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl text-slate-800 font-extrabold tracking-tight mb-2">Welcome back</h2>
            <p className="text-sm font-medium text-slate-500">Enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 border-b border-slate-100 pb-8 mb-6">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="text-slate-400" />
                </div>
                <input
                  id="email"
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
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                <Link href="/forgot-password" className="flex-shrink-0 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors">Forgot?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-slate-200 bg-slate-50 font-semibold text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
                  placeholder="Your password"
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

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm font-bold animate-pulse">
                <FiActivity size={18} className="shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm font-bold">
                <FiShield size={18} className="shrink-0" />
                {success}
              </div>
            )}

            <button
              type="submit"
              className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-teal-500/20 transform hover:-translate-y-0.5 transition-all outline-none mt-2 ${loading ? 'opacity-80 cursor-wait' : ''}`}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign in securely'} <FiArrowRight />
            </button>
          </form>

          <div className="text-center text-sm font-medium text-slate-600">
            Don't have an account? <Link className="text-teal-600 font-bold hover:text-teal-700 transition-colors" href="/signup">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
