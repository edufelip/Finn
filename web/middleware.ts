import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const CANONICAL_HOST = 'finnsocial.fun';
const WWW_HOST = 'www.finnsocial.fun';

export function middleware(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  if (hostname === WWW_HOST && !pathname.startsWith('/.well-known')) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
