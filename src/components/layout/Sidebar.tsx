'use client';

/**
 * Sidebar Component
 *
 * Dark-themed collapsible navigation sidebar.
 *
 * @module components/layout/Sidebar
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileCheck2,
  FolderOpen,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  BookOpen,
  Home,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface SidebarProps {
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Toggle collapsed state */
  onToggle?: () => void;
  /** Additional CSS classes */
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'New Validation', href: '/validate', icon: <Upload className="h-5 w-5" /> },
  { label: 'Reports', href: '/reports', icon: <FolderOpen className="h-5 w-5" /> },
];

const SECONDARY_NAV: NavItem[] = [
  { label: 'How It Works', href: '/how-it-works', icon: <HelpCircle className="h-5 w-5" /> },
  { label: 'Validation Rules', href: '/resources/validation-rules', icon: <FileCheck2 className="h-5 w-5" /> },
  { label: 'Resources', href: '/resources', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
];

const BOTTOM_NAV: NavItem[] = [
  { label: 'Glossary', href: '/resources/glossary', icon: <BookOpen className="h-5 w-5" /> },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Dark-themed collapsible navigation sidebar
 */
export function Sidebar({
  collapsed = false,
  onToggle,
  className,
}: SidebarProps) {
  const pathname = usePathname();

  /**
   * Render navigation item
   */
  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          isActive
            ? 'bg-slate-800 text-slate-100'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? item.label : undefined}
      >
        {/* Active indicator */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
        )}

        {/* Icon */}
        <span className={cn(
          'flex items-center justify-center transition-colors',
          isActive && 'text-blue-400'
        )}>
          {item.icon}
        </span>

        {/* Label */}
        {!collapsed && (
          <span className="flex-1 truncate">{item.label}</span>
        )}

        {/* Badge */}
        {!collapsed && item.badge && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64',
        className
      )}
    >
      {/* Navigation sections */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        {/* Home Link */}
        <Link
          href="/"
          className={cn(
            'group flex items-center gap-3 mb-4 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Home' : undefined}
        >
          <Home className="h-5 w-5" />
          {!collapsed && <span>Home</span>}
        </Link>

        <div className="h-px bg-slate-800 my-4" />

        {/* Main nav */}
        <div className="mb-2">
          {!collapsed && (
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
              Main
            </span>
          )}
          <nav className="space-y-1">
            {MAIN_NAV.map(renderNavItem)}
          </nav>
        </div>

        <div className="h-px bg-slate-800 my-4" />

        {/* Secondary nav */}
        <div className="mb-2">
          {!collapsed && (
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
              Tools
            </span>
          )}
          <nav className="space-y-1">
            {SECONDARY_NAV.map(renderNavItem)}
          </nav>
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-slate-800 py-4 px-3">
        <nav className="space-y-1">
          {BOTTOM_NAV.map(renderNavItem)}
        </nav>

        {/* Collapse toggle */}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              'w-full mt-4 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg',
              collapsed && 'justify-center'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </Button>
        )}
      </div>
    </aside>
  );
}
