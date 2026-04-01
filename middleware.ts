import { NextRequest, NextResponse } from 'next/server';

function parseJWT(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get('prajna_token')?.value;
  const path = req.nextUrl.pathname;

  if (path === '/login' || path.startsWith('/api/') || path.startsWith('/_next/')) {
    if (path === '/login' && token) {
      const payload = parseJWT(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        const home = payload.role === 'student' ? '/student' : '/org';
        return NextResponse.redirect(new URL(home, req.url));
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const payload = parseJWT(token);
  if (!payload || payload.exp * 1000 < Date.now()) {
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('prajna_token');
    return response;
  }

  const role = payload.role;
  if (path.startsWith('/student') && role !== 'student') {
    return NextResponse.redirect(new URL('/org', req.url));
  }
  if (path.startsWith('/org') && role === 'student') {
    return NextResponse.redirect(new URL('/student', req.url));
  }

  if (path === '/') {
    const home = role === 'student' ? '/student' : '/org';
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
