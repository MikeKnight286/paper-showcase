import { NextResponse } from 'next/server';
import { getPapers, savePapers } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { Paper } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getPapers());
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json() as Omit<Paper, 'id' | 'addedAt'>;
  const paper: Paper = {
    ...body,
    id: uuidv4(),
    addedAt: new Date().toISOString(),
  };
  const papers = getPapers();
  papers.unshift(paper);
  savePapers(papers);
  return NextResponse.json(paper, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await req.json();
  const papers = getPapers().filter(p => p.id !== id);
  savePapers(papers);
  return NextResponse.json({ ok: true });
}
