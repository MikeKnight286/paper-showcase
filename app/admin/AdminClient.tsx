"use client";

import { useEffect, useState } from "react";

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

const EMPTY_FORM = { title: "", abstract: "", link: "", tags: "", authors: "", year: "", venue: "" };
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };
const serif: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const display: React.CSSProperties = { fontFamily: "'Playfair Display', serif" };

export default function AdminClient() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => fetch("/api/papers").then((r) => r.json()).then(setPapers);
  useEffect(() => { load(); }, []);

  const inputStyle: React.CSSProperties = { width: "100%", ...mono, fontSize: "0.78rem", padding: "0.6rem 0.85rem", borderRadius: "2px", outline: "none", color: "#111", border: "1px solid rgba(200,16,46,0.25)", background: "#fafafa", transition: "border-color 0.15s" };
  const labelStyle: React.CSSProperties = { ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: "0.4rem" };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "#c8102e");
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "rgba(200,16,46,0.25)");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.title.trim() || !form.abstract.trim() || !form.link.trim() || !form.venue.trim() || !form.year.trim()) {
      setError("Title, abstract, link, venue, and year are required.");
      return;
    }
    setSubmitting(true);
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const authors = form.authors.split(",").map((a) => a.trim()).filter(Boolean);
    const res = await fetch("/api/papers/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, abstract: form.abstract, link: form.link, venue: form.venue, year: parseInt(form.year), tags, authors }),
    });
    setSubmitting(false);
    if (res.status === 403) { setError("Access denied — admin is localhost only."); return; }
    if (!res.ok) { setError("Failed to add paper."); return; }
    setSuccess("Paper added successfully.");
    setForm(EMPTY_FORM);
    load();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const res = await fetch(`/api/papers/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.status === 403) { setError("Access denied."); return; }
    if (!res.ok) { setError("Failed to delete."); return; }
    load();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", borderTop: "4px solid #c8102e" }}>
      <header style={{ borderBottom: "1px solid rgba(200,16,46,0.13)", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "28px", height: "28px", background: "#c8102e", borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
            <rect x="1" y="1" width="12" height="1.5" rx="0.5" />
            <rect x="1" y="4.5" width="8" height="1.5" rx="0.5" />
            <rect x="1" y="8" width="12" height="1.5" rx="0.5" />
            <rect x="1" y="11.5" width="6" height="1.5" rx="0.5" />
          </svg>
        </div>
        <div>
          <span style={{ ...mono, fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#111", fontWeight: 500 }}>Admin — Paper Library</span>
          <p style={{ ...mono, fontSize: "0.58rem", color: "#c8102e", letterSpacing: "0.08em", marginTop: "1px" }}>localhost access only</p>
        </div>
      </header>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        <section style={{ marginBottom: "3rem" }}>
          <p style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#aaa", marginBottom: "1.25rem" }}>Add new paper</p>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Paper title" onFocus={focus} onBlur={blur} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Authors <span style={{ color: "#aaa" }}>(comma-separated)</span></label>
                <input style={inputStyle} value={form.authors} onChange={(e) => setForm((f) => ({ ...f, authors: e.target.value }))} placeholder="Alice Smith, Bob Jones" onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ minWidth: "100px" }}>
                <label style={labelStyle}>Year *</label>
                <input style={inputStyle} value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} placeholder="2024" maxLength={4} onFocus={focus} onBlur={blur} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Venue (journal or conference) *</label>
              <input style={inputStyle} value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} placeholder="NeurIPS / JMLR / Nature" onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={labelStyle}>Abstract *</label>
              <textarea rows={5} style={{ ...inputStyle, resize: "vertical" }} value={form.abstract} onChange={(e) => setForm((f) => ({ ...f, abstract: e.target.value }))} placeholder="Full abstract text…" onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={labelStyle}>Link *</label>
              <input style={inputStyle} value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://arxiv.org/abs/…" onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={labelStyle}>Tags <span style={{ color: "#aaa" }}>(comma-separated)</span></label>
              <input style={inputStyle} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="Bayesian, NLP, Transformers" onFocus={focus} onBlur={blur} />
            </div>
            {error && <p style={{ ...mono, fontSize: "0.65rem", color: "#c8102e" }}>⚠ {error}</p>}
            {success && <p style={{ ...mono, fontSize: "0.65rem", color: "#2d7a2d" }}>✓ {success}</p>}
            <div>
              <button type="submit" disabled={submitting} style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.5rem 1.5rem", borderRadius: "2px", background: submitting ? "#aaa" : "#c8102e", color: "#fff", border: "none", cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "adding…" : "add paper"}
              </button>
            </div>
          </form>
        </section>

        <div style={{ borderTop: "1px solid rgba(200,16,46,0.13)", marginBottom: "2.5rem" }} />

        <section>
          <p style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#aaa", marginBottom: "1.25rem" }}>
            Current papers ({papers.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {papers.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.25rem", border: "1px solid rgba(200,16,46,0.13)", borderRadius: "2px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...display, fontSize: "1rem", fontWeight: 700, color: "#111", marginBottom: "0.2rem" }}>{p.title}</p>
                  <p style={{ ...serif, fontSize: "0.82rem", color: "#666", fontStyle: "italic", marginBottom: "0.2rem" }}>{p.authors.join(", ")}</p>
                  <p style={{ ...mono, fontSize: "0.6rem", color: "#c8102e", fontWeight: 500, marginBottom: "0.5rem" }}>{p.venue} · {p.year}</p>
                  <p style={{ ...serif, fontSize: "0.8rem", color: "#888", lineHeight: 1.5, fontWeight: 300, marginBottom: "0.5rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{p.abstract}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {p.tags.map((t) => (
                      <span key={t} style={{ ...mono, fontSize: "0.56rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, padding: "0.18rem 0.5rem", borderRadius: "2px", background: "#fdedf0", color: "#9e0c23", border: "1px solid rgba(200,16,46,0.25)" }}>{t}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.35rem 0.85rem", borderRadius: "2px", border: "1px solid rgba(200,16,46,0.3)", color: deleting === p.id ? "#aaa" : "#c8102e", background: "transparent", cursor: deleting === p.id ? "not-allowed" : "pointer", flexShrink: 0 }}
                  onMouseEnter={(e) => { if (deleting !== p.id) e.currentTarget.style.background = "#fdedf0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {deleting === p.id ? "removing…" : "remove"}
                </button>
              </div>
            ))}
            {papers.length === 0 && (
              <p style={{ ...mono, fontSize: "0.7rem", color: "#ccc", letterSpacing: "0.1em", textAlign: "center", padding: "2rem" }}>No papers yet</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}