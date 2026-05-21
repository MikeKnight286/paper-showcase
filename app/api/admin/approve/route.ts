import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import {
  getPendingPapers, savePendingPapers,
  getPapers, savePapers,
  getPendingFilePath, getPublicPdfPath
} from '@/lib/db';
import fs from 'fs';
import type { Paper } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  const pending = getPendingPapers();
  const idx = pending.findIndex(p => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Pending paper not found' }, { status: 404 });
  }

  const entry = pending[idx];

  // Move PDF from data/pending/ to public/papers/
  const src  = getPendingFilePath(entry.pdfFile);
  const dest = getPublicPdfPath(entry.pdfFile);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    fs.unlinkSync(src);
  }

  // Add to approved library
  const papers = getPapers();
  const approved: Paper = {
    id:       entry.id,
    title:    entry.title,
    authors:  entry.authors,
    year:     entry.year,
    abstract: entry.abstract,
    tags:     entry.tags,
    doi:      entry.doi,
    url:      entry.url,
    pdfFile:  entry.pdfFile,
    addedAt:  new Date().toISOString(),
  };
  papers.unshift(approved);
  savePapers(papers);

  // Remove from pending
  pending.splice(idx, 1);
  savePendingPapers(pending);

  return NextResponse.json({ ok: true });
}
