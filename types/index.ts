export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  tags: string[];
  doi?: string;
  url?: string;
  pdfFile?: string;   // filename inside public/papers/
  addedAt: string;    // ISO date string
}

export interface PendingPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  tags: string[];
  doi?: string;
  url?: string;
  pdfFile: string;    // filename inside data/pending/
  submittedAt: string;
  submitterNote?: string;
  uploaderToken?: string;  // anonymous browser-local UUID for grouping uploads
}

export interface DoiLookupResult {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  doi: string;
  url?: string;
  journal?: string;
  publisher?: string;
}
