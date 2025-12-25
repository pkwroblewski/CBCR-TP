'use client';

/**
 * Header Component
 *
 * Premium application header with glassmorphism, refined navigation, and user menu.
 *
 * @module components/layout/Header
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  LayoutDashboard,
  FileCheck2,
  FolderOpen,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Bell,
  Sparkles,
  Home,
  ExternalLink,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface HeaderProps {
  /** Toggle sidebar visibility */
  onSidebarToggle?: () => void;
  /** Whether sidebar is open */
  sidebarOpen?: boolean;
  /** User information */
  user?: {
    name?: string;
    email?: string;
    initials?: string;
  };
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
 * Premium application header with glassmorphism
 */
export function Header({
  onSidebarToggle,
  sidebarOpen,
  user,
}: HeaderProps) {
  const pathname = usePathname();
  const { signOut, isLoading: isSigningOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = user?.initials || user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 w-full glass-strong border-b border-white/20 shadow-sm">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Sidebar toggle (desktop) */}
        {onSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 hidden md:flex hover:bg-accent/10 transition-colors"
            onClick={onSidebarToggle}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className="h-5 w-5 text-primary/70" />
          </Button>
        )}

        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden hover:bg-accent/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-primary" />
          ) : (
            <Menu className="h-5 w-5 text-primary/70" />
          )}
        </Button>

        {/* Logo & Home Link */}
        <div className="flex items-center gap-2 mr-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105">
              PW
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-primary tracking-tight">
                PW-(CbCR) Analyzer
              </span>
              <span className="text-[10px] text-muted-foreground -mt-0.5 tracking-wide">
                Transfer Pricing Suite
              </span>
            </div>
          </Link>

          {/* Back to Landing Page */}
          <Link
            href="/"
            className="group/home relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-200/50 hover:border-orange-400/70 hover:from-orange-500/20 hover:to-amber-500/20 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/20"
            title="Back to Homepage"
          >
            <Home className="h-4 w-4 text-orange-600 group-hover/home:text-orange-700 transition-colors" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-white text-[10px] font-medium rounded-md opacity-0 group-hover/home:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
              Visit Homepage
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                )}
              >
                <span className={cn(
                  'transition-colors',
                  isActive && 'text-accent'
                )}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-accent/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          </Button>

          {/* Help button */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-accent/10 transition-colors"
          >
            <Link href="/help" aria-label="Help">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </Link>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0 ring-2 ring-transparent hover:ring-accent/20 transition-all duration-300"
                aria-label="Open user menu"
              >
                <Avatar className="h-10 w-10 shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 glass-strong border-white/20 shadow-xl p-2">
              <div className="flex items-center gap-3 px-2 py-3 bg-gradient-to-r from-accent/5 to-transparent rounded-lg mb-2">
                <Avatar className="h-12 w-12 shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{user?.name || 'User'}</span>
                  <span className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</span>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/10 transition-colors">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/10 transition-colors">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-colors group">
                  <Home className="h-4 w-4 text-orange-500 group-hover:text-orange-600" />
                  <span className="text-orange-600">Visit Homepage</span>
                  <ExternalLink className="h-3 w-3 ml-auto text-orange-400" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-red-600 cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>{isSigningOut ? 'Signing out...' : 'Log out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden border-t border-white/20 glass px-4 py-4 space-y-1 animate-fade-in"
          aria-label="Mobile navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-accent/10 text-accent shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}

          {/* Mobile Home Link */}
          <div className="pt-2 mt-2 border-t border-border/30">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-200/40 text-orange-600 hover:from-orange-500/20 hover:to-amber-500/15"
            >
              <Home className="h-4 w-4" />
              <span className="flex-1">Visit Homepage</span>
              <ExternalLink className="h-3.5 w-3.5 text-orange-400" />
            </Link>
          </div>

          {/* Mobile Logout */}
          <div className="pt-2 mt-2 border-t border-border/30">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{isSigningOut ? 'Signing out...' : 'Log out'}</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
