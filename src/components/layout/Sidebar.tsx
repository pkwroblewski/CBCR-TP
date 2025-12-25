'use client';

/**
 * Sidebar Component
 *
 * Premium collapsible navigation sidebar with glassmorphism and refined animations.
 *
 * @module components/layout/Sidebar
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileCheck2,
  FolderOpen,
  Settings,
  HelpCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Upload,
  BarChart3,
  Shield,
  BookOpen,
  Sparkles,
  Globe,
  ExternalLink,
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
  highlight?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'New Validation', href: '/validate', icon: <Upload className="h-5 w-5" />, highlight: true },
  { label: 'Reports', href: '/reports', icon: <FolderOpen className="h-5 w-5" /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-5 w-5" /> },
];

const SECONDARY_NAV: NavItem[] = [
  { label: 'Validation Rules', href: '/rules', icon: <FileCheck2 className="h-5 w-5" /> },
  { label: 'Pillar 2', href: '/pillar2', icon: <Shield className="h-5 w-5" />, badge: 'NEW' },
  { label: 'Resources', href: '/resources', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
];

const BOTTOM_NAV: NavItem[] = [
  { label: 'Help Center', href: '/help', icon: <HelpCircle className="h-5 w-5" /> },
  { label: 'Support', href: '/support', icon: <MessageSquare className="h-5 w-5" /> },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Premium collapsible navigation sidebar
 */
export function Sidebar({
  collapsed = false,
  onToggle,
  className,
}: SidebarProps) {
  const pathname = usePathname();

  /**
   * Render navigation item with premium styling
   */
  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
          isActive
            ? 'bg-gradient-to-r from-accent/15 to-accent/5 text-accent shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/5',
          collapsed && 'justify-center px-2',
          item.highlight && !isActive && 'hover:bg-accent/10'
        )}
        title={collapsed ? item.label : undefined}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Active indicator */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full" />
        )}

        {/* Icon with gradient on active */}
        <span className={cn(
          'relative flex items-center justify-center transition-all duration-300',
          isActive && 'text-accent',
          !collapsed && 'group-hover:scale-110'
        )}>
          {item.icon}
          {item.highlight && !isActive && (
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent animate-pulse" />
          )}
        </span>

        {/* Label */}
        {!collapsed && (
          <span className="flex-1 truncate">{item.label}</span>
        )}

        {/* Badge */}
        {!collapsed && item.badge && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-accent to-cyan-500 text-white rounded-full shadow-sm">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col glass-strong border-r border-white/20 transition-all duration-300 ease-out',
        collapsed ? 'w-[72px]' : 'w-64',
        className
      )}
    >
      {/* Navigation sections */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        {/* Visit Homepage Link - at the top */}
        <Link
          href="/"
          className={cn(
            'group relative flex items-center gap-3 mb-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
            'bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-200/40',
            'hover:from-orange-500/20 hover:to-amber-500/15 hover:border-orange-300/60 hover:shadow-md hover:shadow-orange-500/10',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Visit Homepage' : undefined}
        >
          <span className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <Globe className="h-5 w-5 text-orange-500 group-hover:text-orange-600" />
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-orange-600 group-hover:text-orange-700">Visit Homepage</span>
              <ExternalLink className="h-3.5 w-3.5 text-orange-400 group-hover:text-orange-500 opacity-70 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </Link>

        <Separator className="my-4 bg-border/30" />

        {/* Main nav */}
        <div className="mb-2">
          {!collapsed && (
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 block">
              Main
            </span>
          )}
          <nav className="space-y-1">
            {MAIN_NAV.map(renderNavItem)}
          </nav>
        </div>

        <Separator className="my-4 bg-border/30" />

        {/* Secondary nav */}
        <div className="mb-2">
          {!collapsed && (
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 block">
              Tools
            </span>
          )}
          <nav className="space-y-1">
            {SECONDARY_NAV.map((item, i) => renderNavItem(item, i + MAIN_NAV.length))}
          </nav>
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-white/10 py-4 px-3">
        <nav className="space-y-1">
          {BOTTOM_NAV.map((item, i) => renderNavItem(item, i + MAIN_NAV.length + SECONDARY_NAV.length))}
        </nav>

        {/* Collapse toggle */}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              'w-full mt-4 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-xl transition-all duration-300',
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
