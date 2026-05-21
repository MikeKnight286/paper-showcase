"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const mono: React.CSSProperties = { fontFamily: "'Courier New', monospace" };
const serif: React.CSSProperties = { fontFamily: "'Georgia', serif" };

const inputStyle: React.CSSProperties = {
  ...mono,
  width: "100%",
  padding: "0.45rem 0.75rem",
  fontSize: "0.75rem",
  letterSpacing: "0.03em",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(200,16,46,0.25)",
  borderRadius: "2px",
  background: "#fff",
  color: "#111",
  outline: "none",
  boxSizing: "border-box",
};

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState(false);
  const [hover, setHover]       = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Invalid password.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", borderTop: "4px solid #c8102e", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "340px", padding: "0 1.5rem" }}>

        {/* Logo + title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          <div style={{ width: "36px", height: "36px", background: "#c8102e", borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="white">
              <rect x="1" y="1" width="12" height="1.5" rx="0.5" />
              <rect x="1" y="4.5" width="8" height="1.5" rx="0.5" />
              <rect x="1" y="8" width="12" height="1.5" rx="0.5" />
              <rect x="1" y="11.5" width="6" height="1.5" rx="0.5" />
            </svg>
          </div>
          <h1 style={{ ...serif, fontSize: "1.35rem", fontWeight: 700, color: "#111", marginBottom: "0.35rem", textAlign: "center" }}>
            Admin Access
          </h1>
          <p style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa", textAlign: "center" }}>
            Paper Showcase
          </p>
        </div>

        {/* Card */}
        <div style={{ border: "1px solid rgba(200,16,46,0.13)", borderTop: "3px solid #c8102e", borderRadius: "2px", padding: "1.75rem 1.5rem" }}>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            <div>
              <label style={{ ...mono, display: "block", fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", marginBottom: "0.45rem", fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="enter password"
                autoFocus
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                  ...inputStyle,
                  ...(focused ? { borderColor: "#c8102e", boxShadow: "0 0 0 2px rgba(200,16,46,0.1)" } : {}),
                }}
              />
            </div>

            {error && (
              <p style={{ ...mono, fontSize: "0.62rem", color: "#c8102e", letterSpacing: "0.04em" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                ...mono,
                fontSize: "0.62rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 500,
                padding: "0.5rem 1rem",
                borderRadius: "2px",
                border: "1px solid #c8102e",
                background: loading ? "#fdedf0" : hover ? "#9e0c23" : "#c8102e",
                color: loading ? "#c8102e" : "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                width: "100%",
                transition: "all 0.15s",
              }}
            >
              {loading ? "signing in…" : "sign in"}
            </button>
          </form>
        </div>

        {/* Divider line */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(200,16,46,0.1)" }} />
          <span style={{ ...mono, fontSize: "0.55rem", color: "#ddd", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            restricted access
          </span>
          <div style={{ flex: 1, height: "1px", background: "rgba(200,16,46,0.1)" }} />
        </div>

      </div>
    </div>
  );
}