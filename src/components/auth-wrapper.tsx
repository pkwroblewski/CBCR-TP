'use client';

/**
 * Auth Wrapper Components
 *
 * Conditionally renders Clerk components based on whether Clerk is configured.
 * This allows the build to succeed without environment variables.
 *
 * @module components/auth-wrapper
 */

import { ReactNode } from 'react';
import {
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  UserButton as ClerkUserButton,
  SignInButton as ClerkSignInButton,
  UserProfile as ClerkUserProfile,
} from '@clerk/nextjs';

// Check if Clerk is configured
const IS_CLERK_CONFIGURED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// =============================================================================
// SIGNED IN WRAPPER
// =============================================================================

interface SignedInProps {
  children: ReactNode;
}

/**
 * Shows children only when user is signed in.
 * Falls back to showing nothing if Clerk is not configured.
 */
export function SignedIn({ children }: SignedInProps) {
  if (!IS_CLERK_CONFIGURED) {
    // In development without Clerk, show the content
    return <>{children}</>;
  }
  return <ClerkSignedIn>{children}</ClerkSignedIn>;
}

// =============================================================================
// SIGNED OUT WRAPPER
// =============================================================================

interface SignedOutProps {
  children: ReactNode;
}

/**
 * Shows children only when user is signed out.
 * Falls back to showing nothing if Clerk is not configured.
 */
export function SignedOut({ children }: SignedOutProps) {
  if (!IS_CLERK_CONFIGURED) {
    // In development without Clerk, hide sign-in prompts
    return null;
  }
  return <ClerkSignedOut>{children}</ClerkSignedOut>;
}

// =============================================================================
// USER BUTTON WRAPPER
// =============================================================================

interface UserButtonProps {
  afterSignOutUrl?: string;
  appearance?: {
    elements?: Record<string, string>;
  };
}

/**
 * Clerk UserButton with fallback for unconfigured state.
 */
export function UserButton({ afterSignOutUrl, appearance }: UserButtonProps) {
  if (!IS_CLERK_CONFIGURED) {
    // Placeholder when Clerk is not configured
    return (
      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs">
        U
      </div>
    );
  }
  return <ClerkUserButton afterSignOutUrl={afterSignOutUrl} appearance={appearance} />;
}

// =============================================================================
// SIGN IN BUTTON WRAPPER
// =============================================================================

interface SignInButtonProps {
  mode?: 'modal' | 'redirect';
  children: ReactNode;
}

/**
 * Clerk SignInButton with fallback for unconfigured state.
 */
export function SignInButton({ mode = 'modal', children }: SignInButtonProps) {
  if (!IS_CLERK_CONFIGURED) {
    // Just render the button without functionality
    return <>{children}</>;
  }
  return <ClerkSignInButton mode={mode}>{children}</ClerkSignInButton>;
}

// =============================================================================
// USER PROFILE WRAPPER
// =============================================================================

import type { ComponentProps } from 'react';

type ClerkUserProfileProps = ComponentProps<typeof ClerkUserProfile>;

/**
 * Clerk UserProfile with fallback for unconfigured state.
 */
export function UserProfile(props: ClerkUserProfileProps) {
  if (!IS_CLERK_CONFIGURED) {
    // Placeholder when Clerk is not configured
    return (
      <div className="p-8 text-center text-slate-400">
        <p>User profile management requires Clerk configuration.</p>
        <p className="text-sm mt-2">Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment.</p>
      </div>
    );
  }
  return <ClerkUserProfile {...props} />;
}
