import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // We only want to protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Exclude the login page itself
  if (pathname === '/admin/login') {
    // If the user is already logged in, redirect them away from login
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
    return NextResponse.next();
  }

  // Check for the auth cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    // No token found, redirect to login
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  
  // Verify the token
  const payload = await verifyToken(token);
  
  if (!payload) {
    // Token is invalid or expired
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
  
  // Token is valid, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
