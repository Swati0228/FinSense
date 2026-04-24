"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/apiClient";

const BACKEND_URL = "";

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [username, setUsername] = useState("Loading...");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await apiClient(`${BACKEND_URL}/api/profile`, {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUsername(data.user.name);
            setProfileImage(data.user.profileImage || null);
          }
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setUsername("Guest");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setUsername("Guest");
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      fetchUserProfile();
    }

    const handleUserAuthenticated = () => {
      const updatedToken = localStorage.getItem("token");
      if (updatedToken) {
        setIsAuthenticated(true);
        fetchUserProfile();
      }
    };

    window.addEventListener("userAuthenticated", handleUserAuthenticated);

    const handleSessionExpired = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      setUsername("Guest");
      setProfileImage(null);
      router.push("/login");
    };
    window.addEventListener("sessionExpired", handleSessionExpired);

    return () => {
      window.removeEventListener("userAuthenticated", handleUserAuthenticated);
      window.removeEventListener("sessionExpired", handleSessionExpired);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await apiClient("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: localStorage.getItem("refreshToken") }),
        });
      }
    } catch { /* silent */ }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
    setUsername("Guest");
    setProfileImage(null);
    setShowDropdown(false);
    setShowMobileMenu(false);
    router.push("/");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", emoji: "🏠" },
    { href: "/dashboard/addexpense", label: "Add Expense", emoji: "➕" },
    { href: "/dashboard/planmonth", label: "Plan Budget", emoji: "📅" },
  ];

  /* ── AUTHENTICATED HEADER ─────────────────────────────────────────────── */
  if (isAuthenticated) {
    return (
      <header className="fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
              <div className="bg-white rounded-full p-1.5 shadow-md">
                <Image src="/logo-mark.svg" alt="FinSense" width={28} height={28} />
              </div>
              <div className="leading-tight">
                <p className="text-base font-bold text-white leading-none">FinSense</p>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5 hidden sm:block">Dashboard</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors border-b-2 border-transparent hover:border-teal-400 pb-0.5 whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Username – hidden on mobile */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white leading-none">{username}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Welcome back!</p>
              </div>

              {/* Avatar / dropdown */}
              <div className="relative">
                <button
                  className="bg-gradient-to-r from-teal-500 to-teal-400 rounded-full w-9 h-9 flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all overflow-hidden relative ring-2 ring-teal-400/30"
                  onClick={() => { setShowDropdown((p) => !p); setShowMobileMenu(false); }}
                  aria-label="User menu"
                >
                  {profileImage ? (
                    <Image src={profileImage} alt={username} fill className="object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white relative z-10">
                      {username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-3 w-52 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-sm font-semibold text-slate-800 truncate">{username}</p>
                      <p className="text-xs text-slate-500">Manage your account</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        👤 Profile Settings
                      </Link>
                      <Link
                        href="/dashboard/chats"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        💬 Chat with us
                      </Link>
                      <div className="border-t border-slate-100 mt-1">
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={handleLogout}
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hamburger – mobile only */}
              <button
                className="md:hidden flex flex-col justify-center gap-[5px] w-9 h-9 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                onClick={() => { setShowMobileMenu((p) => !p); setShowDropdown(false); }}
                aria-label="Toggle navigation menu"
              >
                <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${showMobileMenu ? "rotate-45 translate-y-[7px]" : ""}`} />
                <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${showMobileMenu ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${showMobileMenu ? "-rotate-45 -translate-y-[7px]" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-down nav */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            showMobileMenu ? "max-h-80 border-t border-slate-700/60" : "max-h-0"
          }`}
        >
          <nav className="px-3 py-2 space-y-0.5 bg-slate-900/95 backdrop-blur-sm">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white active:bg-slate-600 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <span>{item.emoji}</span> {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-700/60 pt-1 mt-1">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                👤 Profile Settings
              </Link>
              <Link
                href="/dashboard/chats"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                💬 Chat with us
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </nav>
        </div>
      </header>
    );
  }

  /* ── UNAUTHENTICATED HEADER ───────────────────────────────────────────── */
  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2 min-w-0">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity min-w-0">
            <div className="bg-white rounded-full p-1.5 shadow-md shrink-0">
              <Image src="/logo-mark.svg" alt="FinSense" width={28} height={28} />
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-base font-bold text-white leading-none">FinSense</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5 hidden sm:block">
                Intelligent Financial Analytics
              </p>
            </div>
          </Link>

          {/* Auth actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-700 whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 text-white px-3 sm:px-5 py-2 rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              <span className="hidden sm:inline">Get Started Free</span>
              <span className="sm:hidden">Get Started</span>
              <span>→</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
