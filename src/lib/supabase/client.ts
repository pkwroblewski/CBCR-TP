/**
 * Supabase Browser Client
 *
 * Provides typed Supabase client for browser/client components.
 *
 * @module lib/supabase/client
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// =============================================================================
// ENVIRONMENT VARIABLES
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// =============================================================================
// BROWSER CLIENT
// =============================================================================

/**
 * Create a Supabase client for use in browser/client components
 *
 * This client uses the anonymous key and respects RLS policies.
 * Use this in React components with 'use client' directive.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { createBrowserSupabaseClient } from '@/lib/supabase/client';
 *
 * export function MyComponent() {
 *   const supabase = createBrowserSupabaseClient();
 *   // Use supabase client...
 * }
 * ```
 */
export function createBrowserSupabaseClient() {
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';
  return createBrowserClient<Database>(url, key);
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { Database } from './database.types';
