import { NextRequest, NextResponse } from "next/server";
import { removePaper } from "@/lib/papers";

// Localhost enforcement is handled by middleware.ts
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removed = removePaper(id);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}