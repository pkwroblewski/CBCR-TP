/**
 * Supabase Server Client
 *
 * Provides typed Supabase clients for server contexts:
 * - Server client for server components and API routes
 * - Service role client for admin operations
 *
 * @module lib/supabase/server
 */

import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

// =============================================================================
// ENVIRONMENT VARIABLES
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// =============================================================================
// SERVER CLIENT
// =============================================================================

/**
 * Create a Supabase client for use in server components and API routes
 *
 * This client handles cookie-based authentication for SSR.
 * Use this in Server Components and Route Handlers.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { createServerSupabaseClient } from '@/lib/supabase/server';
 *
 * export default async function Page() {
 *   const supabase = await createServerSupabaseClient();
 *   const { data } = await supabase.from('profiles').select('*');
 *   return <div>...</div>;
 * }
 * ```
 *
 * @example
 * ```ts
 * // In an API Route
 * import { createServerSupabaseClient } from '@/lib/supabase/server';
 *
 * export async function GET() {
 *   const supabase = await createServerSupabaseClient();
 *   const { data } = await supabase.from('validation_reports').select('*');
 *   return Response.json(data);
 * }
 * ```
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// =============================================================================
// SERVICE ROLE CLIENT
// =============================================================================

/**
 * Create a Supabase client with service role privileges
 *
 * WARNING: This client bypasses RLS. Only use for admin operations
 * that require elevated privileges (e.g., background jobs, admin APIs).
 *
 * @example
 * ```ts
 * import { createServiceRoleClient } from '@/lib/supabase/server';
 *
 * // In an admin API route
 * export async function POST(request: Request) {
 *   const supabase = createServiceRoleClient();
 *   // Can perform operations without RLS restrictions
 *   const { data } = await supabase.from('profiles').select('*');
 *   return Response.json(data);
 * }
 * ```
 */
export function createServiceRoleClient() {
  if (!supabaseServiceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Service role client is only available on the server.'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the current authenticated user from a server context
 *
 * @example
 * ```ts
 * import { getUser } from '@/lib/supabase/server';
 *
 * export default async function ProtectedPage() {
 *   const user = await getUser();
 *   if (!user) {
 *     redirect('/login');
 *   }
 *   return <div>Welcome, {user.email}</div>;
 * }
 * ```
 */
export async function getUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session from a server context
 */
export async function getSession() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  return !!user;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  return profile?.role === 'admin';
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { Database } from './database.types';

