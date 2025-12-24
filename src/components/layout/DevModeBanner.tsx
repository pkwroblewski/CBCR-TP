'use client';

/**
 * Development Mode Banner
 *
 * Displays a visual indicator when authentication is bypassed in development mode.
 * This helps developers remember that auth is disabled.
 *
 * @module components/layout/DevModeBanner
 */

import { isDevAuthBypass } from '@/lib/auth/dev-user';

/**
 * Banner component that shows when dev auth bypass is active
 */
export function DevModeBanner() {
  // Only render in development with bypass enabled
  if (!isDevAuthBypass()) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-amber-950 text-xs text-center py-1 font-medium sticky top-0 z-50">
      <span className="inline-flex items-center gap-1">
        <span>🔓</span>
        <span>DEV MODE - Authentication Bypassed</span>
        <span className="hidden sm:inline text-amber-800">
          (Set NEXT_PUBLIC_DEV_AUTH_BYPASS=false to enable auth)
        </span>
      </span>
    </div>
  );
}
