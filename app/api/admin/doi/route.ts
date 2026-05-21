import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { paperExists } from '@/lib/db';
import type { DoiLookupResult } from '@/types';

export const dynamic = 'force-dynamic';

function cleanAbstract(raw: string | undefined): string {
  if (!raw) return '';
  return raw.replace(/<[^>]+>/g, '').trim();
}

async function fetchCrossRef(doi: string): Promise<Response> {
  // CrossRef polite pool: provide a real mailto — grants much higher rate limits
  // See: https://api.crossref.org/swagger-ui/index.html#/Works/get_works__doi_
  const headers = {
    'User-Agent': 'paper-showcase/1.0 (mailto:your-email@example.com; polite pool)',
    'Accept': 'application/json',
  };
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 429) {
        // Respect Retry-After if present, otherwise exponential backoff
        const retryAfter = res.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 2000;
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      return res;
    } catch {
      clearTimeout(timer);
      if (attempt === 2) throw new Error('All retries failed');
      await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
    }
  }
  throw new Error('All retries exhausted');
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

  if (paperExists(normalised)) {
    return NextResponse.json({ error: 'This DOI already exists in the library' }, { status: 409 });
  }

  let crossRefData: Record<string, unknown>;
  try {
    const response = await fetchCrossRef(normalised);
    if (response.status === 404) {
      return NextResponse.json({ error: 'DOI not found in CrossRef' }, { status: 404 });
    }
    if (response.status === 429) {
      return NextResponse.json({ error: 'CrossRef rate limit reached — wait a moment and try again' }, { status: 429 });
    }
    if (!response.ok) {
      return NextResponse.json({ error: `CrossRef returned ${response.status}` }, { status: 502 });
    }
    const json = await response.json() as { status: string; message: Record<string, unknown> };
    crossRefData = json.message;
  } catch {
    return NextResponse.json({ error: 'Failed to reach CrossRef — check your internet connection' }, { status: 502 });
  }

  const titleArr  = crossRefData['title'] as string[] | undefined;
  const title     = titleArr?.[0] ?? 'Unknown Title';

  const authorArr = crossRefData['author'] as Array<{ given?: string; family?: string }> | undefined;
  const authors   = (authorArr ?? []).map(a => [a.given, a.family].filter(Boolean).join(' '));

  const dateParts = (crossRefData['published'] as { 'date-parts'?: number[][] } | undefined)?.['date-parts']?.[0];
  const year      = dateParts?.[0] ?? new Date().getFullYear();

  const abstract  = cleanAbstract(crossRefData['abstract'] as string | undefined);
  const urlArr    = crossRefData['URL'] as string | undefined;
  const journal   = (crossRefData['container-title'] as string[] | undefined)?.[0];
  const publisher = crossRefData['publisher'] as string | undefined;

  const result: DoiLookupResult = { title, authors, year, abstract, doi: normalised, url: urlArr, journal, publisher };
  return NextResponse.json(result);
}