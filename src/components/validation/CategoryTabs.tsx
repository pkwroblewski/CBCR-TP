'use client';

/**
 * Category Tabs Component
 *
 * Sophisticated dark-themed tab navigation for validation categories.
 * Clean, minimal design for enterprise compliance tools.
 *
 * @module components/validation/CategoryTabs
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ValidationResult, ValidationCategory } from '@/types/validation';
import { ValidationResultsList } from './ValidationResultsList';
import { GroupedValidationResults } from './GroupedValidationResults';
import { Layers, List } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface CategoryTabsProps {
  results: ValidationResult[];
  defaultTab?: string;
  className?: string;
  aiExplanations?: Record<string, string>;
  generatingFindingId?: string | null;
  onRequestAiExplanation?: (findingId: string, finding: ValidationResult) => void;
}

interface CategoryConfig {
  id: string;
  value: ValidationCategory | 'all';
  label: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CATEGORIES: CategoryConfig[] = [
  { id: 'all', value: 'all', label: 'All' },
  { id: 'xml', value: 'xml_wellformedness' as ValidationCategory, label: 'XML' },
  { id: 'schema', value: 'schema_compliance' as ValidationCategory, label: 'Schema' },
  { id: 'business', value: 'business_rules' as ValidationCategory, label: 'Business' },
  { id: 'country', value: 'country_rules' as ValidationCategory, label: 'Country' },
  { id: 'quality', value: 'data_quality' as ValidationCategory, label: 'Quality' },
  { id: 'pillar2', value: 'pillar2_readiness' as ValidationCategory, label: 'Pillar 2' },
];

type ViewMode = 'grouped' | 'flat';

// =============================================================================
// COMPONENT
// =============================================================================

export function CategoryTabs({
  results,
  defaultTab = 'all',
  className,
  aiExplanations,
  generatingFindingId,
  onRequestAiExplanation,
}: CategoryTabsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [activeTab, setActiveTab] = useState(defaultTab);

  const getResultsForCategory = (category: ValidationCategory | 'all'): ValidationResult[] => {
    if (category === 'all') return results;
    return results.filter((r) => r.category === category);
  };

  const getCountForCategory = (category: ValidationCategory | 'all'): number => {
    return getResultsForCategory(category).length;
  };

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab)?.value || 'all';
  const activeResults = getResultsForCategory(activeCategory);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls Row - Compact and clean */}
      <div className="flex items-center justify-between">
        {/* View Toggle */}
        <div className="inline-flex items-center bg-slate-800/50 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grouped')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              viewMode === 'grouped'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Summary
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              viewMode === 'flat'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <List className="h-3.5 w-3.5" />
            Detail
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1">
          {CATEGORIES.map((category) => {
            const count = getCountForCategory(category.value);
            const isActive = activeTab === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : count > 0
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-500 hover:bg-slate-800/50'
                )}
              >
                {category.label}
                {count > 0 && (
                  <span className={cn(
                    'ml-1.5 text-[10px]',
                    isActive ? 'text-blue-200' : 'text-slate-500'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grouped' ? (
        <GroupedValidationResults
          results={activeResults}
          maxHeight="calc(100vh - 520px)"
          maxSampleItems={5}
        />
      ) : (
        <ValidationResultsList
          results={activeResults}
          maxHeight="calc(100vh - 480px)"
          aiExplanations={aiExplanations}
          generatingFindingId={generatingFindingId}
          onRequestAiExplanation={onRequestAiExplanation}
        />
      )}
    </div>
  );
}
