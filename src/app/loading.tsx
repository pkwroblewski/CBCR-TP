/**
 * Global Loading Page
 *
 * Shows a skeleton loading state while pages are loading.
 * Matches the dashboard layout for visual consistency.
 *
 * @page /loading
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Skeleton */}
        <aside className="hidden md:flex w-64 border-r bg-background h-[calc(100vh-4rem)] p-4">
          <div className="space-y-4 w-full">
            {/* Logo area */}
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-5 w-24" />
            </div>

            {/* Navigation items */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom items */}
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center gap-3 p-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="flex-1 p-6 md:p-8">
          {/* Page Title */}
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>

          {/* Content Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="p-4 space-y-4">
              {/* Table Header */}
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28 ml-auto" />
              </div>
              {/* Table Rows */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 py-3 border-t">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
