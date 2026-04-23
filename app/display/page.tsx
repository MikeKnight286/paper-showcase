"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import QRCode from "@/app/components/QRCode";

interface Paper {
  id: string;
  title: string;
  abstract: string;
  link: string;
  tags: string[];
  authors: string[];
  year: number;
  venue: string;
}

const WIFI_NAME = process.env.NEXT_PUBLIC_WIFI_NAME || "GI";
const HOST_IP = process.env.NEXT_HOST_IP || "host-ip";
const DASHBOARD_PORT = process.env.NEXT_PUBLIC_DASHBOARD_PORT || "3000";
const ROTATE_MS = parseInt(process.env.NEXT_PUBLIC_ROTATE_MS || "15000");

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };
const serif: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const display: React.CSSProperties = { fontFamily: "'Playfair Display', serif" };

export default function DisplayPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    fetch("/api/papers").then((r) => r.json()).then(setPapers);
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
    timerRef.current = setInterval(next, ROTATE_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#fff", borderTop: "4px solid #c8102e" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2.5rem", borderBottom: "1px solid rgba(200,16,46,0.13)", background: "#fff" }}>
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
            Paper Showcase
          </span>
        </div>
        <button
          onClick={() => setPaused((v) => !v)}
          style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.38rem 1rem", borderRadius: "2px", border: `1px solid ${paused ? "#c8102e" : "rgba(200,16,46,0.3)"}`, color: paused ? "#c8102e" : "#555", background: paused ? "#fdedf0" : "transparent", cursor: "pointer" }}
        >
          {paused ? "play" : "pause"}
        </button>
      </header>

      {/* Progress bar */}
      <div style={{ height: "3px", background: "#f5dde1" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#c8102e", transition: "none" }} />
      </div>

      {/* Main card */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem 2rem", overflow: "hidden" }}>
        <div style={{ width: "100%", maxWidth: "1060px" }}>
          {paper ? (
            <div style={{
              border: "1px solid rgba(200,16,46,0.13)", borderTop: "3px solid #c8102e",
              borderRadius: "2px", overflow: "hidden",
              boxShadow: "0 2px 20px rgba(200,16,46,0.07), 0 1px 4px rgba(0,0,0,0.04)",
              opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
              display: "grid", gridTemplateColumns: "1fr 290px", minHeight: "440px",
            }}>
              {/* Left: text */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "2.5rem 3.5rem 2rem", borderRight: "1px solid rgba(200,16,46,0.13)" }}>
                {/* Title */}
                <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)", lineHeight: 1.2, color: "#111", marginBottom: "1.25rem", maxWidth: "560px" }}>
                  {paper.title}
                </h2>

                {/* Authors + year + venue */}
                <div style={{ marginBottom: "1.25rem", maxWidth: "560px", width: "100%" }}>
                  <p style={{ ...serif, fontSize: "0.92rem", color: "#444", fontStyle: "italic", marginBottom: "0.3rem", lineHeight: 1.5 }}>
                    {paper.authors.join(", ")}
                  </p>
                  <p style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.1em", color: "#c8102e", fontWeight: 500 }}>
                    {paper.venue} · {paper.year}
                  </p>
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", width: "100%", maxWidth: "260px" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(200,16,46,0.3)", opacity: 0.5 }} />
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c8102e", flexShrink: 0 }} />
                  <div style={{ flex: 1, height: "1px", background: "rgba(200,16,46,0.3)", opacity: 0.5 }} />
                </div>

                {/* Abstract */}
                <p style={{
                  ...serif, fontSize: "1rem", lineHeight: 1.8, color: "#2a2a2a", fontWeight: 300,
                  maxWidth: "560px", flex: 1, overflow: "hidden",
                  display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical" as const,
                }}>
                  {paper.abstract}
                </p>

                {/* Tags */}
                {paper.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", width: "100%", marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(200,16,46,0.13)" }}>
                    {paper.tags.map((t) => (
                      <span key={t} style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, background: "#fdedf0", color: "#9e0c23", border: "1px solid rgba(200,16,46,0.3)", padding: "0.28rem 0.7rem", borderRadius: "2px" }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: QR */}
              <div style={{ background: "#fdf5f5", borderLeft: "1px solid rgba(200,16,46,0.13)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.25rem", padding: "2rem", position: "relative" }}>
                <div style={{ position: "absolute", bottom: 0, right: 0, width: "36px", height: "36px", background: "#c8102e", clipPath: "polygon(100% 0, 0 100%, 100% 100%)", opacity: 0.6 }} />
                <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#555" }}>scan to open</span>
                <div style={{ position: "relative", padding: "12px", background: "#fff", border: "1px solid rgba(200,16,46,0.3)", borderRadius: "2px", boxShadow: "0 2px 12px rgba(200,16,46,0.09)" }}>
                  {([["top-0 left-0","2px 0 0 2px"],["top-0 right-0","2px 2px 0 0"],["bottom-0 left-0","0 0 2px 2px"],["bottom-0 right-0","0 2px 2px 0"]] as [string,string][]).map(([,bw], i) => {
                    const positions = [{ top: "-3px", left: "-3px" }, { top: "-3px", right: "-3px" }, { bottom: "-3px", left: "-3px" }, { bottom: "-3px", right: "-3px" }];
                    return <div key={i} style={{ position: "absolute", width: "14px", height: "14px", borderStyle: "solid", borderWidth: bw, borderColor: "#c8102e", ...positions[i] }} />;
                  })}
                  <QRCode url={paper.link} size={168} />
                </div>
                <p style={{ ...mono, fontSize: "0.6rem", color: "#555", textAlign: "center", lineHeight: 1.6, maxWidth: "155px" }}>
                  Scan to read the full paper
                </p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", ...mono, fontSize: "0.8rem", color: "#aaa" }}>Loading papers…</div>
          )}
        </div>
      </main>

      {/* WiFi message */}
      <div style={{ textAlign: "center", padding: "0.75rem 2rem", borderTop: "1px solid rgba(200,16,46,0.13)" }}>
        <p style={{ ...mono, fontSize: "0.72rem", color: "#555", letterSpacing: "0.06em" }}>
          Connect to <span style={{ color: "#c8102e", fontWeight: 500 }}>{WIFI_NAME}</span> Wi-Fi and open{" "}
          <span style={{ color: "#c8102e", fontWeight: 500 }}>http://{HOST_IP}:{DASHBOARD_PORT}</span>{" "}
          on your device to access the paper dashboard
        </p>
      </div>

      {/* Footer nav */}
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 2.5rem", borderTop: "1px solid rgba(200,16,46,0.13)" }}>
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