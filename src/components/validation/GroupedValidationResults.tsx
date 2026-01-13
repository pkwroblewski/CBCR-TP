'use client';

/**
 * Grouped Validation Results Component
 *
 * Sophisticated dark-themed validation results display.
 * Clean, minimal, enterprise-grade design.
 *
 * @module components/validation/GroupedValidationResults
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ValidationSeverity, ValidationCategory } from '@/types/validation';
import type { ValidationResult } from '@/types/validation';
import { ChevronRight, Lightbulb, CheckCircle2 } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface GroupedValidationResultsProps {
  results: ValidationResult[];
  maxHeight?: string;
  minHeight?: string;
  className?: string;
  maxSampleItems?: number;
}

interface GroupedResult {
  ruleId: string;
  severity: ValidationSeverity;
  category: ValidationCategory;
  count: number;
  message: string;
  suggestion?: string;
  results: ValidationResult[];
  jurisdictions: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SEVERITY_CONFIG: Record<ValidationSeverity, {
  label: string;
  dot: string;
  badge: string;
  text: string;
}> = {
  [ValidationSeverity.CRITICAL]: {
    label: 'Critical',
    dot: 'bg-red-500',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    text: 'text-red-400',
  },
  [ValidationSeverity.ERROR]: {
    label: 'Error',
    dot: 'bg-orange-500',
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    text: 'text-orange-400',
  },
  [ValidationSeverity.WARNING]: {
    label: 'Warning',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    text: 'text-amber-400',
  },
  [ValidationSeverity.INFO]: {
    label: 'Info',
    dot: 'bg-slate-400',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    text: 'text-slate-400',
  },
};

const SEVERITY_ORDER: Record<ValidationSeverity, number> = {
  [ValidationSeverity.CRITICAL]: 0,
  [ValidationSeverity.ERROR]: 1,
  [ValidationSeverity.WARNING]: 2,
  [ValidationSeverity.INFO]: 3,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function extractJurisdiction(xpath?: string): string | null {
  if (!xpath) return null;
  const match = xpath.match(/(?:ResCountryCode|Country)[='"]*([A-Z]{2})/);
  return match ? match[1] : null;
}

function groupResults(results: ValidationResult[]): GroupedResult[] {
  const groups = new Map<string, GroupedResult>();

  for (const result of results) {
    if (!groups.has(result.ruleId)) {
      groups.set(result.ruleId, {
        ruleId: result.ruleId,
        severity: result.severity,
        category: result.category,
        count: 0,
        message: result.message,
        suggestion: result.suggestion,
        results: [],
        jurisdictions: [],
      });
    }

    const group = groups.get(result.ruleId)!;
    group.count++;
    group.results.push(result);

    const jur = extractJurisdiction(result.xpath);
    if (jur && !group.jurisdictions.includes(jur)) {
      group.jurisdictions.push(jur);
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const diff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    return diff !== 0 ? diff : b.count - a.count;
  });
}

// =============================================================================
// ROW COMPONENT
// =============================================================================

function ResultRow({ group, maxSampleItems }: { group: GroupedResult; maxSampleItems: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = SEVERITY_CONFIG[group.severity];

  const cleanMessage = useMemo(() => {
    let msg = group.message;
    if (group.count > 1) {
      msg = msg
        .replace(/Entity ['"][^'"]+['"]:\s*/i, '')
        .replace(/^([A-Z]{2}):\s*/i, '')
        .trim();
    }
    return msg.charAt(0).toUpperCase() + msg.slice(1);
  }, [group.message, group.count]);

  return (
    <div className="border-b border-slate-800 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-slate-800/50 transition-colors group"
      >
        {/* Expand indicator */}
        <ChevronRight
          className={cn(
            'h-4 w-4 text-slate-600 transition-transform flex-shrink-0',
            isExpanded && 'rotate-90'
          )}
        />

        {/* Severity dot */}
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dot)} />

        {/* Rule ID */}
        <code className="text-xs font-mono text-slate-400 w-20 flex-shrink-0">
          {group.ruleId}
        </code>

        {/* Message */}
        <span className="text-sm text-slate-300 flex-1 truncate">
          {cleanMessage}
        </span>

        {/* Jurisdictions (if any) */}
        {group.jurisdictions.length > 0 && (
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {group.jurisdictions.slice(0, 4).map((j) => (
              <span key={j} className="text-[10px] text-slate-500 px-1.5 py-0.5 bg-slate-800 rounded">
                {j}
              </span>
            ))}
            {group.jurisdictions.length > 4 && (
              <span className="text-[10px] text-slate-600">+{group.jurisdictions.length - 4}</span>
            )}
          </div>
        )}

        {/* Count */}
        <span className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded border flex-shrink-0',
          config.badge
        )}>
          {group.count}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 ml-10 space-y-3">
          {/* Suggestion */}
          {group.suggestion && (
            <div className="flex items-start gap-2 p-3 bg-blue-950/30 rounded-lg border border-blue-900/50">
              <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-300">{group.suggestion}</p>
            </div>
          )}

          {/* Sample items */}
          <div>
            <p className="text-xs text-slate-500 mb-2">
              Showing {Math.min(group.results.length, maxSampleItems)} of {group.count} occurrences
            </p>
            <div className="space-y-1">
              {group.results.slice(0, maxSampleItems).map((item, i) => (
                <div key={i} className="p-2 bg-slate-800/50 rounded text-sm">
                  <p className="text-slate-300">{item.message}</p>
                  {item.xpath && (
                    <p className="text-xs text-slate-600 mt-1 font-mono truncate">{item.xpath}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function GroupedValidationResults({
  results,
  maxHeight = '600px',
  minHeight = '400px',
  className,
  maxSampleItems = 5,
}: GroupedValidationResultsProps) {
  const groupedResults = useMemo(() => groupResults(results), [results]);

  const stats = useMemo(() => {
    const bySeverity = { critical: 0, error: 0, warning: 0, info: 0 };
    for (const r of results) {
      const severity = r.severity as keyof typeof bySeverity;
      if (severity in bySeverity) {
        bySeverity[severity]++;
      }
    }
    return { total: results.length, unique: groupedResults.length, bySeverity };
  }, [results, groupedResults]);

  // Empty state
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </div>
        <p className="text-slate-200 font-medium">All Checks Passed</p>
        <p className="text-sm text-slate-500 mt-1">No issues found in this category</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats bar - Responsive with labeled severity counts */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-100">{stats.total}</span>
          <span className="text-sm text-slate-400">
            issues across <span className="text-slate-200 font-medium">{stats.unique}</span> rules
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {stats.bySeverity.critical > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${stats.bySeverity.critical} critical issues`}>
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-red-400">{stats.bySeverity.critical}</span>
              <span className="text-xs text-red-400/70 hidden sm:inline">Critical</span>
            </div>
          )}
          {stats.bySeverity.error > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${stats.bySeverity.error} errors`}>
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-sm font-medium text-orange-400">{stats.bySeverity.error}</span>
              <span className="text-xs text-orange-400/70 hidden sm:inline">Errors</span>
            </div>
          )}
          {stats.bySeverity.warning > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${stats.bySeverity.warning} warnings`}>
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-400">{stats.bySeverity.warning}</span>
              <span className="text-xs text-amber-400/70 hidden sm:inline">Warnings</span>
            </div>
          )}
          {stats.bySeverity.info > 0 && (
            <div className="flex items-center gap-1.5" aria-label={`${stats.bySeverity.info} info items`}>
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-sm font-medium text-slate-400">{stats.bySeverity.info}</span>
              <span className="text-xs text-slate-400/70 hidden sm:inline">Info</span>
            </div>
          )}
        </div>
      </div>

      {/* Results list */}
      <div
        className="bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700"
        style={{
          maxHeight: maxHeight === 'none' ? undefined : maxHeight,
          minHeight,
        }}
      >
        {groupedResults.map((group) => (
          <ResultRow key={group.ruleId} group={group} maxSampleItems={maxSampleItems} />
        ))}
      </div>
    </div>
  );
}

export { groupResults, type GroupedResult };
