import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { paperExists } from '@/lib/db';
import type { DoiLookupResult } from '@/types';

export const dynamic = 'force-dynamic';

function cleanAbstract(raw: string | undefined): string {
  if (!raw) return '';
  return raw.replace(/<[^>]+>/g, '').trim();
}

/** Accepts DOIs (bare, doi:, doi.org URLs) and arXiv IDs/URLs → bare DOI. */
function normaliseDoi(input: string): string {
  const s = input.trim().replace(/^doi:\s*/i, '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  // ponytail: new-style arXiv IDs only (YYMM.NNNNN); old "hep-th/9901001" IDs must be pasted as DOIs
  const arxiv = s.match(/^(?:arxiv:\s*|https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\/)?(\d{4}\.\d{4,5})(?:v\d+)?(?:\.pdf)?\/?$/i);
  return arxiv ? `10.48550/arXiv.${arxiv[1]}` : s;
}

async function fetchWithRetry(url: string): Promise<Response> {
  // CrossRef polite pool: provide a real mailto — grants much higher rate limits
  const headers = {
    'User-Agent': 'paper-showcase/1.0 (mailto:your-email@example.com; polite pool)',
    'Accept': 'application/json',
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 429 && attempt < 2) {
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

function fromCrossRef(m: Record<string, unknown>, doi: string): DoiLookupResult {
  const authorArr = m['author'] as Array<{ given?: string; family?: string; name?: string }> | undefined;
  const dateParts = (m['published'] as { 'date-parts'?: number[][] } | undefined)?.['date-parts']?.[0];
  return {
    title:     (m['title'] as string[] | undefined)?.[0] ?? 'Unknown Title',
    authors:   (authorArr ?? []).map(a => [a.given, a.family].filter(Boolean).join(' ') || a.name || ''),
    year:      dateParts?.[0] ?? new Date().getFullYear(),
    abstract:  cleanAbstract(m['abstract'] as string | undefined),
    doi,
    url:       m['URL'] as string | undefined,
    journal:   (m['container-title'] as string[] | undefined)?.[0],
    publisher: m['publisher'] as string | undefined,
  };
}

interface DataCiteAttrs {
  titles?: { title: string }[];
  creators?: { name?: string; givenName?: string; familyName?: string }[];
  publicationYear?: number | string;
  descriptions?: { description?: string; descriptionType?: string }[];
  url?: string;
  publisher?: string | { name?: string };
  container?: { title?: string };
}

function fromDataCite(a: DataCiteAttrs, doi: string): DoiLookupResult {
  const abstract = a.descriptions?.find(d => d.descriptionType === 'Abstract') ?? a.descriptions?.[0];
  return {
    title:     a.titles?.[0]?.title ?? 'Unknown Title',
    authors:   (a.creators ?? []).map(c => [c.givenName, c.familyName].filter(Boolean).join(' ') || c.name || ''),
    year:      Number(a.publicationYear) || new Date().getFullYear(),
    abstract:  cleanAbstract(abstract?.description),
    doi,
    url:       a.url,
    journal:   a.container?.title,
    publisher: typeof a.publisher === 'string' ? a.publisher : a.publisher?.name,
  };
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { doi } = await req.json();
  if (!doi || typeof doi !== 'string') {
    return NextResponse.json({ error: 'doi is required' }, { status: 400 });
  }

  const normalised = normaliseDoi(doi);

  if (paperExists(normalised)) {
    return NextResponse.json({ error: 'This DOI already exists in the library' }, { status: 409 });
  }

  // CrossRef first (journals, conferences); on 404 fall back to DataCite (arXiv, Zenodo, datasets)
  const sources = [
    { name: 'CrossRef', url: `https://api.crossref.org/works/${encodeURIComponent(normalised)}`,
      parse: (j: { message: Record<string, unknown> }) => fromCrossRef(j.message, normalised) },
    { name: 'DataCite', url: `https://api.datacite.org/dois/${encodeURIComponent(normalised)}`,
      parse: (j: { data: { attributes: DataCiteAttrs } }) => fromDataCite(j.data.attributes, normalised) },
  ];

  for (const src of sources) {
    let response: Response;
    try {
      response = await fetchWithRetry(src.url);
    } catch {
      return NextResponse.json({ error: `Failed to reach ${src.name} — check your internet connection` }, { status: 502 });
    }
    if (response.status === 404) continue;
    if (response.status === 429) {
      return NextResponse.json({ error: `${src.name} rate limit reached — wait a moment and try again` }, { status: 429 });
    }
    if (!response.ok) {
      return NextResponse.json({ error: `${src.name} returned ${response.status}` }, { status: 502 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(src.parse(await response.json() as any));
  }

  return NextResponse.json({ error: 'DOI not found in CrossRef or DataCite' }, { status: 404 });
}
