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
  FiShield,
  FiKey
} from "react-icons/fi";

const BACKEND_URL = "";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        setError(message || "Failed to send reset link.");
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setSuccess("OTP sent successfully. Please check your inbox.");
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        setError(message || "Failed to reset password.");
        setLoading(false);
        return;
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      
      setTimeout(() => {
        setLoading(false);
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 selection:bg-teal-200 text-slate-900 font-sans">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden">
        
        <div className="py-12 px-8 sm:px-12 flex flex-col justify-center">
          <div className="mb-10 text-center">
            <h2 className="text-3xl text-slate-800 font-extrabold tracking-tight mb-2">Password Recovery</h2>
            <p className="text-sm font-medium text-slate-500">Secure your account with ease.</p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5 border-b border-slate-100 pb-8 mb-6">
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
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-teal-500/20 transform hover:-translate-y-0.5 transition-all outline-none mt-6 disabled:opacity-80"
              >
                {loading ? "Sending OTP..." : "Send OTP"} <FiArrowRight />
              </button>
            </form>
          ) : (
             <form onSubmit={handleResetPassword} className="space-y-5 border-b border-slate-100 pb-8 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Enter OTP</label>
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
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border border-slate-200 bg-slate-50 font-semibold text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center px-2 text-slate-400 hover:text-teal-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
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
                disabled={loading || !otp || newPassword.length < 6}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all outline-none mt-6 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-lg shadow-teal-500/20 transform hover:-translate-y-0.5 disabled:opacity-80"
              >
                {loading ? "Verifying..." : "Verify & Reset Password"} <FiArrowRight />
              </button>
            </form>
          )}

          <div className="text-center text-sm font-medium text-slate-600">
            Remembered your password? <Link className="text-teal-600 font-bold hover:text-teal-700 transition-colors" href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
