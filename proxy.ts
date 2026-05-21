import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // req.ip was removed in Next.js 16 — use x-forwarded-for only
    const forwarded = req.headers.get('x-forwarded-for') ?? '';
    const ip = forwarded.split(',')[0].trim();

    const fromLocalhost =
      ip === '' ||
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1';

    const sessionToken = req.cookies.get('admin_session')?.value;
    const validToken   = process.env.ADMIN_PASSWORD ?? 'changeme_now';
    const authed       = fromLocalhost || sessionToken === validToken;

    if (!authed) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};