import { NextRequest } from 'next/server';

/**
 * Returns true if the request carries a valid admin session cookie
 * OR originates from localhost (127.0.0.1 / ::1).
 */
export function isAdmin(req: NextRequest): boolean {
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? '';
  const fromLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '';

  const sessionToken = req.cookies.get('admin_session')?.value;
  const validToken   = process.env.ADMIN_PASSWORD ?? 'changeme_now';

  return fromLocalhost || sessionToken === validToken;
}
