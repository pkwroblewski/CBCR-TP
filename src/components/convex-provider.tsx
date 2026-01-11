"use client";

import { ReactNode, useMemo } from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

// Check if Clerk is configured
const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

// Check if it's a real Convex URL (not placeholder)
const IS_CONVEX_CONFIGURED = CONVEX_URL && CONVEX_URL.includes('.convex.cloud');

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    // Only create real client if Convex is properly configured
    if (IS_CONVEX_CONFIGURED) {
      return new ConvexReactClient(CONVEX_URL as string);
    }
    // Return null if not configured - we'll handle this below
    return null;
  }, []);

  // If Clerk is not configured, render children without auth providers
  if (!CLERK_KEY) {
    // No auth - just render children directly
    return <>{children}</>;
  }

  // If Convex is not configured but Clerk is, just use Clerk
  if (!convex) {
    return (
      <ClerkProvider
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#3b82f6",
            colorBackground: "#0f172a",
            colorInputBackground: "#1e293b",
            colorInputText: "#f1f5f9",
          },
        }}
      >
        {children}
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#0f172a",
          colorInputBackground: "#1e293b",
          colorInputText: "#f1f5f9",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
