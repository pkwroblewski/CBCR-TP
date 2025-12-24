'use client';

/**
 * Category Tabs Component
 *
 * Tab navigation for validation categories with result count badges.
 *
 * @module components/validation/CategoryTabs
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ValidationResult, ValidationCategory } from '@/types/validation';
import { ValidationResultsList } from './ValidationResultsList';
import {
  FileCode2,
  FileCheck,
  Briefcase,
  Globe,
  BarChart3,
  Building2,
  LayoutGrid,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface CategoryTabsProps {
  /** All validation results */
  results: ValidationResult[];
  /** Default active tab */
  defaultTab?: string;
  /** Additional CSS classes */
  className?: string;
}

interface CategoryConfig {
  id: string;
  value: ValidationCategory | 'all';
  label: string;
  icon: React.ReactNode;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'all',
    value: 'all',
    label: 'All',
    icon: <LayoutGrid className="h-4 w-4" />,
  },
  {
    id: 'xml',
    value: 'xml_wellformedness' as ValidationCategory,
    label: 'XML',
    icon: <FileCode2 className="h-4 w-4" />,
  },
  {
    id: 'schema',
    value: 'schema_validation' as ValidationCategory,
    label: 'Schema',
    icon: <FileCheck className="h-4 w-4" />,
  },
  {
    id: 'business',
    value: 'business_rules' as ValidationCategory,
    label: 'Business',
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    id: 'country',
    value: 'country_rules' as ValidationCategory,
    label: 'Country',
    icon: <Globe className="h-4 w-4" />,
  },
  {
    id: 'quality',
    value: 'data_quality' as ValidationCategory,
    label: 'Quality',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    id: 'pillar2',
    value: 'pillar2_readiness' as ValidationCategory,
    label: 'Pillar 2',
    icon: <Building2 className="h-4 w-4" />,
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Tabbed navigation for validation categories
 */
export function CategoryTabs({
  results,
  defaultTab = 'all',
  className,
}: CategoryTabsProps) {
  /**
   * Get results for a category
   */
  const getResultsForCategory = (category: ValidationCategory | 'all'): ValidationResult[] => {
    if (category === 'all') {
      return results;
    }
    return results.filter((r) => r.category === category);
  };

  /**
   * Get count for a category
   */
  const getCountForCategory = (category: ValidationCategory | 'all'): number => {
    return getResultsForCategory(category).length;
  };

  /**
   * Get badge variant based on count and severity
   */
  const getBadgeVariant = (category: ValidationCategory | 'all'): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const categoryResults = getResultsForCategory(category);
    if (categoryResults.length === 0) return 'outline';
    
    const hasCritical = categoryResults.some((r) => r.severity === 'critical');
    const hasError = categoryResults.some((r) => r.severity === 'error');
    
    if (hasCritical) return 'destructive';
    if (hasError) return 'default';
    return 'secondary';
  };

  return (
    <Tabs defaultValue={defaultTab} className={cn('w-full', className)}>
      <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-slate-100 p-1.5 rounded-lg">
        {CATEGORIES.map((category) => {
          const count = getCountForCategory(category.value);
          const variant = getBadgeVariant(category.value);

          return (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md',
                'data-[state=active]:bg-white data-[state=active]:shadow-sm',
                'transition-all duration-200'
              )}
            >
              <span className="text-slate-500">{category.icon}</span>
              <span className="hidden sm:inline">{category.label}</span>
              <Badge
                variant={variant}
                className={cn(
                  'h-5 min-w-[20px] px-1.5 text-[10px] font-semibold',
                  count === 0 && 'opacity-50'
                )}
              >
                {count}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {CATEGORIES.map((category) => (
        <TabsContent
          key={category.id}
          value={category.id}
          className="mt-6 focus-visible:outline-none"
        >
          <ValidationResultsList
            results={getResultsForCategory(category.value)}
            maxHeight="calc(100vh - 400px)"
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

