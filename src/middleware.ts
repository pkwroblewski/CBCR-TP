import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// =============================================================================
// CSRF TOKEN CONFIGURATION
// =============================================================================
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Generate a cryptographically secure CSRF token
 */
function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// =============================================================================
// RATE LIMITING FOR AUTH ROUTES (In-memory - for production use Redis)
// =============================================================================
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const AUTH_RATE_LIMIT = 5; // Max 5 attempts
const AUTH_WINDOW_MS = 60 * 1000; // Per minute

function checkAuthRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = authAttempts.get(ip);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of authAttempts.entries()) {
      if (now >= value.resetAt) authAttempts.delete(key);
    }
  }

  if (!entry || now >= entry.resetAt) {
    authAttempts.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > AUTH_RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true };
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Middleware for route protection, authentication, and rate limiting
 *
 * - Rate limits auth routes to prevent brute force attacks
 * - Protects /dashboard/* routes
 * - Redirects unauthenticated users to /login
 * - Redirects authenticated users from auth pages to /dashboard
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Development auth bypass - ONLY works in development mode
  const isDevBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  if (isDevBypass) {
    // Skip all auth checks in development mode when bypass is enabled
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  // Define auth routes for rate limiting
  const authRoutes = ['/login', '/register', '/forgot-password'];
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Apply rate limiting to auth routes (POST requests indicate auth attempts)
  if (isAuthRoute && request.method === 'POST') {
    const clientIP = getClientIP(request);
    const rateLimit = checkAuthRateLimit(clientIP);

    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many authentication attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Limit': String(AUTH_RATE_LIMIT),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // Create a response object to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          // Set cookie on the request for downstream handlers
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Set cookie on the response to persist
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if exists
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/validate',
    '/reports',
    '/settings',
    '/profile',
    '/analytics',
    '/rules',
    '/pillar2',
  ];

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Note: authRoutes and isAuthRoute already defined above for rate limiting

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && session) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    const destination = redirectTo || '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Set CSRF token cookie if not present
  const existingCsrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!existingCsrfToken) {
    const csrfToken = generateCsrfToken();
    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false, // Must be readable by JavaScript to include in headers
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: CSRF_COOKIE_MAX_AGE,
    });
  }

  return response;
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - API routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};

