'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use the local worker bundled with react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Props {
  url: string;
}

export default function PdfViewer({ url }: Props) {
  const [numPages, setNumPages]   = useState<number>(0);
  const [pageNum, setPageNum]     = useState<number>(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {error && (
        <div style={{ color: '#b91c1c', fontSize: '0.9rem', padding: 16 }}>{error}</div>
      )}

      {numPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 12px' }}
            onClick={() => setPageNum(p => Math.max(1, p - 1))}
            disabled={pageNum <= 1}
          >
            Prev
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Page {pageNum} of {numPages}
          </span>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 12px' }}
            onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
            disabled={pageNum >= numPages}
          >
            Next
          </button>
        </div>
      )}

      <Document
        file={url}
        onLoadSuccess={({ numPages }) => { setNumPages(numPages); setLoading(false); }}
        onLoadError={() => { setError('Failed to load PDF.'); setLoading(false); }}
        loading={
          <div style={{ color: 'var(--text-faint)', padding: 40, fontSize: '0.9rem' }}>
            Loading PDF...
          </div>
        }
      >
        <Page
          pageNumber={pageNum}
          width={780}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>
    </div>
  );
}
