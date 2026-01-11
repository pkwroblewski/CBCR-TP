# CbCR Project Migration Specification
## From Supabase + Google Auth to Clerk + Convex

This document provides comprehensive instructions for refactoring the CbCR (Country-by-Country Reporting) validation application from its current Supabase-based architecture to a Clerk + Convex stack, matching the UI/UX patterns of the TP-Extractor project.

---

## Table of Contents

1. [Overview](#overview)
2. [Current vs Target Architecture](#current-vs-target-architecture)
3. [Phase 1: Dependencies & Configuration](#phase-1-dependencies--configuration)
4. [Phase 2: Authentication Migration](#phase-2-authentication-migration)
5. [Phase 3: Database Migration](#phase-3-database-migration)
6. [Phase 4: File Upload Migration](#phase-4-file-upload-migration)
7. [Phase 5: UI/UX Transformation](#phase-5-uiux-transformation)
8. [Phase 6: Component Updates](#phase-6-component-updates)
9. [Preserved Logic (Do Not Modify)](#preserved-logic-do-not-modify)
10. [Environment Variables](#environment-variables)
11. [Testing Checklist](#testing-checklist)

---

## Overview

### Goal
Transform the CbCR validation app to use:
- **Clerk** for authentication (replacing Supabase Auth + Google OAuth)
- **Convex** for backend/database (replacing Supabase PostgreSQL)
- **Dark-first UI** matching TP-Extractor's design language

### Preservation Requirements
All CbCR-specific business logic MUST remain unchanged:
- XML parsing and validation
- OECD validation rules
- Country-specific validators
- Pillar 2 analysis
- Report generation

---

## Current vs Target Architecture

| Aspect | Current (CbCR) | Target |
|--------|---------------|--------|
| **Auth Provider** | Supabase SSR (@supabase/ssr) | Clerk (@clerk/nextjs) |
| **Auth Method** | Email/Password + Google OAuth | Clerk (supports multiple providers) |
| **Database** | Supabase PostgreSQL | Convex |
| **File Storage** | Client-side processing | Convex Storage |
| **Middleware** | Custom Supabase session check | Clerk middleware |
| **State Management** | Supabase client hooks | Convex React hooks |
| **Fonts** | Plus Jakarta Sans + JetBrains Mono | Inter + JetBrains Mono |
| **Theme** | Light/dark toggle | Dark-first (slate-950) |
| **Toast Provider** | sonner | Custom toast provider |
| **Tailwind** | v4 | v3 |

---

## Phase 1: Dependencies & Configuration

### 1.1 Remove Supabase Dependencies

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

### 1.2 Add Clerk + Convex Dependencies

```bash
npm install @clerk/nextjs @clerk/themes convex
```

### 1.3 Downgrade Tailwind (Optional but Recommended)

The target project uses Tailwind v3 with a different configuration approach:

```bash
npm uninstall @tailwindcss/postcss tailwindcss tw-animate-css
npm install tailwindcss@^3.4.14 autoprefixer tailwindcss-animate
```

### 1.4 Replace Toast Provider

```bash
npm uninstall sonner
# The target uses a custom toast provider - copy from reference
```

### 1.5 Create Convex Configuration

Create `convex.json` in project root:

```json
{
  "functions": "convex/"
}
```

Create `convex/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ES2021", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 1.6 Update package.json Scripts

Add Convex dev script:

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:convex": "convex dev",
    "build": "next build",
    "start": "next start"
  }
}
```

---

## Phase 2: Authentication Migration

### 2.1 Create Convex Auth Configuration

Create `convex/auth.config.ts`:

```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://your-clerk-domain.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
```

### 2.2 Create Convex Provider Component

Create `src/components/convex-provider.tsx`:

```typescript
"use client";

import { ReactNode, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    if (!CONVEX_URL) {
      throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable.");
    }
    return new ConvexReactClient(CONVEX_URL);
  }, []);

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
```

### 2.3 Update Root Layout

Replace `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { ConvexClientProvider } from "@/components/convex-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "PW-(CbCR) Analyzer - Country-by-Country Report Validation",
  description: "Validate your Country-by-Country Reports against OECD BEPS Action 13 requirements",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-slate-950`}>
        <ConvexClientProvider>
          <ToastProvider>{children}</ToastProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
```

### 2.4 Replace Middleware

Replace `src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/resources(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### 2.5 Replace Auth Pages

**Delete these directories:**
- `src/app/(auth)/login/`
- `src/app/(auth)/register/`
- `src/app/(auth)/forgot-password/`
- `src/app/auth/callback/`

**Create new auth pages:**

`src/app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-8">
          PW-(CbCR) Analyzer
        </h1>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-slate-900 border-slate-700",
            },
          }}
        />
      </div>
    </div>
  );
}
```

`src/app/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-8">
          PW-(CbCR) Analyzer
        </h1>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-slate-900 border-slate-700",
            },
          }}
        />
      </div>
    </div>
  );
}
```

### 2.6 Replace useAuth Hook

Delete `src/hooks/useAuth.ts` and replace usages with Clerk hooks:

```typescript
// Before (Supabase)
import { useAuth } from "@/hooks/useAuth";
const { user, isAuthenticated, signOut } = useAuth();

// After (Clerk)
import { useAuth, useUser } from "@clerk/nextjs";
const { isSignedIn, isLoaded } = useAuth();
const { user } = useUser();
```

### 2.7 Update Header Component

Replace authentication UI in header components:

```typescript
"use client";

import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { LogIn, FileUp, History, Home } from "lucide-react";

export function AuthHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* Logo */}
          <span className="font-bold text-slate-100">CbCR Analyzer</span>
        </Link>

        <div className="flex items-center gap-3">
          <SignedIn>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              href="/validate"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FileUp className="w-4 h-4" />
              <span className="hidden sm:inline">Validate</span>
            </Link>

            <Link
              href="/reports"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </Link>

            <div className="w-px h-6 bg-slate-700" />

            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { avatarBox: "w-8 h-8" },
              }}
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
```

---

## Phase 3: Database Migration

### 3.1 Create Convex Schema

Create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Validation reports (replaces Supabase validation_reports table)
  validationReports: defineTable({
    userId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    reportingPeriod: v.optional(v.string()),
    reportingEntity: v.optional(v.string()),
    jurisdictionCount: v.optional(v.number()),
    totalErrors: v.number(),
    totalWarnings: v.number(),
    validationStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    validationResults: v.any(), // Full JSON validation results
    xmlStorageId: v.optional(v.id("_storage")), // XML file in Convex storage
  }).index("by_user", ["userId"]),

  // User preferences (replaces Supabase user_preferences table)
  userPreferences: defineTable({
    userId: v.string(),
    defaultJurisdiction: v.optional(v.string()),
    enablePillar2: v.boolean(),
    emailNotifications: v.boolean(),
    theme: v.union(v.literal("dark"), v.literal("light"), v.literal("system")),
  }).index("by_user", ["userId"]),

  // DocRefId registry (replaces Supabase docrefid_registry table)
  docRefIdRegistry: defineTable({
    userId: v.string(),
    docRefId: v.string(),
    reportId: v.id("validationReports"),
    messageType: v.string(),
    registeredAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_docref", ["docRefId"]),

  // Audit logs (replaces Supabase audit_logs table)
  auditLogs: defineTable({
    userId: v.optional(v.string()),
    eventType: v.string(),
    eventCategory: v.string(),
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("failure"), v.literal("pending")),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("critical")),
    message: v.string(),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
```

### 3.2 Create Convex Queries and Mutations

Create `convex/validationReports.ts`:

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List user's validation reports
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("validationReports")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

// Get single report by ID
export const get = query({
  args: { id: v.id("validationReports") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const report = await ctx.db.get(args.id);
    if (!report || report.userId !== identity.subject) return null;

    return report;
  },
});

// Generate upload URL for XML storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Save a new validation report
export const save = mutation({
  args: {
    fileName: v.string(),
    fileSize: v.number(),
    reportingPeriod: v.optional(v.string()),
    reportingEntity: v.optional(v.string()),
    jurisdictionCount: v.optional(v.number()),
    totalErrors: v.number(),
    totalWarnings: v.number(),
    validationStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    validationResults: v.any(),
    xmlStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("validationReports", {
      userId: identity.subject,
      ...args,
    });
  },
});

// Delete a validation report
export const remove = mutation({
  args: { id: v.id("validationReports") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const report = await ctx.db.get(args.id);
    if (!report || report.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    if (report.xmlStorageId) {
      await ctx.storage.delete(report.xmlStorageId);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
```

### 3.3 Delete Supabase Files

Delete the following:
- `src/lib/supabase/` (entire directory)
- `supabase/` (entire directory)

---

## Phase 4: File Upload Migration

### 4.1 Update useFileUpload Hook

Replace `src/hooks/useFileUpload.ts` to use Convex:

```typescript
"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [xmlInfo, setXmlInfo] = useState<any>(null);
  const [stage, setStage] = useState<"idle" | "uploading" | "parsing" | "validating" | "complete" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<{ message: string; suggestion?: string } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.validationReports.generateUploadUrl);
  const saveReport = useMutation(api.validationReports.save);

  const validateFile = useCallback((file: File): boolean => {
    if (!file.name.endsWith(".xml")) {
      setError({ message: "Invalid file type", suggestion: "Please upload an XML file" });
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError({ message: "File too large", suggestion: `Maximum size is ${formatFileSize(MAX_FILE_SIZE)}` });
      return false;
    }
    return true;
  }, []);

  const handleSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setError(null);
        setStage("idle");
      }
    }
  }, [validateFile]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setError(null);
        setStage("idle");
      }
    }
  }, [validateFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const uploadFile = useCallback(async (): Promise<string | null> => {
    if (!file) return null;

    try {
      setStage("uploading");
      setProgress(10);
      setStatusMessage("Uploading file...");

      // Upload to Convex storage
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");
      const { storageId } = await uploadResponse.json();

      setProgress(30);
      setStage("parsing");
      setStatusMessage("Parsing XML...");

      // Parse and validate XML (your existing validation logic)
      const xmlText = await file.text();
      // ... run your existing XML parsing and validation here ...
      // This should use your existing validators from src/lib/validators/

      setProgress(60);
      setStage("validating");
      setStatusMessage("Running validation rules...");

      // Example: Save to Convex (adapt based on your validation results)
      const id = await saveReport({
        fileName: file.name,
        fileSize: file.size,
        totalErrors: 0, // Replace with actual validation results
        totalWarnings: 0,
        validationStatus: "completed",
        validationResults: {}, // Replace with actual results
        xmlStorageId: storageId,
      });

      setProgress(100);
      setStage("complete");
      setStatusMessage("Validation complete!");
      setReportId(id);

      return id;
    } catch (err) {
      setStage("error");
      setError({
        message: err instanceof Error ? err.message : "Validation failed",
        suggestion: "Please try again or contact support",
      });
      return null;
    }
  }, [file, generateUploadUrl, saveReport]);

  const clearFile = useCallback(() => {
    setFile(null);
    setXmlInfo(null);
    setStage("idle");
    setProgress(0);
    setStatusMessage("");
    setError(null);
    setReportId(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    file,
    xmlInfo,
    stage,
    progress,
    statusMessage,
    error,
    isDragActive,
    reportId,
    handleDrop,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleSelect,
    clearFile,
    uploadFile,
    inputRef,
    openFileDialog,
  };
}
```

---

## Phase 5: UI/UX Transformation

### 5.1 Update globals.css

Replace the content of `src/app/globals.css` with a dark-first theme:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 6%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 6%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
    --radius: 0.75rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Custom scrollbar for dark mode */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-slate-900;
}

::-webkit-scrollbar-thumb {
  @apply bg-slate-700 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-600;
}

/* Monospace for data */
.font-data {
  font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
}

/* Loading skeleton animation */
.skeleton {
  @apply animate-pulse bg-slate-700 rounded;
}

/* Severity badge styles */
.severity-critical {
  @apply bg-red-500/10 text-red-500 border-red-500/20;
}

.severity-error {
  @apply bg-orange-500/10 text-orange-500 border-orange-500/20;
}

.severity-warning {
  @apply bg-amber-500/10 text-amber-500 border-amber-500/20;
}

.severity-info {
  @apply bg-blue-500/10 text-blue-500 border-blue-500/20;
}

/* Focus ring */
:focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900;
}

/* Drag and drop zone */
.dropzone-active {
  @apply border-blue-500 bg-blue-500/5;
}

/* Fade in animation */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
```

### 5.2 Update tailwind.config.ts

Replace with Tailwind v3 configuration:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 5.3 Color Scheme Reference

When updating components, use these color patterns:

| Element | Class |
|---------|-------|
| Page background | `bg-slate-950` |
| Card background | `bg-slate-900/50` or `bg-slate-800` |
| Card border | `border-slate-800` or `border-slate-700` |
| Primary text | `text-slate-100` |
| Secondary text | `text-slate-400` |
| Muted text | `text-slate-500` |
| Primary button | `bg-blue-600 hover:bg-blue-500` |
| Secondary button | `bg-slate-700 hover:bg-slate-600` |
| Input background | `bg-slate-800` |
| Input border | `border-slate-700` |

---

## Phase 6: Component Updates

### 6.1 Update Page Components

All page components should follow this pattern:

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AuthHeader } from "@/components/auth-header";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const reports = useQuery(api.validationReports.list);

  if (reports === undefined) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AuthHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] pt-16">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading reports...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AuthHeader />
      <main className="max-w-6xl mx-auto px-4 py-6 pt-24">
        {/* Page content */}
      </main>
    </div>
  );
}
```

### 6.2 Update Upload Zone Styling

Apply dark theme to FileUploadZone:

```typescript
// Change glassmorphism to dark theme
className={cn(
  'relative flex flex-col items-center justify-center',
  'w-full min-h-[280px] p-8',
  'border-2 border-dashed rounded-xl',
  'cursor-pointer transition-all duration-200',
  isDragActive
    ? 'border-blue-500 bg-blue-500/5'
    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50',
  error && 'border-red-500/30 bg-red-500/5'
)}
```

### 6.3 Create Toast Provider

Create `src/components/ui/toast.tsx` (copy pattern from TP-Extractor):

```typescript
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContextType {
  addToast: (type: Toast["type"], message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
              toast.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : toast.type === "error"
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
            }`}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
            {toast.type === "info" && <Info className="w-5 h-5" />}
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
```

---

## Preserved Logic (Do Not Modify)

The following directories and files contain core business logic that should NOT be changed:

### XML Parsing
- `src/lib/parsers/` - XML parsing logic

### Validators
- `src/lib/validators/` - All validation logic
  - `oecd/` - OECD schema validation
  - `country/` - Country-specific rules
  - `quality/` - Data quality checks
  - `pillar2/` - Pillar 2 analysis

### Constants
- `src/constants/` - Validation rules, error codes, country data

### Types
- `src/types/cbcr.ts` - CbCR data types
- `src/types/validation.ts` - Validation result types

### Reports
- `src/components/reports/` - PDF report generation (keep @react-pdf/renderer)

### Resources
- `src/app/resources/` - Resource pages (glossary, external links)
- `src/components/resources/` - Resource components

---

## Environment Variables

### Remove (Supabase)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Add (Clerk + Convex)
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.dev

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=prod:...
```

---

## Testing Checklist

After migration, verify:

- [ ] Sign up flow works with Clerk
- [ ] Sign in flow works with Clerk
- [ ] Sign out redirects to home
- [ ] Protected routes redirect unauthenticated users
- [ ] Dashboard loads user's reports from Convex
- [ ] File upload works with Convex storage
- [ ] XML validation runs correctly
- [ ] Validation results are saved to Convex
- [ ] Report detail pages load correctly
- [ ] PDF report generation works
- [ ] Delete report works
- [ ] User preferences are saved
- [ ] Dark theme displays correctly
- [ ] All animations work
- [ ] Mobile responsive layout works
- [ ] Resource pages (glossary, external links) work

---

## Migration Order

Execute phases in this order:

1. **Phase 1**: Install dependencies, set up configuration files
2. **Phase 5**: Update styling (can be done early, no logic changes)
3. **Phase 2**: Migrate authentication (Clerk setup)
4. **Phase 3**: Migrate database (Convex schema and queries)
5. **Phase 4**: Migrate file upload (integrate with Convex storage)
6. **Phase 6**: Update all page components
7. **Testing**: Comprehensive testing of all flows

---

## Notes for Agents

1. **Always preserve validation logic** - The XML parsing and validation in `src/lib/validators/` is the core value of this application
2. **Test incrementally** - After each phase, verify the app still runs
3. **Keep the same URL structure** - Maintain `/dashboard`, `/validate`, `/reports/[id]` routes
4. **Convex is reactive** - Use `useQuery` for data that should update in real-time
5. **Clerk handles all auth UI** - Don't build custom auth forms
6. **Dark theme is enforced** - The `<html>` element has `className="dark"`
