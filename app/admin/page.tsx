"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Paper, DoiLookupResult } from "@/types";
import { mono, serif } from "@/lib/fonts";
import { matchesQuery } from "@/lib/search";


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

const labelStyle: React.CSSProperties = {
  ...mono,
  display: "block",
  fontSize: "0.75rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#666",
  marginBottom: "0.45rem",
  fontWeight: 500,
};

const EMPTY_FORM = { title: "", authors: "", year: "", abstract: "", tags: "", doi: "", url: "" };

function NavBtn({
  onClick,
  children,
  active,
  danger,
  badge,
}: {
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  badge?: number;
}) {
  const [hover, setHover] = useState(false);
  const base: React.CSSProperties = {
    ...mono,
    fontSize: "0.75rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 500,
    padding: "0.38rem 1rem",
    borderRadius: "2px",
    cursor: "pointer",
    border: `1px solid ${active || hover ? "#c8102e" : "rgba(200,16,46,0.3)"}`,
    background: active ? "#c8102e" : hover ? "#fdedf0" : "transparent",
    color: active ? "#fff" : danger ? "#c8102e" : hover ? "#c8102e" : "#555",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    position: "relative",
    transition: "all 0.15s",
  };
  return (
    <button style={base} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {children}
      {badge != null && badge > 0 && (
        <span style={{ background: "#c8102e", color: "#fff", borderRadius: "10px", padding: "0 5px", fontSize: "0.75rem", lineHeight: "1.6", fontWeight: 700 }}>
          {badge}
        </span>
      )}
    </button>
  );
}

function ActionBtn({
  onClick,
  children,
  disabled,
  variant = "primary",
  style: extraStyle,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  style?: React.CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  const isPrimary = variant === "primary";
  const isDanger  = variant === "danger";
  const base: React.CSSProperties = {
    ...mono,
    fontSize: "0.75rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 500,
    padding: "0.4rem 1.1rem",
    borderRadius: "2px",
    cursor: disabled ? "not-allowed" : "pointer",
    border: isDanger
      ? `1px solid ${hover ? "#c8102e" : "rgba(200,16,46,0.35)"}` 
      : isPrimary
      ? "1px solid #c8102e"
      : "1px solid rgba(200,16,46,0.3)",
    background: isPrimary
      ? hover && !disabled ? "#9e0c23" : "#c8102e"
      : isDanger
      ? hover ? "#fdedf0" : "#fff"
      : hover ? "#fdedf0" : "transparent",
    color: isPrimary ? "#fff" : "#c8102e",
    opacity: disabled ? 0.4 : 1,
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.15s",
    ...extraStyle,
  };
  return (
    <button style={base} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {children}
    </button>
  );
}

export default function AdminPage() {
  const [papers, setPapers]           = useState<Paper[]>([]);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [doiInput, setDoiInput]       = useState("");
  const [doiLoading, setDoiLoading]   = useState(false);
  const [doiError, setDoiError]       = useState<string | null>(null);
  const [doiFilled, setDoiFilled]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/papers").then((r) => r.json()).then(setPapers).catch(() => {});
    fetch("/api/upload").then((r) => r.json()).then((d: unknown[]) => setPendingCount(Array.isArray(d) ? d.length : 0)).catch(() => {});
  }, []);

  function field(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function focused(name: string): React.CSSProperties {
    return focusedInput === name
      ? { borderColor: "#c8102e", boxShadow: "0 0 0 2px rgba(200,16,46,0.1)" }
      : {};
  }

  async function lookupDoi() {
    if (!doiInput.trim()) return;
    setDoiLoading(true);
    setDoiError(null);
    setDoiFilled(false);
    const res = await fetch("/api/admin/doi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doi: doiInput.trim() }),
    });
    const data: DoiLookupResult & { error?: string } = await res.json();
    setDoiLoading(false);
    if (!res.ok) { setDoiError(data.error ?? "Lookup failed."); return; }
    setForm({ title: data.title, authors: data.authors.join(", "), year: String(data.year), abstract: data.abstract, tags: "", doi: data.doi, url: data.url ?? "" });
    setDoiFilled(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.authors.trim() || !form.year) {
      setFormError("Title, authors and year are required."); return;
    }
    setSubmitting(true);
    setFormError(null);
    const body: Omit<Paper, "id" | "addedAt"> = {
      title:    form.title.trim(),
      authors:  form.authors.split(",").map((a) => a.trim()).filter(Boolean),
      year:     parseInt(form.year),
      abstract: form.abstract.trim(),
      tags:     form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      doi:      form.doi.trim() || undefined,
      url:      form.url.trim() || undefined,
    };
    const res = await fetch("/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (!res.ok) { setFormError("Failed to add paper."); return; }
    const added: Paper = await res.json();
    setPapers((p) => [added, ...p]);
    setForm(EMPTY_FORM);
    setDoiInput("");
    setDoiFilled(false);
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 4000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this paper from the library?")) return;
    await fetch("/api/papers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setPapers((p) => p.filter((x) => x.id !== id));
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", borderTop: "4px solid #c8102e" }}>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid rgba(200,16,46,0.13)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "28px", height: "28px", background: "#c8102e", borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
              <rect x="1" y="1" width="12" height="1.5" rx="0.5" />
              <rect x="1" y="4.5" width="8" height="1.5" rx="0.5" />
              <rect x="1" y="8" width="12" height="1.5" rx="0.5" />
              <rect x="1" y="11.5" width="6" height="1.5" rx="0.5" />
            </svg>
          </div>
          <div>
            <span style={{ ...mono, fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#111", fontWeight: 500 }}>
              Admin Panel
            </span>
            <p style={{ ...mono, fontSize: "0.75rem", color: "#666", letterSpacing: "0.08em", marginTop: "1px" }}>
              {papers.length} paper{papers.length !== 1 ? "s" : ""} in library
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <NavBtn onClick={() => router.push("/paperreading")} badge={pendingCount}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="9" height="9" rx="1" />
              <line x1="3" y1="3.5" x2="8" y2="3.5" />
              <line x1="3" y1="5.5" x2="6" y2="5.5" />
              <line x1="3" y1="7.5" x2="7" y2="7.5" />
            </svg>
            reading queue
          </NavBtn>
          <NavBtn onClick={() => router.push("/dashboard")}>
            view library
          </NavBtn>
          <NavBtn onClick={handleLogout} danger>
            sign out
          </NavBtn>
        </div>
      </header>

      <div className="admin-grid" style={{ maxWidth: "1060px", margin: "0 auto", padding: "2rem 1.25rem" }}>

        {/* ── Left: Add paper form ── */}
        <div style={{ border: "1px solid rgba(200,16,46,0.13)", borderTop: "3px solid #c8102e", borderRadius: "2px", background: "#fff", overflow: "hidden" }}>

          {/* DOI auto-fill section */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(200,16,46,0.1)", background: "#fffbfb" }}>
            <p style={{ ...mono, fontSize: "0.75rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#c8102e", fontWeight: 500, marginBottom: "0.75rem" }}>
              Auto-fill via DOI
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                style={{ ...inputStyle, flex: 1, ...focused("doi-lookup") }}
                placeholder="DOI, doi.org/... or arXiv ID/URL"
                aria-label="DOI or arXiv ID"
                autoFocus
                value={doiInput}
                onChange={(e) => { setDoiInput(e.target.value); setDoiError(null); }}
                onKeyDown={(e) => e.key === "Enter" && lookupDoi()}
                onFocus={() => setFocusedInput("doi-lookup")}
                onBlur={() => setFocusedInput(null)}
              />
              <ActionBtn onClick={lookupDoi} disabled={doiLoading || !doiInput.trim()}>
                {doiLoading ? "fetching…" : "fetch"}
              </ActionBtn>
            </div>
            {!doiError && !doiFilled && (
              <p style={{ ...mono, fontSize: "0.75rem", color: "#666", marginTop: "0.5rem", letterSpacing: "0.04em" }}>Press Enter to fetch. Journals (CrossRef) and arXiv/DataCite.</p>
            )}
            {doiError && (
              <p style={{ ...mono, fontSize: "0.75rem", color: "#c8102e", marginTop: "0.5rem", letterSpacing: "0.04em" }}>{doiError}</p>
            )}
            {doiFilled && (
              <p style={{ ...mono, fontSize: "0.75rem", color: "#15803d", marginTop: "0.5rem", letterSpacing: "0.04em" }}>
                Fields filled in. Add tags below, then save.
              </p>
            )}
          </div>

          {/* Form fields */}
          <form onSubmit={handleAdd} style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ ...mono, fontSize: "0.75rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#666", fontWeight: 500 }}>
              Paper details
            </p>

            <div>
              <label htmlFor="f-title" style={labelStyle}>Title <span style={{ color: "#c8102e" }}>*</span></label>
              <input style={{ ...inputStyle, ...focused("title") }} id="f-title" value={form.title} onChange={field("title")} placeholder="Full paper title"
                onFocus={() => setFocusedInput("title")} onBlur={() => setFocusedInput(null)} />
            </div>

            <div>
              <label htmlFor="f-authors" style={labelStyle}>Authors <span style={{ color: "#c8102e" }}>*</span></label>
              <input style={{ ...inputStyle, ...focused("authors") }} id="f-authors" value={form.authors} onChange={field("authors")} placeholder="Author One, Author Two, …"
                onFocus={() => setFocusedInput("authors")} onBlur={() => setFocusedInput(null)} />
              <p style={{ ...mono, fontSize: "0.75rem", color: "#666", marginTop: "0.3rem", letterSpacing: "0.06em" }}>Comma-separated</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label htmlFor="f-year" style={labelStyle}>Year <span style={{ color: "#c8102e" }}>*</span></label>
                <input style={{ ...inputStyle, ...focused("year") }} type="number" min="1900" max="2099" id="f-year" value={form.year} onChange={field("year")} placeholder="2024"
                  onFocus={() => setFocusedInput("year")} onBlur={() => setFocusedInput(null)} />
              </div>
              <div>
                <label htmlFor="f-doi" style={labelStyle}>DOI</label>
                <input style={{ ...inputStyle, ...focused("doi") }} id="f-doi" value={form.doi} onChange={field("doi")} placeholder="10.xxxx/…"
                  onFocus={() => setFocusedInput("doi")} onBlur={() => setFocusedInput(null)} />
              </div>
            </div>

            <div>
              <label htmlFor="f-abstract" style={labelStyle}>Abstract</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: "90px", lineHeight: 1.6, ...focused("abstract") }}
                id="f-abstract" value={form.abstract} onChange={field("abstract")} placeholder="Abstract…"
                onFocus={() => setFocusedInput("abstract")} onBlur={() => setFocusedInput(null)}
              />
            </div>

            <div>
              <label htmlFor="f-tags" style={labelStyle}>
                Tags / Keywords{" "}
                <span style={{ color: "#666", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(enter manually)</span>
              </label>
              <input style={{ ...inputStyle, ...focused("tags") }} id="f-tags" value={form.tags} onChange={field("tags")} placeholder="deep learning, NLP, …"
                onFocus={() => setFocusedInput("tags")} onBlur={() => setFocusedInput(null)} />
              <p style={{ ...mono, fontSize: "0.75rem", color: "#666", marginTop: "0.3rem", letterSpacing: "0.06em" }}>Comma-separated</p>
            </div>

            <div>
              <label htmlFor="f-url" style={labelStyle}>URL</label>
              <input style={{ ...inputStyle, ...focused("url") }} type="url" id="f-url" value={form.url} onChange={field("url")} placeholder="https://arxiv.org/abs/…"
                onFocus={() => setFocusedInput("url")} onBlur={() => setFocusedInput(null)} />
            </div>

            {formError && (
              <p style={{ ...mono, fontSize: "0.75rem", color: "#c8102e", letterSpacing: "0.04em" }}>{formError}</p>
            )}
            {formSuccess && (
              <p style={{ ...mono, fontSize: "0.75rem", color: "#15803d", letterSpacing: "0.04em" }}>Paper added to library.</p>
            )}

            <ActionBtn disabled={submitting} style={{ justifyContent: "center", width: "100%" }}>
              {submitting ? "adding…" : "add to library"}
            </ActionBtn>
          </form>
        </div>

        {/* ── Right: Library list ── */}
        <div>
          <p style={{ ...mono, fontSize: "0.75rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#666", marginBottom: "1.25rem" }}>
            Library · {papers.length} paper{papers.length !== 1 ? "s" : ""}
          </p>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, topic…"
            aria-label="Search library"
            style={{ ...inputStyle, fontSize: "0.9rem", padding: "0.6rem 0.8rem", marginBottom: "1rem" }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {papers.filter((p) => matchesQuery(p, query)).map((paper) => (
              <div key={paper.id} style={{ border: "1px solid rgba(200,16,46,0.13)", borderLeft: "3px solid rgba(200,16,46,0.25)", borderRadius: "2px", background: "#fff", display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem 1.25rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...mono, fontSize: "0.75rem", letterSpacing: "0.08em", color: "#c8102e", fontWeight: 500, marginBottom: "0.3rem" }}>
                    {paper.year}
                  </p>
                  <h3 style={{ ...serif, fontSize: "0.95rem", fontWeight: 700, lineHeight: 1.25, color: "#111", marginBottom: "0.3rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                    {paper.title}
                  </h3>
                  <p style={{ ...serif, fontSize: "0.8rem", color: "#666", fontStyle: "italic", lineHeight: 1.4, marginBottom: "0.5rem" }}>
                    {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " …" : ""}
                  </p>
                  {paper.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {paper.tags.map((t) => (
                        <span key={t} style={{ ...mono, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, padding: "0.18rem 0.55rem", borderRadius: "2px", background: "#fdedf0", color: "#9e0c23", border: "1px solid rgba(200,16,46,0.25)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ActionBtn variant="danger" onClick={() => handleDelete(paper.id)} style={{ flexShrink: 0, padding: "0.32rem 0.75rem" }}>
                  remove
                </ActionBtn>
              </div>
            ))}

            {papers.filter((p) => matchesQuery(p, query)).length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 0" }}>
                <p style={{ ...mono, fontSize: "0.75rem", color: "#666", letterSpacing: "0.15em", textTransform: "uppercase" }}>{papers.length === 0 ? "No papers yet" : "No papers match your search"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}