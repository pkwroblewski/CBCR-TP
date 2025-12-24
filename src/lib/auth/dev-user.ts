/**
 * Development User Helper
 *
 * Provides a mock user and bypass detection for development mode.
 * This allows developers to test the application without authentication.
 *
 * SECURITY: Only works when NODE_ENV=development AND NEXT_PUBLIC_DEV_AUTH_BYPASS=true
 *
 * @module lib/auth/dev-user
 */

/**
 * Mock user for development mode
 */
export const DEV_USER = {
  id: 'dev-user-id',
  email: 'developer@localhost',
  name: 'Developer',
  initials: 'DV',
} as const;

/**
 * Check if development authentication bypass is enabled.
 *
 * This function performs a double-check:
 * 1. NODE_ENV must be 'development'
 * 2. NEXT_PUBLIC_DEV_AUTH_BYPASS must be 'true'
 *
 * @returns true if auth bypass is enabled, false otherwise
 */
export function isDevAuthBypass(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'
  );
}

/**
 * Log a warning to the console when dev auth bypass is active.
 * Call this once at application startup.
 */
export function logDevAuthWarning(): void {
  if (isDevAuthBypass()) {
    console.warn(
      '\n🔓 DEV MODE: Authentication is BYPASSED\n' +
        '   Set NEXT_PUBLIC_DEV_AUTH_BYPASS=false to enable auth\n'
    );
  }
}
