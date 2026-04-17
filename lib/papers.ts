import fs from "fs";
import path from "path";

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  link: string;
  tags: string[];
  authors: string[];      // ← new
  year: number;           // ← new
  venue: string;          // ← new (journal or conference)
}

const DATA_PATH = path.join(process.cwd(), "data", "papers.json");

export function getPapers(): Paper[] {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as Paper[];
}

export function savePapers(papers: Paper[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(papers, null, 2), "utf-8");
}

export function addPaper(paper: Omit<Paper, "id">): Paper {
  const papers = getPapers();
  const newPaper: Paper = {
    ...paper,
    id: Date.now().toString(),
  };
  papers.push(newPaper);
  savePapers(papers);
  return newPaper;
}

export function removePaper(id: string): boolean {
  const papers = getPapers();
  const filtered = papers.filter((p) => p.id !== id);
  if (filtered.length === papers.length) return false;
  savePapers(filtered);
  return true;
}

export function getAllTags(papers: Paper[]): string[] {
  const tagSet = new Set<string>();
  papers.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
