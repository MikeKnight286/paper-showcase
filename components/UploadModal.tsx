'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ onClose, onSuccess }: Props) {
  const [title, setTitle]     = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear]       = useState('');
  const [abstract, setAbstract] = useState('');
  const [tags, setTags]       = useState('');
  const [doi, setDoi]         = useState('');
  const [url, setUrl]         = useState('');
  const [note, setNote]       = useState('');
  const [file, setFile]       = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Please select a PDF file.'); return; }
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!authors.trim()) { setError('At least one author is required.'); return; }
    if (!year.trim() || isNaN(parseInt(year))) { setError('Valid year is required.'); return; }

    setLoading(true);
    setError(null);

    const meta = {
      title: title.trim(),
      authors: authors.split(',').map(a => a.trim()).filter(Boolean),
      year: parseInt(year),
      abstract: abstract.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      doi: doi.trim() || undefined,
      url: url.trim() || undefined,
      submitterNote: note.trim() || undefined,
    };

    const fd = new FormData();
    fd.append('pdf', file);
    fd.append('meta', JSON.stringify(meta));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); setLoading(false); return; }
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 16, width: '100%', maxWidth: 580,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400 }}>
              Submit a Paper
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-faint)', marginTop: 2 }}>
              Your submission will be reviewed by an admin before appearing in the library.
            </p>
          </div>
          <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={onClose}>
            Close
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* PDF file */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>
                PDF File <span style={{ color: 'var(--red-600)' }}>*</span>
              </label>
              <input
                type="file" accept="application/pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '100%' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: 4 }}>
                Max 20 MB. Must be a valid PDF.
              </p>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>
                Title <span style={{ color: 'var(--red-600)' }}>*</span>
              </label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Full paper title" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>
                Authors <span style={{ color: 'var(--red-600)' }}>*</span>
              </label>
              <input className="input" value={authors} onChange={e => setAuthors(e.target.value)} placeholder="Author One, Author Two, ..." />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: 4 }}>Comma-separated</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>
                  Year <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <input className="input" type="number" min="1900" max="2099"
                  value={year} onChange={e => setYear(e.target.value)} placeholder="2024" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>DOI</label>
                <input className="input" value={doi} onChange={e => setDoi(e.target.value)} placeholder="10.xxxx/..." />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>Abstract</label>
              <textarea className="input" rows={4} value={abstract} onChange={e => setAbstract(e.target.value)} placeholder="Paper abstract..." />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>Tags</label>
              <input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="deep learning, NLP, ..." />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: 4 }}>Comma-separated</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>URL</label>
              <input className="input" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://arxiv.org/abs/..." />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6 }}>Note to reviewer</label>
              <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note..." />
            </div>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
                padding: '10px 14px', color: '#b91c1c', fontSize: '0.85rem',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Uploading...' : 'Submit Paper'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
