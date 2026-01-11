'use client';

/**
 * Dashboard Layout Component
 *
 * Dark-themed layout wrapper for authenticated pages.
 *
 * @module components/layout/DashboardLayout
 */

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface DashboardLayoutProps {
  /** Page content */
  children: React.ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Dark-themed dashboard layout
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <Header
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarOpen={!sidebarCollapsed}
      />

      <div className="flex pt-14">
        {/* Sidebar (desktop only) */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="sticky top-14 h-[calc(100vh-3.5rem)]"
        />

        {/* Main content area */}
        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-3.5rem)]',
            'transition-all duration-300 ease-out'
          )}
        >
          {/* Content container */}
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
