// Every word in the query must appear somewhere in title, authors, venue, year or tags.
export function matchesQuery(
  p: { title: string; authors?: string[]; tags?: string[]; year?: number; venue?: string },
  query: string,
): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = [p.title, p.authors?.join(" "), p.venue, p.year, p.tags?.join(" ")].join(" ").toLowerCase();
  return words.every((w) => hay.includes(w));
}

