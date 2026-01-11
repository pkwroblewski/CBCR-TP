'use client';

/**
 * Header Component
 *
 * Application header with dark theme, Clerk authentication, and navigation.
 *
 * @module components/layout/Header
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@/components/auth-wrapper';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  LayoutDashboard,
  FileCheck2,
  FolderOpen,
  Settings,
  Home,
  LogIn,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface HeaderProps {
  /** Toggle sidebar visibility */
  onSidebarToggle?: () => void;
  /** Whether sidebar is open */
  sidebarOpen?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Validate', href: '/validate', icon: <FileCheck2 className="h-4 w-4" /> },
  { label: 'Reports', href: '/reports', icon: <FolderOpen className="h-4 w-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Application header with dark theme and Clerk authentication
 */
export function Header({ onSidebarToggle, sidebarOpen }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left section: Logo & Navigation */}
        <div className="flex items-center gap-4">
          {/* Sidebar toggle (desktop) */}
          {onSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              onClick={onSidebarToggle}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm">
              PW
            </div>
            <span className="font-bold text-slate-100 hidden sm:inline">CbCR Analyzer</span>
          </Link>
        </div>

        {/* Center: Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <SignedIn>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                    isActive
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </SignedIn>
        </nav>

        {/* Right section: Auth */}
        <div className="flex items-center gap-3">
          {/* Home link */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <div className="w-px h-6 bg-slate-700" />

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                  userButtonPopoverCard: 'bg-slate-900 border-slate-700',
                  userButtonPopoverActionButton: 'hover:bg-slate-800',
                  userButtonPopoverActionButtonText: 'text-slate-200',
                  userButtonPopoverFooter: 'hidden',
                },
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

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-1 animate-fade-in"
          aria-label="Mobile navigation"
        >
          <SignedIn>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </nav>
      )}
    </header>
  );
}
