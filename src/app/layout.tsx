// Root layout must be a Server Component — NO "use client" here
// Auth redirect is handled by AuthGuard (client component) below
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthGuard from "../components/AuthGuard";
import PWAInstallBanner from "../components/PWAInstallBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ── SEO + PWA Metadata ────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "FinSense — Smart Finance Manager",
  description:
    "Track your income, expenses, and budgets intelligently with FinSense.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinSense",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

// ── Viewport / Theme Color ────────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-800`}
      >
        {/* AuthGuard handles token check + redirect to /login */}
        <AuthGuard>
          <Header />
          <main>{children}</main>
          <Footer />
          {/* PWA install banner — shows "Add to Home Screen" prompt */}
          <PWAInstallBanner />
        </AuthGuard>
      </body>
    </html>
  );
}
