import { NextRequest } from 'next/server';

// Password only. No "localhost = admin": Next fills x-forwarded-for only when the client
// didn't send one, so any device could claim to be 127.0.0.1.
export function isAdmin(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('admin_session')?.value;
  const validToken   = process.env.ADMIN_PASSWORD ?? 'changeme_now';
  return sessionToken === validToken;
}
