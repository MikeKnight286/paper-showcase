import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getPendingPapers, savePendingPapers, getPendingFilePath } from '@/lib/db';
import fs from 'fs';

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
  const filePath = getPendingFilePath(entry.pdfFile);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  pending.splice(idx, 1);
  savePendingPapers(pending);

  return NextResponse.json({ ok: true });
}
