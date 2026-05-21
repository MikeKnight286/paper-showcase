'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { PendingPaper } from '@/types';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), { ssr: false });

export default function AdminQueuePage() {
  const [pending, setPending]     = useState<PendingPaper[]>([]);
  const [loading, setLoading]     = useState(true);
  const [viewPdf, setViewPdf]     = useState<{ id: string; title: string } | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  async function loadPending() {
    setLoading(true);
    try {
      // Admin endpoint — includes full metadata (the public /api/upload strips pdfFile)
      const res = await fetch('/api/upload');
      const data = await res.json();
      setPending(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadPending(); }, []);

  async function approve(id: string) {
    setActioning(id);
    await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setPending(p => p.filter(x => x.id !== id));
    setActioning(null);
    if (viewPdf?.id === id) setViewPdf(null);
  }

  async function reject(id: string) {
    if (!confirm('Reject and permanently delete this submission?')) return;
    setActioning(id);
    await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setPending(p => p.filter(x => x.id !== id));
    setActioning(null);
    if (viewPdf?.id === id) setViewPdf(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-subtle)', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/admin" style={{ textDecoration: 'none' }}>
              <button className="btn btn-ghost" style={{ padding: '5px 10px' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>
            </Link>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--red-800)' }}>
              Review Queue
            </span>
            {pending.length > 0 && (
              <span className="badge badge-pending">{pending.length} pending</span>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-faint)' }}>
            Loading submissions...
          </div>
        ) : pending.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            color: 'var(--text-faint)', fontSize: '1rem',
          }}>
            No pending submissions. The queue is empty.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pending.map(paper => (
              <div key={paper.id} className="card" style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 280 }}>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <span className="badge badge-pending">Pending review</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                        Submitted {new Date(paper.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--red-600)', fontWeight: 700, marginBottom: 6 }}>
                      {paper.year}
                    </div>

                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 400, lineHeight: 1.3, marginBottom: 8 }}>
                      {paper.title}
                    </h2>

                    <div style={{ fontSize: '0.85rem', color: 'var(--red-700)', fontWeight: 500, marginBottom: 10 }}>
                      {paper.authors.join(', ')}
                    </div>

                    {paper.doi && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                        DOI: {paper.doi}
                      </div>
                    )}

                    {paper.abstract && (
                      <p style={{
                        fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                        marginBottom: 12,
                      }}>
                        {paper.abstract}
                      </p>
                    )}

                    {paper.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {paper.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    )}

                    {paper.submitterNote && (
                      <div style={{
                        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
                        padding: '10px 14px', fontSize: '0.82rem', color: '#78350f', marginTop: 8,
                      }}>
                        <strong>Submitter note:</strong> {paper.submitterNote}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, minWidth: 130 }}>
                    <button
                      className="btn"
                      style={{ padding: '7px 14px', fontSize: '0.82rem', background: '#f0f4ff', color: '#1e40af', border: '1px solid #bfdbfe', justifyContent: 'center' }}
                      onClick={() => setViewPdf(viewPdf?.id === paper.id ? null : { id: paper.id, title: paper.title })}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {viewPdf?.id === paper.id ? 'Hide PDF' : 'Preview PDF'}
                    </button>

                    <button
                      className="btn btn-approve"
                      style={{ justifyContent: 'center' }}
                      disabled={actioning === paper.id}
                      onClick={() => approve(paper.id)}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      {actioning === paper.id ? 'Approving...' : 'Approve'}
                    </button>

                    <button
                      className="btn btn-danger"
                      style={{ justifyContent: 'center' }}
                      disabled={actioning === paper.id}
                      onClick={() => reject(paper.id)}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>

                {/* Inline PDF preview */}
                {viewPdf?.id === paper.id && (
                  <div style={{
                    marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 24,
                    maxHeight: 640, overflowY: 'auto',
                  }} className="pdf-viewer-wrap">
                    <PdfViewer url={`/api/pending-pdf/${paper.id}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
