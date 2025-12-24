'use client';

/**
 * Authentication Hook
 *
 * Custom React hook for managing authentication state and actions.
 *
 * @module hooks/useAuth
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  getSession,
  getUser,
  onAuthStateChange,
  resetPassword as authResetPassword,
  isValidEmail,
  isStrongPassword,
  getAuthErrorMessage,
} from '@/lib/supabase/auth';
import type { SignUpData } from '@/lib/supabase/auth';

// =============================================================================
// AUDIT LOGGING HELPER
// =============================================================================

/**
 * Log an authentication event to the audit log
 */
async function logAuthEvent(
  eventType: 'login_success' | 'login_failure' | 'logout' | 'password_reset_request',
  options: {
    email?: string;
    userId?: string;
    reason?: string;
  } = {}
) {
  try {
    await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        eventCategory: 'authentication',
        action: eventType.replace(/_/g, ' '),
        status: eventType.includes('failure') ? 'failure' : 'success',
        severity: eventType.includes('failure') ? 'warning' : 'info',
        message: options.reason || `Authentication event: ${eventType}`,
        metadata: { email: options.email },
      }),
    });
  } catch {
    // Silently fail - don't block auth operations for audit logging
    console.debug('Failed to log auth event:', eventType);
  }
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Authentication state
 */
export interface AuthState {
  /** Current user */
  user: User | null;
  /** Current session */
  session: Session | null;
  /** Whether auth state is loading */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Authentication error if any */
  error: string | null;
}

/**
 * Authentication actions
 */
export interface AuthActions {
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<boolean>;
  /** Sign up with email, password, and profile data */
  signUp: (data: SignUpData) => Promise<boolean>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Send password reset email */
  resetPassword: (email: string) => Promise<boolean>;
  /** Clear any auth errors */
  clearError: () => void;
  /** Refresh the current session */
  refreshSession: () => Promise<void>;
}

/**
 * Complete useAuth hook return type
 */
export interface UseAuthReturn extends AuthState, AuthActions {}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Custom hook for authentication management
 *
 * Provides auth state and methods for sign in, sign up, and sign out.
 * Automatically tracks authentication state changes.
 *
 * @example
 * ```tsx
 * function LoginButton() {
 *   const { isAuthenticated, isLoading, signIn, error } = useAuth();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   if (isAuthenticated) {
 *     return <span>Logged in!</span>;
 *   }
 *
 *   const handleLogin = async () => {
 *     const success = await signIn('user@example.com', 'password');
 *     if (success) {
 *       router.push('/dashboard');
 *     }
 *   };
 *
 *   return (
 *     <>
 *       {error && <Alert>{error}</Alert>}
 *       <Button onClick={handleLogin}>Log In</Button>
 *     </>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  /**
   * Update state partially
   */
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Initialize auth state
   */
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: session } = await getSession();
        const { data: user } = await getUser();

        if (mounted) {
          setState({
            user,
            session,
            isLoading: false,
            isAuthenticated: !!user,
            error: null,
          });
        }
      } catch (err) {
        if (mounted) {
          setState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            error: 'Failed to initialize authentication',
          });
        }
      }
    };

    initAuth();

    // Listen to auth changes
    const unsubscribe = onAuthStateChange((event, session) => {
      if (mounted) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setState({
            user: session?.user ?? null,
            session,
            isLoading: false,
            isAuthenticated: !!session,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      updateState({ isLoading: true, error: null });

      // Validate input
      if (!isValidEmail(email)) {
        updateState({
          isLoading: false,
          error: 'Please enter a valid email address',
        });
        return false;
      }

      if (!password) {
        updateState({
          isLoading: false,
          error: 'Please enter your password',
        });
        return false;
      }

      const { data, error } = await authSignIn(email, password);

      if (error) {
        // Log failed login attempt
        logAuthEvent('login_failure', {
          email,
          reason: getAuthErrorMessage(error),
        });

        updateState({
          isLoading: false,
          error: getAuthErrorMessage(error),
        });
        return false;
      }

      // Log successful login
      logAuthEvent('login_success', {
        email,
        userId: data?.user?.id,
      });

      updateState({
        user: data?.user ?? null,
        session: data?.session ?? null,
        isLoading: false,
        isAuthenticated: !!data?.user,
        error: null,
      });

      return true;
    },
    [updateState]
  );

  /**
   * Sign up with profile data
   */
  const signUp = useCallback(
    async (data: SignUpData): Promise<boolean> => {
      updateState({ isLoading: true, error: null });

      // Validate input
      if (!isValidEmail(data.email)) {
        updateState({
          isLoading: false,
          error: 'Please enter a valid email address',
        });
        return false;
      }

      const passwordCheck = isStrongPassword(data.password);
      if (!passwordCheck.isValid) {
        updateState({
          isLoading: false,
          error: passwordCheck.errors[0],
        });
        return false;
      }

      if (!data.fullName.trim()) {
        updateState({
          isLoading: false,
          error: 'Please enter your full name',
        });
        return false;
      }

      const { data: result, error } = await authSignUp(data);

      if (error) {
        updateState({
          isLoading: false,
          error: getAuthErrorMessage(error),
        });
        return false;
      }

      updateState({
        user: result?.user ?? null,
        session: result?.session ?? null,
        isLoading: false,
        isAuthenticated: !!result?.session,
        error: null,
      });

      return true;
    },
    [updateState]
  );

  /**
   * Sign out
   */
  const signOut = useCallback(async (): Promise<void> => {
    const currentUserId = state.user?.id;
    const currentEmail = state.user?.email;

    updateState({ isLoading: true, error: null });

    const { error } = await authSignOut();

    if (error) {
      updateState({
        isLoading: false,
        error: getAuthErrorMessage(error),
      });
      return;
    }

    // Log logout event
    logAuthEvent('logout', {
      userId: currentUserId,
      email: currentEmail,
    });

    updateState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });

    router.push('/login');
  }, [updateState, router, state.user]);

  /**
   * Reset password
   */
  const resetPassword = useCallback(
    async (email: string): Promise<boolean> => {
      updateState({ isLoading: true, error: null });

      if (!isValidEmail(email)) {
        updateState({
          isLoading: false,
          error: 'Please enter a valid email address',
        });
        return false;
      }

      const { error } = await authResetPassword(email);

      if (error) {
        updateState({
          isLoading: false,
          error: getAuthErrorMessage(error),
        });
        return false;
      }

      // Log password reset request
      logAuthEvent('password_reset_request', { email });

      updateState({ isLoading: false, error: null });
      return true;
    },
    [updateState]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async () => {
    const { data: session } = await getSession();
    const { data: user } = await getUser();

    updateState({
      user,
      session,
      isAuthenticated: !!user,
    });
  }, [updateState]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
    refreshSession,
  };
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export { isValidEmail, isStrongPassword } from '@/lib/supabase/auth';

