import { NextRequest, NextResponse } from 'next/server';
import { getPendingPapers, getPendingFilePath } from '@/lib/db';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// PUBLIC — anyone on the network can view pending PDFs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Sanitise: only hex chars and hyphens (UUID shape)
  if (!/^[0-9a-f-]+$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const pending = getPendingPapers();
  const entry = pending.find(p => p.id === id);
  if (!entry) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const filePath = getPendingFilePath(entry.pdfFile);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${entry.id}.pdf"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}
