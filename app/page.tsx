"use client";

import { useEffect, useState, useMemo, useRef } from "react";

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

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };
const serif: React.CSSProperties = { fontFamily: "'Source Serif 4', serif" };
const display: React.CSSProperties = { fontFamily: "'Playfair Display', serif" };

function TagSelector({
  allTags,
  selectedTags,
  onToggle,
  onClear,
}: {
  allTags: string[];
  selectedTags: Set<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? allTags.filter((t) => t.toLowerCase().includes(q)) : allTags;
  }, [allTags, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const selectedList = Array.from(selectedTags);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            ...mono, fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase",
            fontWeight: 500, padding: "0.4rem 0.9rem", borderRadius: "2px", cursor: "pointer",
            border: `1px solid ${open ? "#c8102e" : "rgba(200,16,46,0.3)"}`,
            background: open ? "#fdedf0" : "#fff",
            color: open ? "#c8102e" : "#555",
            display: "flex", alignItems: "center", gap: "0.5rem",
            transition: "all 0.15s",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="4.5" cy="4.5" r="3.5" />
            <line x1="7.5" y1="7.5" x2="10" y2="10" />
          </svg>
          Filter topics
          {selectedTags.size > 0 && (
            <span style={{ background: "#c8102e", color: "#fff", borderRadius: "10px", padding: "0 5px", fontSize: "0.55rem", lineHeight: "1.6", fontWeight: 700 }}>
              {selectedTags.size}
            </span>
          )}
        </button>

        {/* Selected pills — show up to 4, then +N more */}
        {selectedList.slice(0, 4).map((tag) => (
          <span
            key={tag}
            onClick={() => onToggle(tag)}
            style={{
              ...mono, fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase",
              fontWeight: 500, padding: "0.28rem 0.6rem 0.28rem 0.5rem", borderRadius: "2px",
              background: "#c8102e", color: "#fff",
              border: "1px solid #c8102e", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
            }}
          >
            {tag}
            <span style={{ opacity: 0.7, fontSize: "0.7rem", lineHeight: 1 }}>×</span>
          </span>
        ))}

        {selectedList.length > 4 && (
          <span
            onClick={() => setOpen(true)}
            style={{ ...mono, fontSize: "0.58rem", color: "#c8102e", cursor: "pointer", letterSpacing: "0.05em" }}
          >
            +{selectedList.length - 4} more
          </span>
        )}

        {selectedTags.size > 0 && (
          <button
            onClick={onClear}
            style={{ ...mono, fontSize: "0.58rem", color: "#aaa", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.08em" }}
          >
            clear all
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0,
            width: "320px", background: "#fff",
            border: "1px solid rgba(200,16,46,0.2)", borderRadius: "3px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.09)", zIndex: 50,
            overflow: "hidden",
          }}
        >
          {/* Search input */}
          <div style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid rgba(200,16,46,0.1)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#aaa" strokeWidth="1.5" style={{ flexShrink: 0 }}>
              <circle cx="4.5" cy="4.5" r="3.5" />
              <line x1="7.5" y1="7.5" x2="10" y2="10" />
            </svg>
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics…"
              style={{ ...mono, fontSize: "0.72rem", border: "none", outline: "none", width: "100%", color: "#111", background: "transparent", letterSpacing: "0.04em" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "0.9rem", lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>

          {/* Tag grid */}
          <div style={{ maxHeight: "280px", overflowY: "auto", padding: "0.5rem" }}>
            {filtered.length === 0 ? (
              <p style={{ ...mono, fontSize: "0.62rem", color: "#ccc", textAlign: "center", padding: "1rem", letterSpacing: "0.1em" }}>
                No matches
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {filtered.map((tag) => {
                  const active = selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => onToggle(tag)}
                      style={{
                        ...mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        fontWeight: 500, padding: "0.3rem 0.7rem", borderRadius: "2px", cursor: "pointer",
                        border: `1px solid ${active ? "#c8102e" : "rgba(200,16,46,0.2)"}`,
                        background: active ? "#c8102e" : "#fdf5f5",
                        color: active ? "#fff" : "#9e0c23",
                        transition: "all 0.1s",
                      }}
                    >
                      {active && <span style={{ marginRight: "4px", fontSize: "0.65rem" }}>✓</span>}
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "0.5rem 0.75rem", borderTop: "1px solid rgba(200,16,46,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...mono, fontSize: "0.58rem", color: "#bbb", letterSpacing: "0.06em" }}>
              {filtered.length} of {allTags.length} topic{allTags.length !== 1 ? "s" : ""}
            </span>
            {selectedTags.size > 0 && (
              <button onClick={onClear} style={{ ...mono, fontSize: "0.58rem", color: "#c8102e", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.08em" }}>
                clear all ({selectedTags.size})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/papers").then((r) => r.json()).then(setPapers);
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    papers.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [papers]);

  const filtered = useMemo(() => {
    if (selectedTags.size === 0) return papers;
    return papers.filter((p) => p.tags.some((t) => selectedTags.has(t)));
  }, [papers, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", borderTop: "4px solid #c8102e" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid rgba(200,16,46,0.13)", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
            Paper Dashboard
          </span>
          <p style={{ ...mono, fontSize: "0.58rem", color: "#aaa", letterSpacing: "0.08em", marginTop: "1px" }}>
            {papers.length} paper{papers.length !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
        {/* Tag selector */}
        {allTags.length > 0 && (
          <div style={{ marginBottom: "1.75rem" }}>
            <p style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#aaa", marginBottom: "0.75rem" }}>
              Filter by topic
            </p>
            <TagSelector
              allTags={allTags}
              selectedTags={selectedTags}
              onToggle={toggleTag}
              onClear={() => setSelectedTags(new Set())}
            />
          </div>
        )}

        {/* Count */}
        <p style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaa", marginBottom: "1.25rem" }}>
          {filtered.length} paper{filtered.length !== 1 ? "s" : ""}{selectedTags.size > 0 ? " matching selected topics" : ""}
        </p>

        {/* Paper list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map((paper) => {
            const expanded = expandedId === paper.id;
            return (
              <div key={paper.id} style={{ border: "1px solid rgba(200,16,46,0.13)", borderLeft: "3px solid rgba(200,16,46,0.25)", borderRadius: "2px", background: "#fff", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.25rem 1.5rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      onClick={() => setExpandedId(expanded ? null : paper.id)}
                      style={{ ...display, fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.25, color: "#111", marginBottom: "0.4rem", cursor: "pointer" }}
                    >
                      {paper.title}
                    </h3>
                    <p style={{ ...serif, fontSize: "0.88rem", color: "#555", fontStyle: "italic", marginBottom: "0.3rem", lineHeight: 1.4 }}>
                      {paper.authors.join(", ")}
                    </p>
                    <p style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.08em", color: "#c8102e", fontWeight: 500, marginBottom: "0.6rem" }}>
                      {paper.venue} · {paper.year}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {paper.tags.map((t) => (
                        <span
                          key={t}
                          onClick={() => toggleTag(t)}
                          style={{
                            ...mono, fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase",
                            fontWeight: 500, padding: "0.2rem 0.6rem", borderRadius: "2px",
                            background: selectedTags.has(t) ? "#c8102e" : "#fdedf0",
                            color: selectedTags.has(t) ? "#fff" : "#9e0c23",
                            border: `1px solid ${selectedTags.has(t) ? "#c8102e" : "rgba(200,16,46,0.25)"}`,
                            cursor: "pointer",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem", flexShrink: 0 }}>
                    <a
                      href={paper.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, padding: "0.4rem 1rem", borderRadius: "2px", border: "1px solid #c8102e", background: "#c8102e", color: "#fff", textDecoration: "none", whiteSpace: "nowrap" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#9e0c23"; e.currentTarget.style.borderColor = "#9e0c23"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#c8102e"; e.currentTarget.style.borderColor = "#c8102e"; }}
                    >
                      read paper ↗
                    </a>
                    <button
                      onClick={() => setExpandedId(expanded ? null : paper.id)}
                      style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      {expanded ? "hide abstract ▲" : "show abstract ▼"}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div style={{ borderTop: "1px solid rgba(200,16,46,0.1)", padding: "1.25rem 1.5rem", background: "#fffbfb" }}>
                    <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.8, color: "#333", fontWeight: 300, maxWidth: "700px" }}>
                      {paper.abstract}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <p style={{ ...mono, fontSize: "0.75rem", color: "#ccc", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                No papers match the selected topics
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
