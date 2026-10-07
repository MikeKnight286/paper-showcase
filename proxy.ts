import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !isAdmin(req)) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
