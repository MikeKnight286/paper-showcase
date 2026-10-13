import { NextResponse } from 'next/server';
import { getPapers, savePapers } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { NextRequest } from 'next/server';
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
    id: crypto.randomUUID(),
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

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id, tags } = await req.json();
  if (!Array.isArray(tags) || !tags.every(t => typeof t === 'string')) {
    return NextResponse.json({ error: 'tags must be string[]' }, { status: 400 });
  }
  const papers = getPapers();
  const paper = papers.find(p => p.id === id);
  if (!paper) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  paper.tags = tags.map(t => t.trim()).filter(Boolean);
  savePapers(papers);
  return NextResponse.json(paper);
}
