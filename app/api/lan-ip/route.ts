import { NextResponse } from 'next/server';
import { getLanIp } from '@/lib/network';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ip = getLanIp();
  if (!ip) {
    return NextResponse.json({ error: 'No LAN IP found' }, { status: 503 });
  }
  return NextResponse.json({ ip });
}
