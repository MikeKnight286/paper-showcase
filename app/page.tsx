"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Paper {
  id: string;
  title: string;
  abstract: string;
  link: string;
  tags: string[];
  authors: string[];
  year: number;
  venue: string;
  url?: string;
  doi?: string;
}

const WIFI_NAME = process.env.NEXT_PUBLIC_WIFI_NAME || "GI";
const DASHBOARD_PORT = process.env.NEXT_PUBLIC_DASHBOARD_PORT || "3000";
const ROTATE_MS = parseInt(process.env.NEXT_PUBLIC_ROTATE_MS || "15000");

const mono: React.CSSProperties = { fontFamily: "'Courier New', monospace" };
const serif: React.CSSProperties = { fontFamily: "'Georgia', serif" };
const display: React.CSSProperties = { fontFamily: "'Georgia', serif" };

function QRImg({ url, size, dark = "#111111" }: { url: string; size: number; dark?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!url) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, url, {
        width: size,
        margin: 2,
        color: { dark, light: "#ffffff" },
      });
    }).catch(() => {});
  }, [url, size, dark]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ display: "block" }} />;
}

// Decorative corner brackets — the signature accent from the original design
function CornerBrackets({ color = "#c8102e", size = 14, gap = 3 }: { color?: string; size?: number; gap?: number }) {
  const corners = [
    { top: -gap, left: -gap,  borderWidth: "2px 0 0 2px" },
    { top: -gap, right: -gap, borderWidth: "2px 2px 0 0" },
    { bottom: -gap, left: -gap,  borderWidth: "0 0 2px 2px" },
    { bottom: -gap, right: -gap, borderWidth: "0 2px 2px 0" },
  ] as const;
  return (
    <>
      {corners.map((c, i) => (
        <div key={i} style={{ position: "absolute", width: size, height: size, borderStyle: "solid", borderColor: color, ...c }} />
      ))}
    </>
  );
}

export default function DisplayPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lanIp, setLanIp] = useState("host-ip");
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    fetch("/api/papers").then((r) => r.json()).then(setPapers);
    fetch("/api/lan-ip").then((r) => r.json()).then((d) => { if (d.ip) setLanIp(d.ip); }).catch(() => {});
  }, []);

  const goTo = useCallback((idx: number) => {
    if (papers.length === 0) return;
    setVisible(false);
    setTimeout(() => {
      setCurrent((idx + papers.length) % papers.length);
      setVisible(true);
      setProgress(0);
      startRef.current = performance.now();
    }, 380);
  }, [papers.length]);

  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);

  useEffect(() => {
    if (paused || papers.length === 0) return;
    startRef.current = performance.now();
    const animate = (ts: number) => {
      const pct = Math.min(((ts - startRef.current) / ROTATE_MS) * 100, 100);
      setProgress(pct);
      if (pct < 100) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [current, paused, papers.length]);

  useEffect(() => {
    if (paused || papers.length === 0) return;
    const t = setInterval(next, ROTATE_MS);
    return () => clearInterval(t);
  }, [next, paused, papers.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "p") setPaused((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const paper = papers[current];

  const dashboardUrl = `http://${lanIp}:${DASHBOARD_PORT}/dashboard`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#fff", borderTop: "4px solid #c8102e" }}>

      {/* ── Header ── */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2.5rem", borderBottom: "1px solid rgba(200,16,46,0.13)", background: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "28px", height: "28px", background: "#c8102e", borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
              <rect x="1" y="1" width="12" height="1.5" rx="0.5" />
              <rect x="1" y="4.5" width="8" height="1.5" rx="0.5" />
              <rect x="1" y="8" width="12" height="1.5" rx="0.5" />
              <rect x="1" y="11.5" width="6" height="1.5" rx="0.5" />
            </svg>
          </div>
          <span style={{ ...mono, fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#111", fontWeight: 500 }}>
            Paper Reading
          </span>
        </div>
        <button
          onClick={() => setPaused((v) => !v)}
          style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.38rem 1rem", borderRadius: "2px", border: `1px solid ${paused ? "#c8102e" : "rgba(200,16,46,0.3)"}`, color: paused ? "#c8102e" : "#555", background: paused ? "#fdedf0" : "transparent", cursor: "pointer" }}
        >
          {paused ? "play" : "pause"}
        </button>
      </header>

      {/* ── Progress bar ── */}
      <div style={{ height: "3px", background: "#f5dde1", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#c8102e", transition: "none" }} />
      </div>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem 2rem", overflow: "hidden" }}>
        <div style={{ width: "100%", maxWidth: "1120px" }}>
          {paper ? (
            <div style={{
              border: "1px solid rgba(200,16,46,0.13)",
              borderTop: "3px solid #c8102e",
              borderRadius: "2px",
              overflow: "hidden",
              boxShadow: "0 2px 20px rgba(200,16,46,0.07), 0 1px 4px rgba(0,0,0,0.04)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
              // Three columns: paper text | paper QR | dashboard QR + WiFi
              display: "grid",
              gridTemplateColumns: "1fr 240px",
              minHeight: "420px",
            }}>

              {/* ── Col 1: Paper content ── */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "2.25rem 3rem 1.75rem", borderRight: "1px solid rgba(200,16,46,0.13)" }}>
                <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)", lineHeight: 1.2, color: "#111", marginBottom: "1.1rem", maxWidth: "520px" }}>
                  {paper.title}
                </h2>

                <div style={{ marginBottom: "1.1rem", maxWidth: "520px", width: "100%" }}>
                  <p style={{ ...serif, fontSize: "0.9rem", color: "#444", fontStyle: "italic", marginBottom: "0.3rem", lineHeight: 1.5 }}>
                    {paper.authors.join(", ")}
                  </p>
                  <p style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.1em", color: "#c8102e", fontWeight: 500 }}>
                    {[paper.venue, paper.year].filter(Boolean).join(" · ")}
                  </p>
                </div>

                {/* Decorative divider */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.1rem", width: "100%", maxWidth: "240px" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(200,16,46,0.3)", opacity: 0.5 }} />
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c8102e", flexShrink: 0 }} />
                  <div style={{ flex: 1, height: "1px", background: "rgba(200,16,46,0.3)", opacity: 0.5 }} />
                </div>

                <p style={{
                  ...serif, fontSize: "0.97rem", lineHeight: 1.8, color: "#2a2a2a", fontWeight: 300,
                  maxWidth: "520px", flex: 1, overflow: "hidden",
                  display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical" as const,
                }}>
                  {paper.abstract}
                </p>

                {paper.tags?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", justifyContent: "center", width: "100%", marginTop: "1.25rem", paddingTop: "1.1rem", borderTop: "1px solid rgba(200,16,46,0.13)" }}>
                    {paper.tags.map((t) => (
                      <span key={t} style={{ ...mono, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, background: "#c8102e", color: "#fff", border: "1px solid #c8102e", padding: "0.3rem 0.8rem", borderRadius: "2px" }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Col 2: Dashboard QR ── */}
              <div style={{
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0",
                padding: "0",
              }}>
                {/* Top zone: WiFi instruction */}
                <div style={{
                  width: "100%",
                  padding: "1.25rem 1.5rem 1rem",
                  borderBottom: "1px solid rgba(200,16,46,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.4rem",
                  flex: "0 0 auto",
                }}>
                  <span style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#000" }}>
                    browse library
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.15rem" }}>
                    {/* WiFi icon */}
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none" stroke="#c8102e" strokeWidth="1.2" strokeLinecap="round">
                      <path d="M1 3.5C2.8 1.5 5.5 0.5 10 3.5" opacity="0.3"/>
                      <path d="M2.5 5C3.8 3.5 5.5 2.8 8.5 5" opacity="0.6"/>
                      <path d="M4 6.5C4.8 5.8 5.5 5.5 7 6.5" />
                      <circle cx="5.5" cy="8" r="0.8" fill="#c8102e" stroke="none"/>
                    </svg>
                    <span style={{ ...mono, fontSize: "0.58rem", color: "#c8102e", fontWeight: 500, letterSpacing: "0.06em" }}>
                      {WIFI_NAME}
                    </span>
                  </div>
                </div>

                {/* Middle zone: QR code */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  padding: "1.25rem 1.5rem",
                }}>
                  <div style={{ position: "relative", padding: "8px", background: "#fff", border: "1px solid rgba(200,16,46,0.18)", borderRadius: "2px" }}>
                    <CornerBrackets color="rgba(200,16,46,0.5)" size={11} gap={2} />
                    <QRImg url={dashboardUrl} size={116} dark="#2a2a2a" />
                  </div>
                  <p style={{ ...mono, fontSize: "0.56rem", color: "#000", textAlign: "center", lineHeight: 1.7, maxWidth: "140px" }}>
                    Scan to open the paper library on your device
                  </p>
                </div>

                {/* Bottom zone: URL */}
                <div style={{
                  width: "100%",
                  borderTop: "1px solid rgba(200,16,46,0.08)",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{ ...mono, fontSize: "0.52rem", color: "#000", letterSpacing: "0.04em", textAlign: "center", wordBreak: "break-all" }}>
                    {dashboardUrl}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: "center", ...mono, fontSize: "0.8rem", color: "#aaa" }}>Loading papers…</div>
          )}
        </div>
      </main>

      {/* ── Footer nav ── */}
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 2.5rem", borderTop: "1px solid rgba(200,16,46,0.13)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {([["←", prev], ["→", next]] as [string, () => void][]).map(([label, fn], i) => (
            <button key={i} onClick={fn} style={{ width: "34px", height: "34px", border: "1px solid rgba(200,16,46,0.3)", borderRadius: "2px", background: "none", color: "#555", cursor: "pointer", fontSize: "1rem", ...mono, display: "flex", alignItems: "center", justifyContent: "center" }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {papers.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === current ? "#c8102e" : "#ddd", border: `1px solid ${i === current ? "#c8102e" : "#ccc"}`, transform: i === current ? "scale(1.35)" : "scale(1)", transition: "all 0.3s", cursor: "pointer", padding: 0 }} />
          ))}
        </div>
        <span style={{ ...mono, fontSize: "0.6rem", color: "#aaa", letterSpacing: "0.1em" }}>
          {paused ? "paused" : `auto · ${ROTATE_MS / 1000}s`}
        </span>
      </footer>
    </div>
  );
}