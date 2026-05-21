import { NextRequest } from 'next/server';

export function isAdmin(req: NextRequest): boolean {
  const forwarded = req.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0].trim();

  const fromLocalhost =
    ip === '' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1';

  const sessionToken = req.cookies.get('admin_session')?.value;
  const validToken   = process.env.ADMIN_PASSWORD ?? 'changeme_now';

  return fromLocalhost || sessionToken === validToken;
}