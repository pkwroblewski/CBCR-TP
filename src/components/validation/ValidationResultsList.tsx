'use client';

/**
 * Validation Results List Component
 *
 * Premium filterable, searchable list of validation results with animations.
 *
 * @module components/validation/ValidationResultsList
 */

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ValidationSeverity, ValidationCategory } from '@/types/validation';
import type { ValidationResult } from '@/types/validation';
import { ValidationResultCard } from './ValidationResultCard';
import {
  Search,
  Filter,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  SortAsc,
  SortDesc,
  X,
  Sparkles,
  FileSearch,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ValidationResultsListProps {
  /** Array of validation results */
  results: ValidationResult[];
  /** Maximum height before scrolling */
  maxHeight?: string;
  /** Additional CSS classes */
  className?: string;
}

type SortOption = 'severity' | 'category' | 'ruleId';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  severity: ValidationSeverity | null;
  category: ValidationCategory | null;
  search: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SEVERITY_ORDER: Record<ValidationSeverity, number> = {
  [ValidationSeverity.CRITICAL]: 0,
  [ValidationSeverity.ERROR]: 1,
  [ValidationSeverity.WARNING]: 2,
  [ValidationSeverity.INFO]: 3,
};

const SEVERITY_OPTIONS: { value: ValidationSeverity; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
  {
    value: ValidationSeverity.CRITICAL,
    label: 'Critical',
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'hover:border-red-300 hover:bg-red-50',
    activeColor: 'bg-gradient-to-r from-red-600 to-red-500 border-red-600 text-white shadow-lg shadow-red-500/20',
  },
  {
    value: ValidationSeverity.ERROR,
    label: 'Errors',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: 'hover:border-orange-300 hover:bg-orange-50',
    activeColor: 'bg-gradient-to-r from-orange-600 to-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/20',
  },
  {
    value: ValidationSeverity.WARNING,
    label: 'Warnings',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: 'hover:border-amber-300 hover:bg-amber-50',
    activeColor: 'bg-gradient-to-r from-amber-500 to-amber-400 border-amber-500 text-white shadow-lg shadow-amber-500/20',
  },
  {
    value: ValidationSeverity.INFO,
    label: 'Info',
    icon: <Info className="h-3.5 w-3.5" />,
    color: 'hover:border-blue-300 hover:bg-blue-50',
    activeColor: 'bg-gradient-to-r from-accent to-cyan-500 border-accent text-white shadow-lg shadow-accent/20',
  },
];

const CATEGORY_OPTIONS: { value: ValidationCategory; label: string }[] = [
  { value: ValidationCategory.XML_WELLFORMEDNESS, label: 'XML Structure' },
  { value: ValidationCategory.SCHEMA_COMPLIANCE, label: 'Schema' },
  { value: ValidationCategory.BUSINESS_RULES, label: 'Business Rules' },
  { value: ValidationCategory.COUNTRY_RULES, label: 'Country Rules' },
  { value: ValidationCategory.DATA_QUALITY, label: 'Data Quality' },
  { value: ValidationCategory.PILLAR2_READINESS, label: 'Pillar 2' },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Premium filterable list of validation results
 */
export function ValidationResultsList({
  results,
  maxHeight = '600px',
  className,
}: ValidationResultsListProps) {
  const [filters, setFilters] = useState<FilterState>({
    severity: null,
    category: null,
    search: '',
  });
  const [sortBy, setSortBy] = useState<SortOption>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  /**
   * Filter and sort results
   */
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Apply severity filter
    if (filters.severity) {
      filtered = filtered.filter((r) => r.severity === filters.severity);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter((r) => r.category === filters.category);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.ruleId.toLowerCase().includes(searchLower) ||
          r.message.toLowerCase().includes(searchLower) ||
          r.xpath?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'severity':
          comparison = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'ruleId':
          comparison = a.ruleId.localeCompare(b.ruleId);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [results, filters, sortBy, sortDirection]);

  /**
   * Toggle severity filter
   */
  const toggleSeverity = useCallback((severity: ValidationSeverity) => {
    setFilters((prev) => ({
      ...prev,
      severity: prev.severity === severity ? null : severity,
    }));
  }, []);

  /**
   * Toggle category filter
   */
  const toggleCategory = useCallback((category: ValidationCategory) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === category ? null : category,
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      severity: null,
      category: null,
      search: '',
    });
  }, []);

  /**
   * Toggle sort direction
   */
  const toggleSort = useCallback((option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  }, [sortBy]);

  const hasActiveFilters = filters.severity || filters.category || filters.search;

  /**
   * Count results by severity
   */
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach((r) => {
      counts[r.severity] = (counts[r.severity] || 0) + 1;
    });
    return counts;
  }, [results]);

  return (
    <div className={cn('space-y-5', className)}>
      {/* Search and filters */}
      <div className="space-y-4 glass rounded-2xl p-5 border border-white/20 shadow-lg animate-fade-in">
        {/* Search bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <Input
            type="text"
            placeholder="Search by rule ID, message, or XPath..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="pl-12 pr-12 h-12 rounded-xl bg-white/50 border-border/50 text-base focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Severity filter buttons */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by severity">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mr-1">
            <Filter className="h-4 w-4 text-accent" aria-hidden="true" />
            Severity:
          </span>
          {SEVERITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleSeverity(option.value)}
              aria-pressed={filters.severity === option.value}
              aria-label={`Filter by ${option.label} (${severityCounts[option.value] || 0} results)`}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200',
                filters.severity === option.value
                  ? option.activeColor
                  : `border-border/50 bg-white/50 text-muted-foreground ${option.color}`
              )}
            >
              <span aria-hidden="true">{option.icon}</span>
              {option.label}
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold',
                filters.severity === option.value
                  ? 'bg-white/20'
                  : 'bg-muted/50'
              )}>
                {severityCounts[option.value] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Category filter buttons */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
          <span className="text-sm font-medium text-muted-foreground mr-1">Category:</span>
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleCategory(option.value)}
              aria-pressed={filters.category === option.value}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200',
                filters.category === option.value
                  ? 'bg-gradient-to-r from-primary to-primary/90 border-primary text-white shadow-lg shadow-primary/20'
                  : 'border-border/50 bg-white/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Sort and clear row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Sort:</span>
            {(['severity', 'category', 'ruleId'] as SortOption[]).map((option) => (
              <button
                key={option}
                onClick={() => toggleSort(option)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200',
                  sortBy === option
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted-foreground hover:bg-accent/5 hover:text-foreground'
                )}
              >
                {option === 'severity' ? 'Severity' : option === 'category' ? 'Category' : 'Rule ID'}
                {sortBy === option && (
                  sortDirection === 'asc' ? (
                    <SortAsc className="h-3.5 w-3.5" />
                  ) : (
                    <SortDesc className="h-3.5 w-3.5" />
                  )
                )}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
            >
              Clear filters
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium text-muted-foreground">
          Showing <span className="text-foreground font-bold">{filteredResults.length}</span> of{' '}
          <span className="text-foreground font-bold">{results.length}</span> results
        </p>
        {filteredResults.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Click to expand details</span>
          </div>
        )}
      </div>

      {/* Results list */}
      <div
        className="space-y-3 overflow-y-auto pr-2 scrollbar-thin"
        style={{ maxHeight }}
      >
        {filteredResults.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl border border-white/20 animate-fade-in">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 mx-auto mb-4">
              <FileSearch className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="font-bold text-foreground text-lg">No results found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'No validation issues were found'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-accent hover:bg-accent/10 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredResults.map((result, index) => (
            <div
              key={`${result.ruleId}-${index}`}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
            >
              <ValidationResultCard result={result} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
