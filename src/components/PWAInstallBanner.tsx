"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(iosDevice);

    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return; // Already installed — don't show banner

    // iOS: show manual hint after 3 seconds
    if (iosDevice) {
      const timer = setTimeout(() => setShowIOSHint(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const bannerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "1.5rem",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "white",
    borderRadius: "1rem",
    padding: "1rem 1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    boxShadow: "0 8px 32px rgba(99, 102, 241, 0.45), 0 2px 8px rgba(0,0,0,0.3)",
    zIndex: 9999,
    maxWidth: "420px",
    width: "calc(100% - 2rem)",
    backdropFilter: "blur(12px)",
    animation: "slideUp 0.4s ease-out",
  };

  // iOS hint banner
  if (isIOS && showIOSHint) {
    return (
      <>
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
        <div style={bannerStyle}>
          <span style={{ fontSize: "1.75rem" }}>📲</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>Install FinSense</div>
            <div style={{ fontSize: "0.78rem", opacity: 0.88, marginTop: "2px" }}>
              Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
            </div>
          </div>
          <button
            onClick={() => setShowIOSHint(false)}
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "none",
              color: "white",
              padding: "0.35rem 0.7rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            ✕
          </button>
        </div>
      </>
    );
  }

  if (!showBanner) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div style={bannerStyle}>
        <span style={{ fontSize: "1.75rem" }}>📲</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>Install FinSense</div>
          <div style={{ fontSize: "0.78rem", opacity: 0.88, marginTop: "2px" }}>
            Add to home screen for the best experience
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            onClick={() => setShowBanner(false)}
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "none",
              color: "white",
              padding: "0.4rem 0.7rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            style={{
              background: "white",
              color: "#6366f1",
              border: "none",
              padding: "0.4rem 0.85rem",
              borderRadius: "0.5rem",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Install
          </button>
        </div>
      </div>
    </>
  );
}
