'use client';

/**
 * Dashboard Layout Component
 *
 * Premium layout wrapper with animated pulsating background orbs and refined transitions.
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
  /** User information for header */
  user?: {
    name?: string;
    email?: string;
    initials?: string;
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Premium dashboard layout with animated pulsating background
 */
export function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Base gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50/80" />

      {/* Animated pulsating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Orange orb - top right - pulsating */}
        <div
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full animate-orb-1"
          style={{
            background: 'radial-gradient(circle, rgba(232, 93, 4, 0.18) 0%, rgba(232, 93, 4, 0.08) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Teal orb - bottom left - pulsating */}
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full animate-orb-2"
          style={{
            background: 'radial-gradient(circle, rgba(8, 145, 178, 0.15) 0%, rgba(8, 145, 178, 0.05) 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        {/* Orange secondary orb - center left - floating */}
        <div
          className="absolute top-[40%] left-[5%] w-[400px] h-[400px] rounded-full animate-orb-3"
          style={{
            background: 'radial-gradient(circle, rgba(251, 146, 60, 0.12) 0%, transparent 60%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Teal secondary orb - top center - floating */}
        <div
          className="absolute top-[10%] left-[40%] w-[350px] h-[350px] rounded-full animate-orb-float"
          style={{
            background: 'radial-gradient(circle, rgba(8, 145, 178, 0.1) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Orange accent orb - bottom right - pulsating */}
        <div
          className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full animate-orb-1 delay-500"
          style={{
            background: 'radial-gradient(circle, rgba(232, 93, 4, 0.1) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Subtle pattern overlay */}
      <div
        className="fixed inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarOpen={!sidebarCollapsed}
        />

        <div className="flex flex-1">
          {/* Sidebar (desktop only) */}
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="sticky top-16 h-[calc(100vh-4rem)]"
          />

          {/* Main content area */}
          <main
            className={cn(
              'flex-1 min-h-[calc(100vh-4rem)]',
              'transition-all duration-300 ease-out'
            )}
          >
            {/* Content container with glass effect */}
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
