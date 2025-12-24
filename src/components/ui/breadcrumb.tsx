'use client';

/**
 * Breadcrumb Component
 *
 * Accessible breadcrumb navigation for indicating page hierarchy.
 * Follows WAI-ARIA Breadcrumb pattern.
 *
 * @module components/ui/breadcrumb
 */

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Link href (omit for current page) */
  href?: string;
  /** Optional icon */
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Include home link at start */
  showHome?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Accessible breadcrumb navigation
 */
export function Breadcrumb({ items, showHome = true, className }: BreadcrumbProps) {
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Home', href: '/dashboard', icon: <Home className="h-4 w-4" /> }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-4', className)}>
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <li key={item.label} className="flex items-center gap-1">
              {!isFirst && (
                <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 hover:text-foreground transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 -mx-1'
                  )}
                >
                  {item.icon && <span aria-hidden="true">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1.5',
                    isLast && 'text-foreground font-medium'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && <span aria-hidden="true">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// =============================================================================
// HOOK FOR DYNAMIC BREADCRUMBS
// =============================================================================

/**
 * Hook for generating breadcrumbs from current pathname
 */
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip 'dashboard' as it's the home
    if (segment === 'dashboard') continue;

    // Format label: convert-kebab-case to Title Case
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Last item doesn't need href
    const isLast = i === segments.length - 1;
    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  }

  return items;
}
