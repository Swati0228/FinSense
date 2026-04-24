"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        padding: "2rem",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      {/* Animated icon */}
      <div
        style={{
          fontSize: "5rem",
          marginBottom: "1.5rem",
          animation: "pulse 2s ease-in-out infinite",
        }}
      >
        📡
      </div>

      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "800",
          marginBottom: "0.5rem",
          background: "linear-gradient(135deg, #a78bfa, #6366f1)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        You&apos;re Offline
      </h1>

      <p
        style={{
          color: "#94a3b8",
          fontSize: "1rem",
          maxWidth: "360px",
          lineHeight: "1.6",
          marginBottom: "2rem",
        }}
      >
        No internet connection detected. Please check your network and try again.
      </p>

      {/* Retry button */}
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
          border: "none",
          padding: "0.85rem 2.5rem",
          borderRadius: "0.75rem",
          cursor: "pointer",
          fontSize: "1rem",
          fontWeight: "600",
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseOver={(e) => {
          (e.target as HTMLButtonElement).style.transform = "scale(1.05)";
          (e.target as HTMLButtonElement).style.boxShadow =
            "0 6px 28px rgba(99,102,241,0.55)";
        }}
        onMouseOut={(e) => {
          (e.target as HTMLButtonElement).style.transform = "scale(1)";
          (e.target as HTMLButtonElement).style.boxShadow =
            "0 4px 20px rgba(99,102,241,0.4)";
        }}
      >
        🔄 Try Again
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
