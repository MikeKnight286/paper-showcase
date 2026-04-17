import { NextResponse } from "next/server";
import { getPapers } from "@/lib/papers";

export async function GET() {
  const papers = getPapers();
  return NextResponse.json(papers);
}
