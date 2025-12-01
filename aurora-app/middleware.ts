import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/feed',
  '/map',
  '/opportunities',
  '/assistant',
  '/profile',
  '/settings',
  '/messages',
  '/routes',
  '/reels',
  '/live',
  '/health',
  '/circles',
  '/credits',
  '/emergency',
  '/accompaniment',
  '/creator',
  '/premium',
  '/report',
  '/resources',
  '/intelligence',
];

// Public routes that don't require auth
const publicRoutes = ['/', '/offline', '/legal'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Skip public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith('/legal'))) {
    return response;
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Check for authentication cookie
    const accessToken = request.cookies.get('workos_access_token');

    if (!accessToken) {
      // Redirect to home page if not authenticated
      const url = new URL('/', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon|manifest|sw.js|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
