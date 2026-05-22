import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getPapers } from '@/lib/db';

export const dynamic = 'force-dynamic';

const STATS_PATH = path.join(process.cwd(), 'data', 'stats.json');

interface StatsFile {
  visits: number;
  reads: Record<string, number>;
}

function readStats(): StatsFile {
  try {
    return JSON.parse(fs.readFileSync(STATS_PATH, 'utf-8'));
  } catch {
    return { visits: 0, reads: {} };
  }
}

function writeStats(s: StatsFile) {
  fs.writeFileSync(STATS_PATH, JSON.stringify(s), 'utf-8');
}

export async function GET(req: NextRequest) {
  const s = readStats();
  if (req.nextUrl.searchParams.get('visit') === '1') {
    s.visits += 1;
    writeStats(s);
  }

  const papers    = getPapers();
  const now       = new Date();
  const thisMonth = papers.filter(p => {
    const d = new Date(p.addedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const topEntry = Object.entries(s.reads).sort((a, b) => b[1] - a[1])[0];
  const topPaper = topEntry ? papers.find(p => p.id === topEntry[0]) : null;

  return NextResponse.json({
    visits:   s.visits,
    total:    papers.length,
    thisMonth,
    mostRead: topPaper ? { title: topPaper.title, count: topEntry![1], authors: topPaper.authors, year: topPaper.year } : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    // sendBeacon may send content-type as text/plain — parse body text directly
    const text = await req.text();
    const { id } = JSON.parse(text);

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const s = readStats();
    s.reads[id] = (s.reads[id] ?? 0) + 1;
    writeStats(s);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}