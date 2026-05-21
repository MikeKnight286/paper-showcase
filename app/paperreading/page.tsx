"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

interface PendingEntry {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  tags: string[];
  doi?: string;
  url?: string;
  submittedAt: string;
  submitterNote?: string;
  uploaderToken?: string;
}

const mono: React.CSSProperties = { fontFamily: "'Courier New', monospace" };
const serif: React.CSSProperties = { fontFamily: "'Georgia', serif" };
const display: React.CSSProperties = { fontFamily: "'Georgia', serif" };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Assign a stable short label per unique uploaderToken
function buildUploaderLabels(queue: PendingEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  let counter = 1;
  // Walk oldest-first so labels are stable as new papers arrive
  const byAge = [...queue].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  for (const p of byAge) {
    const tok = p.uploaderToken ?? "__anon__";
    if (!map.has(tok)) {
      map.set(tok, tok === "__anon__" ? "Anonymous" : `Uploader ${counter++}`);
    }
  }
  return map;
}

function UploaderBadge({ label, isSelf }: { label: string; isSelf: boolean }) {
  return (
    <span style={{
      ...mono, fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase",
      fontWeight: 500, padding: "0.18rem 0.6rem", borderRadius: "2px",
      background: isSelf ? "#c8102e" : "#f4f4f4",
      color: isSelf ? "#fff" : "#888",
      border: `1px solid ${isSelf ? "#c8102e" : "rgba(0,0,0,0.08)"}`,
    }}>
      {isSelf ? "you" : label}
    </span>
  );
}

function AdminActions({ id, onApprove, onReject, busy }: {
  id: string; onApprove: (id: string) => void; onReject: (id: string) => void; busy: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
      <button disabled={busy} onClick={() => onApprove(id)} style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, padding: "0.32rem 0.9rem", borderRadius: "2px", cursor: busy ? "not-allowed" : "pointer", border: "1px solid #15803d", background: "#f0fdf4", color: "#15803d", opacity: busy ? 0.6 : 1 }}>
        {busy ? "working…" : "approve ✓"}
      </button>
      <button disabled={busy} onClick={() => onReject(id)} style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, padding: "0.32rem 0.9rem", borderRadius: "2px", cursor: busy ? "not-allowed" : "pointer", border: "1px solid rgba(200,16,46,0.4)", background: "#fff", color: "#c8102e", opacity: busy ? 0.6 : 1 }}>
        reject ×
      </button>
    </div>
  );
}

function UploadPanel({ myToken, onSuccess }: { myToken: string; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!file) { setError("Please select a PDF file."); return; }
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("pdf", file);
    fd.append("uploaderToken", myToken);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed."); setLoading(false); return; }
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{ border: "1px solid rgba(200,16,46,0.2)", borderLeft: "3px solid #c8102e", borderRadius: "2px", padding: "1.25rem 1.5rem", background: "#fffbfb" }}>
      <p style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#c8102e", fontWeight: 500, marginBottom: "0.75rem" }}>
        Submit a paper for discussion
      </p>
      <p style={{ ...serif, fontSize: "0.85rem", color: "#666", lineHeight: 1.6, marginBottom: "1rem" }}>
        Upload a PDF and it will appear in the queue below.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <label style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, padding: "0.4rem 1rem", borderRadius: "2px", cursor: "pointer", border: "1px solid rgba(200,16,46,0.3)", background: file ? "#fdedf0" : "#fff", color: file ? "#c8102e" : "#555", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5.5 7.5V2.5M3 5l2.5-2.5L8 5" /><path d="M1.5 9.5h8" />
          </svg>
          {file ? file.name : "choose pdf"}
          <input ref={inputRef} type="file" accept="application/pdf" style={{ display: "none" }}
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }} />
        </label>
        {file && (
          <>
            <span style={{ ...mono, fontSize: "0.58rem", color: "#aaa" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            <button onClick={handleSubmit} disabled={loading} style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, padding: "0.4rem 1.1rem", borderRadius: "2px", border: "1px solid #c8102e", background: loading ? "#fdedf0" : "#c8102e", color: loading ? "#c8102e" : "#fff", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "uploading…" : "submit"}
            </button>
            <button onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; setError(null); }} style={{ ...mono, fontSize: "0.58rem", color: "#aaa", background: "none", border: "none", cursor: "pointer" }}>
              clear
            </button>
          </>
        )}
      </div>
      {error && <p style={{ ...mono, fontSize: "0.62rem", color: "#c8102e", marginTop: "0.6rem" }}>{error}</p>}
    </div>
  );
}

// Groups queue by uploaderToken, preserving newest-first order of first appearance
function groupByUploader(queue: PendingEntry[]): { token: string; papers: PendingEntry[] }[] {
  const order: string[] = [];
  const groups = new Map<string, PendingEntry[]>();
  for (const p of queue) {
    const tok = p.uploaderToken ?? "__anon__";
    if (!groups.has(tok)) { groups.set(tok, []); order.push(tok); }
    groups.get(tok)!.push(p);
  }
  return order.map(tok => ({ token: tok, papers: groups.get(tok)! }));
}

export default function PaperReadingPage() {
  const [queue, setQueue] = useState<PendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [viewingPdfId, setViewingPdfId] = useState<string | null>(null);
  const [myToken, setMyToken] = useState("");
  const router = useRouter();

  // Stable anonymous token per browser — persisted in localStorage
  useEffect(() => {
    let tok = localStorage.getItem("uploaderToken");
    if (!tok || !/^[0-9a-f-]{36}$/i.test(tok)) {
      tok = uuidv4();
      localStorage.setItem("uploaderToken", tok);
    }
    setMyToken(tok);
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await fetch("/api/upload");
      const data = await res.json();
      setQueue(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    // Detect admin by probing an admin-only endpoint
    fetch("/api/admin/doi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doi: "__probe__" }) })
      .then((r) => { if (r.status !== 403) setIsAdmin(true); })
      .catch(() => {});
    loadQueue();
  }, []);

  async function handleApprove(id: string) {
    setBusyId(id);
    await fetch("/api/admin/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setQueue((q) => q.filter((p) => p.id !== id));
    setBusyId(null);
    if (viewingPdfId === id) setViewingPdfId(null);
  }

  async function handleReject(id: string) {
    if (!confirm("Reject and permanently delete this submission?")) return;
    setBusyId(id);
    await fetch("/api/admin/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setQueue((q) => q.filter((p) => p.id !== id));
    setBusyId(null);
    if (viewingPdfId === id) setViewingPdfId(null);
  }

  const uploaderLabels = buildUploaderLabels(queue);
  const groups = groupByUploader(queue);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", borderTop: "4px solid #c8102e" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid rgba(200,16,46,0.13)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => router.push("/dashboard")} style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaa", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#c8102e"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#aaa"; }}>
            ← dashboard
          </button>
          <span style={{ color: "rgba(200,16,46,0.3)", fontSize: "0.8rem" }}>|</span>
          <div style={{ width: "28px", height: "28px", background: "#c8102e", borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
              <rect x="1" y="1" width="12" height="1.5" rx="0.5" />
              <rect x="1" y="4.5" width="8" height="1.5" rx="0.5" />
              <rect x="1" y="8" width="12" height="1.5" rx="0.5" />
              <rect x="1" y="11.5" width="6" height="1.5" rx="0.5" />
            </svg>
          </div>
          <div>
            <span style={{ ...mono, fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#111", fontWeight: 500 }}>
              Paper Reading Queue
            </span>
            <p style={{ ...mono, fontSize: "0.58rem", color: "#aaa", letterSpacing: "0.08em", marginTop: "1px" }}>
              {queue.length} submission{queue.length !== 1 ? "s" : ""} · {groups.length} uploader{groups.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {isAdmin && (
          <span style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#15803d", border: "1px solid #bbf7d0", background: "#f0fdf4", padding: "0.25rem 0.6rem", borderRadius: "2px" }}>
            admin
          </span>
        )}
      </header>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
        {/* Flow indicator */}
        <div style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaa", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <span>Submit a PDF</span>
          <span style={{ color: "rgba(200,16,46,0.3)" }}>→</span>
          <span>Everyone views &amp; discusses</span>
          <span style={{ color: "rgba(200,16,46,0.3)" }}>→</span>
          <span>Admin adds to library</span>
        </div>

        {/* Upload panel */}
        <div style={{ marginBottom: "2rem" }}>
          {myToken && (
            <UploadPanel
              myToken={myToken}
              onSuccess={() => {
                setUploadSuccess(true);
                setTimeout(() => setUploadSuccess(false), 5000);
                loadQueue();
              }}
            />
          )}
          {uploadSuccess && (
            <p style={{ ...mono, fontSize: "0.62rem", color: "#15803d", letterSpacing: "0.08em", marginTop: "0.6rem" }}>
              Paper submitted. It now appears in the queue below.
            </p>
          )}
        </div>

        {/* Queue — grouped by uploader */}
        {loading ? (
          <p style={{ ...mono, fontSize: "0.7rem", color: "#ccc", letterSpacing: "0.1em", textAlign: "center", padding: "3rem 0" }}>Loading queue…</p>
        ) : queue.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", borderTop: "1px solid rgba(200,16,46,0.1)" }}>
            <p style={{ ...mono, fontSize: "0.75rem", color: "#ccc", letterSpacing: "0.15em", textTransform: "uppercase" }}>Queue is empty</p>
            <p style={{ ...serif, fontSize: "0.88rem", color: "#bbb", marginTop: "0.5rem" }}>Be the first to submit a paper for discussion.</p>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid rgba(200,16,46,0.1)", paddingTop: "1.5rem" }}>
            <p style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaa", marginBottom: "1.5rem" }}>
              {queue.length} paper{queue.length !== 1 ? "s" : ""} · newest first · grouped by uploader
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {groups.map(({ token, papers }) => {
                const label = uploaderLabels.get(token) ?? "Unknown";
                const isSelf = myToken && token === myToken;

                return (
                  <div key={token}>
                    {/* Uploader group header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <UploaderBadge label={label} isSelf={!!isSelf} />
                      <div style={{ flex: 1, height: "1px", background: "rgba(200,16,46,0.1)" }} />
                      <span style={{ ...mono, fontSize: "0.55rem", color: "#ccc", letterSpacing: "0.08em" }}>
                        {papers.length} paper{papers.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Papers in this group */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {papers.map((paper) => {
                        const expanded = expandedId === paper.id;
                        const showingPdf = viewingPdfId === paper.id;
                        const paperLink = paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : "");
                        const hasTitle = paper.title && paper.title !== paper.id;

                        return (
                          <div key={paper.id} style={{ border: "1px solid rgba(200,16,46,0.13)", borderLeft: "3px solid rgba(200,16,46,0.25)", borderRadius: "2px", background: "#fff", overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.1rem 1.5rem" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Timestamp */}
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.45rem" }}>
                                  <span style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa" }}>{timeAgo(paper.submittedAt)}</span>
                                  <span style={{ ...mono, fontSize: "0.55rem", color: "#ddd" }}>·</span>
                                  <span style={{ ...mono, fontSize: "0.55rem", color: "#ddd" }}>{new Date(paper.submittedAt).toLocaleDateString()}</span>
                                </div>

                                <h3 onClick={() => setExpandedId(expanded ? null : paper.id)}
                                  style={{ ...display, fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.25, color: "#111", marginBottom: "0.3rem", cursor: "pointer" }}>
                                  {hasTitle ? paper.title : <span style={{ color: "#aaa", fontStyle: "italic" }}>Untitled submission</span>}
                                </h3>

                                {paper.authors?.length > 0 && (
                                  <p style={{ ...serif, fontSize: "0.84rem", color: "#555", fontStyle: "italic", marginBottom: "0.2rem", lineHeight: 1.4 }}>
                                    {paper.authors.join(", ")}
                                  </p>
                                )}
                                {paper.year > 0 && (
                                  <p style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.08em", color: "#c8102e", fontWeight: 500, marginBottom: "0.45rem" }}>{paper.year}</p>
                                )}
                                {paper.tags?.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.45rem" }}>
                                    {paper.tags.map((t) => (
                                      <span key={t} style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, padding: "0.18rem 0.55rem", borderRadius: "2px", background: "#fdedf0", color: "#9e0c23", border: "1px solid rgba(200,16,46,0.25)" }}>{t}</span>
                                    ))}
                                  </div>
                                )}
                                {paper.submitterNote && (
                                  <p style={{ ...serif, fontSize: "0.8rem", color: "#888", fontStyle: "italic", paddingLeft: "0.75rem", borderLeft: "2px solid rgba(200,16,46,0.2)", marginTop: "0.4rem" }}>
                                    {paper.submitterNote}
                                  </p>
                                )}
                                {isAdmin && (
                                  <AdminActions id={paper.id} onApprove={handleApprove} onReject={handleReject} busy={busyId === paper.id} />
                                )}
                              </div>

                              {/* Right actions */}
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", flexShrink: 0 }}>
                                {/* View PDF — available to everyone */}
                                <button
                                  onClick={() => setViewingPdfId(showingPdf ? null : paper.id)}
                                  style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, padding: "0.38rem 0.9rem", borderRadius: "2px", border: `1px solid ${showingPdf ? "#c8102e" : "rgba(200,16,46,0.3)"}`, background: showingPdf ? "#fdedf0" : "#fff", color: showingPdf ? "#c8102e" : "#555", cursor: "pointer", whiteSpace: "nowrap" }}>
                                  {showingPdf ? "hide pdf ▲" : "view pdf ▼"}
                                </button>

                                {paperLink && (
                                  <a href={paperLink} target="_blank" rel="noopener noreferrer"
                                    style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, padding: "0.38rem 0.9rem", borderRadius: "2px", border: "1px solid #c8102e", background: "#c8102e", color: "#fff", textDecoration: "none", whiteSpace: "nowrap" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#9e0c23"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "#c8102e"; }}>
                                    open link ↗
                                  </a>
                                )}

                                {paper.abstract && (
                                  <button onClick={() => setExpandedId(expanded ? null : paper.id)}
                                    style={{ ...mono, fontSize: "0.56rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                                    {expanded ? "hide abstract ▲" : "show abstract ▼"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Abstract */}
                            {expanded && paper.abstract && (
                              <div style={{ borderTop: "1px solid rgba(200,16,46,0.1)", padding: "1.1rem 1.5rem", background: "#fffbfb" }}>
                                <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.8, color: "#333", fontWeight: 300, maxWidth: "680px" }}>
                                  {paper.abstract}
                                </p>
                              </div>
                            )}

                            {/* Inline PDF viewer — everyone can view */}
                            {showingPdf && (
                              <div style={{ borderTop: "1px solid rgba(200,16,46,0.1)", background: "#fafafa", padding: "1rem 1.5rem" }}>
                                <iframe
                                  src={`/api/pending-pdf/${paper.id}`}
                                  style={{ width: "100%", height: "680px", border: "1px solid rgba(200,16,46,0.13)", borderRadius: "2px", background: "#fff" }}
                                  title={`PDF: ${paper.title}`}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
