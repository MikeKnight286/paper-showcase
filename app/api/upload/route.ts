import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getPendingPapers, savePendingPapers, getPendingFilePath } from '@/lib/db';
import type { PendingPaper } from '@/types';

export const dynamic = 'force-dynamic';

const MAX_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES ?? '20971520'); // 20 MB
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

function ensurePendingDir() {
  const dir = path.join(process.cwd(), 'data', 'pending');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// PUBLIC — anyone can list the pending queue (metadata only, no file paths)
export async function GET() {
  const pending = getPendingPapers();
  const sorted = [...pending].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  // Strip internal pdfFile path; keep uploaderToken for grouping on the client
  const safe = sorted.map(({ pdfFile: _, ...rest }) => rest);
  return NextResponse.json(safe);
}

// PUBLIC — anyone can submit a PDF; only the file itself is required
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File exceeds ${MAX_BYTES / 1024 / 1024} MB limit` }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!bytes.subarray(0, 4).equals(PDF_MAGIC)) {
      return NextResponse.json({ error: 'File is not a valid PDF' }, { status: 415 });
    }

    // Optional metadata
    let meta: Partial<Omit<PendingPaper, 'id' | 'pdfFile' | 'submittedAt'>> = {};
    const metaField = formData.get('meta') as string | null;
    if (metaField) {
      try { meta = JSON.parse(metaField); } catch { /* ignore */ }
    }

    // Uploader token — a browser-generated UUID that groups this person's uploads
    // Sanitise: only allow UUID-shaped strings
    const rawToken = formData.get('uploaderToken') as string | null;
    const uploaderToken = rawToken && /^[0-9a-f-]{36}$/i.test(rawToken) ? rawToken : undefined;

    const fallbackTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ') || 'Untitled submission';

    ensurePendingDir();
    const id = uuidv4();
    const filename = `${id}.pdf`;
    await writeFile(getPendingFilePath(filename), bytes);

    const pending = getPendingPapers();
    const entry: PendingPaper = {
      id,
      title:    meta.title    || fallbackTitle,
      authors:  meta.authors  || [],
      year:     meta.year     || new Date().getFullYear(),
      abstract: meta.abstract || '',
      tags:     meta.tags     || [],
      doi:      meta.doi,
      url:      meta.url,
      pdfFile:  filename,
      submittedAt: new Date().toISOString(),
      submitterNote: meta.submitterNote,
      uploaderToken,
    };
    pending.push(entry);
    savePendingPapers(pending);

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
