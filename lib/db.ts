import fs from 'fs';
import path from 'path';
import type { Paper, PendingPaper } from '@/types';

const PAPERS_PATH  = path.join(process.cwd(), 'data', 'papers.json');
const PENDING_PATH = path.join(process.cwd(), 'data', 'pending.json');
const PENDING_DIR  = path.join(process.cwd(), 'data', 'pending');
const PUBLIC_PDF_DIR = path.join(process.cwd(), 'public', 'papers');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getPapers(): Paper[] {
  try {
    return JSON.parse(fs.readFileSync(PAPERS_PATH, 'utf-8')) as Paper[];
  } catch {
    return [];
  }
}

export function savePapers(papers: Paper[]): void {
  fs.writeFileSync(PAPERS_PATH, JSON.stringify(papers, null, 2), 'utf-8');
}

export function getPendingPapers(): PendingPaper[] {
  try {
    return JSON.parse(fs.readFileSync(PENDING_PATH, 'utf-8')) as PendingPaper[];
  } catch {
    return [];
  }
}

export function savePendingPapers(pending: PendingPaper[]): void {
  fs.writeFileSync(PENDING_PATH, JSON.stringify(pending, null, 2), 'utf-8');
}

export function getPendingFilePath(filename: string): string {
  ensureDir(PENDING_DIR);
  // Prevent path traversal: strip everything except the basename
  const safe = path.basename(filename);
  return path.join(PENDING_DIR, safe);
}

export function getPublicPdfPath(filename: string): string {
  ensureDir(PUBLIC_PDF_DIR);
  const safe = path.basename(filename);
  return path.join(PUBLIC_PDF_DIR, safe);
}

export function paperExists(doi: string): boolean {
  const papers = getPapers();
  return papers.some(p => p.doi && p.doi.toLowerCase() === doi.toLowerCase());
}
