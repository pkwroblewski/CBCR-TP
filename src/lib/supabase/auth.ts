/**
 * Supabase Authentication Utilities
 *
 * Server and client-side authentication functions for Supabase Auth.
 *
 * @module lib/supabase/auth
 */

import { createBrowserSupabaseClient } from './client';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Authentication result
 */
export interface AuthResult<T = unknown> {
  data: T | null;
  error: AuthError | null;
}

/**
 * Sign up result
 */
export interface SignUpResult {
  user: User | null;
  session: Session | null;
}

/**
 * Sign in result
 */
export interface SignInResult {
  user: User | null;
  session: Session | null;
}

/**
 * User profile data for sign up
 */
export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  companyName?: string;
}

// =============================================================================
// CLIENT-SIDE AUTH FUNCTIONS
// =============================================================================

/**
 * Sign up a new user with email and password
 *
 * @param data - Sign up data including email, password, and profile info
 * @returns Result with user and session or error
 *
 * @example
 * ```typescript
 * const { data, error } = await signUp({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!',
 *   fullName: 'John Doe',
 * });
 * ```
 */
export async function signUp(data: SignUpData): Promise<AuthResult<SignUpResult>> {
  const supabase = createBrowserSupabaseClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        company_name: data.companyName,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      user: authData.user,
      session: authData.session,
    },
    error: null,
  };
}

/**
 * Sign in with email and password
 *
 * @param email - User email
 * @param password - User password
 * @returns Result with user and session or error
 *
 * @example
 * ```typescript
 * const { data, error } = await signIn('user@example.com', 'password123');
 * if (error) {
 *   console.error('Login failed:', error.message);
 * }
 * ```
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult<SignInResult>> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      user: data.user,
      session: data.session,
    },
    error: null,
  };
}

/**
 * Sign out the current user
 *
 * @returns Result with error if failed
 *
 * @example
 * ```typescript
 * const { error } = await signOut();
 * if (!error) {
 *   router.push('/login');
 * }
 * ```
 */
export async function signOut(): Promise<AuthResult<null>> {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.auth.signOut();

  return { data: null, error };
}

/**
 * Get the current session
 *
 * @returns Current session or null
 *
 * @example
 * ```typescript
 * const { data: session } = await getSession();
 * if (session) {
 *   console.log('Logged in as:', session.user.email);
 * }
 * ```
 */
export async function getSession(): Promise<AuthResult<Session>> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.auth.getSession();

  return {
    data: data.session,
    error,
  };
}

/**
 * Get the current user
 *
 * @returns Current user or null
 *
 * @example
 * ```typescript
 * const { data: user } = await getUser();
 * if (user) {
 *   console.log('User ID:', user.id);
 * }
 * ```
 */
export async function getUser(): Promise<AuthResult<User>> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.auth.getUser();

  return {
    data: data.user,
    error,
  };
}

/**
 * Send password reset email
 *
 * @param email - Email address to send reset link
 * @returns Result with error if failed
 *
 * @example
 * ```typescript
 * const { error } = await resetPassword('user@example.com');
 * if (!error) {
 *   alert('Check your email for reset link');
 * }
 * ```
 */
export async function resetPassword(email: string): Promise<AuthResult<null>> {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  return { data: null, error };
}

/**
 * Update user password
 *
 * @param newPassword - New password
 * @returns Result with updated user or error
 *
 * @example
 * ```typescript
 * const { data, error } = await updatePassword('NewSecurePass123!');
 * ```
 */
export async function updatePassword(
  newPassword: string
): Promise<AuthResult<User>> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return {
    data: data.user,
    error,
  };
}

/**
 * Update user profile
 *
 * @param updates - Profile updates
 * @returns Result with updated user or error
 *
 * @example
 * ```typescript
 * const { data, error } = await updateProfile({
 *   full_name: 'Jane Doe',
 *   company_name: 'Acme Inc',
 * });
 * ```
 */
export async function updateProfile(
  updates: Record<string, unknown>
): Promise<AuthResult<User>> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });

  return {
    data: data.user,
    error,
  };
}

/**
 * Listen to auth state changes
 *
 * @param callback - Callback function when auth state changes
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('User signed in:', session?.user.email);
 *   }
 * });
 *
 * // Clean up
 * unsubscribe();
 * ```
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const supabase = createBrowserSupabaseClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number
 */
export function isStrongPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get user-friendly error message from auth error
 */
export function getAuthErrorMessage(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please verify your email before signing in.',
    'User already registered': 'An account with this email already exists.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Signup requires a valid password': 'Please enter a valid password.',
    'Unable to validate email address: invalid format': 'Please enter a valid email address.',
  };

  return errorMessages[error.message] || error.message || 'An unexpected error occurred.';
}

