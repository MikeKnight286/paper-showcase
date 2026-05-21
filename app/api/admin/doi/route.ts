import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { paperExists } from '@/lib/db';
import type { DoiLookupResult } from '@/types';

export const dynamic = 'force-dynamic';

function cleanAbstract(raw: string | undefined): string {
  if (!raw) return '';
  // CrossRef returns JATS XML tags in abstracts — strip them
  return raw.replace(/<[^>]+>/g, '').trim();
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { doi } = await req.json();
  if (!doi || typeof doi !== 'string') {
    return NextResponse.json({ error: 'doi is required' }, { status: 400 });
  }

  const normalised = doi.trim().replace(/^https?:\/\/doi\.org\//i, '');

  // Duplicate check
  if (paperExists(normalised)) {
    return NextResponse.json({ error: 'This DOI already exists in the library' }, { status: 409 });
  }

  // Fetch from CrossRef (server-side — no CORS issue, polite User-Agent)
  let crossRefData: Record<string, unknown>;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(normalised)}`,
      {
        headers: { 'User-Agent': 'paper-showcase/1.0 (mailto:admin@example.com)' },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (!response.ok) {
      return NextResponse.json({ error: `CrossRef returned ${response.status}` }, { status: 404 });
    }
    const json = await response.json() as { status: string; message: Record<string, unknown> };
    crossRefData = json.message;
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reach CrossRef API' }, { status: 502 });
  }

  // Parse response safely
  const titleArr  = crossRefData['title'] as string[] | undefined;
  const title     = titleArr?.[0] ?? 'Unknown Title';

  const authorArr = crossRefData['author'] as Array<{ given?: string; family?: string }> | undefined;
  const authors   = (authorArr ?? []).map(a =>
    [a.given, a.family].filter(Boolean).join(' ')
  );

  const dateParts = (crossRefData['published'] as { 'date-parts'?: number[][] } | undefined)?.['date-parts']?.[0];
  const year      = dateParts?.[0] ?? new Date().getFullYear();

  const abstract  = cleanAbstract(crossRefData['abstract'] as string | undefined);
  const urlArr    = crossRefData['URL'] as string | undefined;
  const journal   = (crossRefData['container-title'] as string[] | undefined)?.[0];
  const publisher = crossRefData['publisher'] as string | undefined;

  const result: DoiLookupResult = {
    title,
    authors,
    year,
    abstract,
    doi: normalised,
    url: urlArr,
    journal,
    publisher,
  };

  return NextResponse.json(result);
}
