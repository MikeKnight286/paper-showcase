import { NextRequest, NextResponse } from "next/server";
import { addPaper } from "@/lib/papers";

// Localhost enforcement is handled by middleware.ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title || !body.abstract || !body.link || !body.venue || !body.year) {
    return NextResponse.json(
      { error: "title, abstract, link, venue, and year are required" },
      { status: 400 }
    );
  }
  const paper = addPaper({
    title: body.title,
    abstract: body.abstract,
    link: body.link,
    tags: Array.isArray(body.tags) ? body.tags : [],
    authors: Array.isArray(body.authors) ? body.authors : [],
    year: typeof body.year === "number" ? body.year : parseInt(body.year) || 0,
    venue: body.venue,
  });
  return NextResponse.json(paper, { status: 201 });
}