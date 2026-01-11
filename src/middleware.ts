import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/resources(.*)",
  "/api/validate(.*)",
]);

// Check if Clerk is configured
const isClerkConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
};

// Fallback middleware when Clerk is not configured
function fallbackMiddleware(request: NextRequest) {
  // Allow all public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }
  
  // For protected routes without Clerk, redirect to home
  // This prevents the app from crashing
  console.warn('[Middleware] Clerk not configured, redirecting to home');
  return NextResponse.redirect(new URL('/', request.url));
}

// Export the appropriate middleware based on configuration
export default async function middleware(request: NextRequest) {
  if (!isClerkConfigured()) {
    return fallbackMiddleware(request);
  }
  
  // Use Clerk middleware when configured
  return clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  })(request, {} as any);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
