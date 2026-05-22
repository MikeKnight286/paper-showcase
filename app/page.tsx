"use client";
// VERSION 2: Most read in the footer bar instead of under QR code

import { useEffect, useState, useCallback, useRef } from "react";

interface Paper {
  id: string; title: string; abstract: string; link: string;
  tags: string[]; authors: string[]; year: number; venue: string;
  url?: string; doi?: string;
}
interface Stats {
  visits: number; total: number; thisMonth: number;
  mostRead: { title: string; count: number; authors?: string[]; year?: number } | null;
}

const WIFI_NAME      = process.env.NEXT_PUBLIC_WIFI_NAME || "GI";
const DASHBOARD_PORT = process.env.NEXT_PUBLIC_DASHBOARD_PORT || "3000";
const ROTATE_MS      = parseInt(process.env.NEXT_PUBLIC_ROTATE_MS || "15000");
const REFRESH_MS     = parseInt(process.env.NEXT_PUBLIC_REFRESH_MS || "60000");

const mono:    React.CSSProperties = { fontFamily: "'Courier New', monospace" };
const serif:   React.CSSProperties = { fontFamily: "'Georgia', serif" };
const display: React.CSSProperties = { fontFamily: "'Georgia', serif" };

function QRImg({ url, size, dark = "#111111" }: { url: string; size: number; dark?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!url) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, url, { width: size, margin: 2, color: { dark, light: "#ffffff" } });
    }).catch(() => {});
  }, [url, size, dark]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ display: "block" }} />;
}

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

function StatRow({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid rgba(200,16,46,0.07)" }}>
      <span style={{ ...mono, fontSize: "0.6rem", color: "#999", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ ...mono, fontSize: "0.88rem", fontWeight: 700, color: "#c8102e" }}>{value}</span>
    </div>
  );
}

export default function DisplayPage() {
  const [papers, setPapers]        = useState<Paper[]>([]);
  const [pendingCount, setPending] = useState(0);
  const [stats, setStats]          = useState<Stats | null>(null);
  const [current, setCurrent]      = useState(0);
  const [visible, setVisible]      = useState(true);
  const [progress, setProgress]    = useState(0);
  const [paused, setPaused]        = useState(false);
  const [lanIp, setLanIp]          = useState("host-ip");
  const animRef  = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  // Fetch all data — called on mount and on every refresh interval
  function fetchData(_isFirstLoad = false) {
    fetch("/api/papers").then(r => r.json()).then(setPapers).catch(() => {});
    fetch("/api/upload").then(r => r.json()).then((d: unknown[]) => setPending(Array.isArray(d) ? d.length : 0)).catch(() => {});
    fetch("/api/lan-ip").then(r => r.json()).then((d) => { if (d.ip) setLanIp(d.ip); }).catch(() => {});
    // Carousel never increments visit count — dashboard does that
    const statsUrl = "/api/stats";
    fetch(statsUrl).then(r => r.json()).then(setStats).catch(() => {});
  }

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(false), REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const goTo = useCallback((idx: number) => {
    if (papers.length === 0) return;
    setVisible(false);
    setTimeout(() => {
      setCurrent((idx + papers.length) % papers.length);
      setVisible(true); setProgress(0);
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

  const paper        = papers[current];
  const dashboardUrl = `http://${lanIp}:${DASHBOARD_PORT}/dashboard`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#fff", borderTop: "4px solid #c8102e" }}>

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
          <span style={{ ...mono, fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#111", fontWeight: 500 }}>Paper Showcase</span>
        </div>
        <button onClick={() => setPaused(v => !v)}
          style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.38rem 1rem", borderRadius: "2px", border: `1px solid ${paused ? "#c8102e" : "rgba(200,16,46,0.3)"}`, color: paused ? "#c8102e" : "#555", background: paused ? "#fdedf0" : "transparent", cursor: "pointer" }}>
          {paused ? "play" : "pause"}
        </button>
      </header>

      <div style={{ height: "3px", background: "#f5dde1", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#c8102e", transition: "none" }} />
      </div>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem 2rem", overflow: "hidden" }}>
        <div style={{ width: "100%", maxWidth: "1120px" }}>
          {paper ? (
            <div style={{
              opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
              display: "grid", gridTemplateColumns: "1fr 240px", minHeight: "420px",
            }}>
              {/* Paper content */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "2.25rem 3rem 1.75rem" }}>
                <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)", lineHeight: 1.2, color: "#111", marginBottom: "1.1rem", maxWidth: "520px" }}>
                  {paper.title}
                </h2>
                <div style={{ marginBottom: "1.1rem", maxWidth: "520px", width: "100%" }}>
                  <p style={{ ...serif, fontSize: "0.9rem", color: "#444", fontStyle: "italic", marginBottom: "0.3rem", lineHeight: 1.5 }}>{paper.authors.join(", ")}</p>
                  <p style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.1em", color: "#c8102e", fontWeight: 500 }}>{[paper.venue, paper.year].filter(Boolean).join(" · ")}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.1rem", width: "100%", maxWidth: "240px" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(200,16,46,0.3)", opacity: 0.5 }} />
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c8102e", flexShrink: 0 }} />
                  <div style={{ flex: 1, height: "1px", background: "rgba(200,16,46,0.3)", opacity: 0.5 }} />
                </div>
                <div style={{ position: "relative", maxWidth: "520px", flex: 1, overflow: "hidden" }}>
                  <p style={{ ...serif, fontSize: "1.02rem", lineHeight: 1.85, color: "#1a1a1a", fontWeight: 400, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical" as const }}>
                    {paper.abstract}
                  </p>
                  {/* Fade mask — prevents hard mid-line cutoff */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2.8rem", background: "linear-gradient(to bottom, transparent, #ffffff)" }} />
                </div>
                {paper.tags?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", justifyContent: "center", width: "100%", marginTop: "1.25rem", paddingTop: "1.1rem" }}>
                    {paper.tags.map(t => (
                      <span key={t} style={{ ...mono, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, background: "#c8102e", color: "#fff", border: "1px solid #c8102e", padding: "0.3rem 0.8rem", borderRadius: "2px" }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right column: WiFi + QR + stats only (no most read here) */}
              <div style={{ background: "#fdf5f5", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ padding: "1.5rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.9rem", borderBottom: "1px solid rgba(200,16,46,0.1)" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ ...mono, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", fontWeight: 500, marginBottom: "0.3rem" }}>Connect to Wi-Fi</p>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#fff", border: "1px solid rgba(200,16,46,0.25)", borderRadius: "2px", padding: "0.28rem 0.7rem" }}>
                      <svg width="13" height="10" viewBox="0 0 13 10" fill="none" stroke="#c8102e" strokeWidth="1.3" strokeLinecap="round">
                        <path d="M1 3.5C3 1.2 6.5 0 12 3.5" opacity="0.25"/><path d="M2.5 5.2C4 3.3 6.5 2.4 10.5 5.2" opacity="0.55"/><path d="M4.5 7C5.5 5.9 6.5 5.5 8.5 7"/>
                        <circle cx="6.5" cy="9" r="0.9" fill="#c8102e" stroke="none"/>
                      </svg>
                      <span style={{ ...mono, fontSize: "0.75rem", color: "#c8102e", fontWeight: 700, letterSpacing: "0.08em" }}>{WIFI_NAME}</span>
                    </div>
                    <p style={{ ...mono, fontSize: "0.62rem", color: "#888", marginTop: "0.35rem", letterSpacing: "0.06em" }}>then scan to browse</p>
                  </div>
                  <div style={{ position: "relative", padding: "10px", background: "#fff", border: "1px solid rgba(200,16,46,0.25)", borderRadius: "2px", boxShadow: "0 2px 10px rgba(200,16,46,0.08)" }}>
                    <CornerBrackets color="#c8102e" size={12} gap={3} />
                    <QRImg url={dashboardUrl} size={140} dark="#111111" />
                  </div>
                  <p style={{ ...mono, fontSize: "0.58rem", color: "#aaa", textAlign: "center", lineHeight: 1.6, wordBreak: "break-all", maxWidth: "180px" }}>{dashboardUrl}</p>
                </div>

                <div style={{ flex: 1, padding: "1rem 1.25rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <p style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#bbb", marginBottom: "0.5rem", fontWeight: 500 }}>Library stats</p>
                  <StatRow value={stats?.visits ?? "—"} label="Total visits" />
                  <StatRow value={stats?.total ?? papers.length} label="Papers" />
                  <StatRow value={stats?.thisMonth ?? "—"} label="Added this month" />
                  {pendingCount > 0 && <StatRow value={pendingCount} label="In queue" />}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", ...mono, fontSize: "0.8rem", color: "#aaa" }}>Loading papers…</div>
          )}
        </div>
      </main>

      {/* Footer — most read lives here in v2 */}
      <footer style={{ borderTop: "1px solid rgba(200,16,46,0.13)", flexShrink: 0 }}>
        {/* Most read bar */}
        {stats?.mostRead && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.5rem 2.5rem", borderBottom: "1px solid rgba(200,16,46,0.08)", background: "#fdf5f5", minWidth: 0 }}>
            <span style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c8102e", fontWeight: 600, flexShrink: 0 }}>
              Most read
            </span>
            <div style={{ width: "1px", height: "12px", background: "rgba(200,16,46,0.2)", flexShrink: 0 }} />
            <span style={{ ...serif, fontSize: "0.82rem", color: "#333", fontStyle: "italic", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1 }}>
              {stats.mostRead.title}
            </span>
            {stats.mostRead.authors && stats.mostRead.authors.length > 0 && (
              <>
                <div style={{ width: "1px", height: "12px", background: "rgba(200,16,46,0.15)", flexShrink: 0 }} />
                <span style={{ ...mono, fontSize: "0.58rem", color: "#888", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "220px", flexShrink: 0 }}>
                  {stats.mostRead.authors.slice(0, 3).join(", ")}{stats.mostRead.authors.length > 3 ? " …" : ""}
                </span>
              </>
            )}
            {stats.mostRead.year && (
              <>
                <div style={{ width: "1px", height: "12px", background: "rgba(200,16,46,0.15)", flexShrink: 0 }} />
                <span style={{ ...mono, fontSize: "0.58rem", color: "#c8102e", fontWeight: 600, flexShrink: 0 }}>
                  {stats.mostRead.year}
                </span>
              </>
            )}
          </div>
        )}
        {/* Nav bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 2.5rem" }}>
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
        </div>
      </footer>
    </div>
  );
}