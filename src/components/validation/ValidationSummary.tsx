'use client';

/**
 * Validation Summary Component
 *
 * Overview card showing validation results summary with counts by severity,
 * pass/fail status, and percentage score.
 *
 * @module components/validation/ValidationSummary
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ValidationSummary as ValidationSummaryType } from '@/types/validation';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ValidationSummaryProps {
  /** Summary data */
  summary: ValidationSummaryType;
  /** Whether the validation passed (no critical errors) */
  isValid: boolean;
  /** Report metadata */
  metadata?: {
    filename?: string;
    fiscalYear?: string;
    upeJurisdiction?: string;
    upeName?: string;
    jurisdictionCount?: number;
    entityCount?: number;
  };
  /** Category breakdown */
  byCategory?: Record<string, number>;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Additional CSS classes */
  className?: string;
}

interface SeverityConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SEVERITY_CONFIG: Record<string, SeverityConfig> = {
  critical: {
    label: 'Critical',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  error: {
    label: 'Errors',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  warning: {
    label: 'Warnings',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  info: {
    label: 'Info',
    icon: <Info className="h-4 w-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  xml_wellformedness: 'XML Structure',
  schema_compliance: 'Schema Compliance',
  business_rules: 'Business Rules',
  country_rules: 'Country Rules',
  data_quality: 'Data Quality',
  pillar2_readiness: 'Pillar 2',
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Validation summary overview card
 */
export function ValidationSummary({
  summary,
  isValid,
  metadata,
  byCategory,
  durationMs,
  className,
}: ValidationSummaryProps) {
  const [showCategories, setShowCategories] = useState(false);

  const totalIssues = summary.critical + summary.errors + summary.warnings + summary.info;
  const passRate = summary.total > 0
    ? Math.round((summary.passed / summary.total) * 100)
    : 100;

  return (
    <Card className={cn('overflow-hidden bg-slate-900/50 border-slate-800', className)}>
      {/* Header with pass/fail status */}
      <CardHeader
        className={cn(
          'border-b border-slate-800',
          isValid ? 'bg-emerald-500/10' : 'bg-red-500/10'
        )}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
            <FileCheck className="h-5 w-5 text-blue-400" />
            Validation Summary
          </CardTitle>
          <Badge
            variant={isValid ? 'default' : 'destructive'}
            className={cn(
              'text-sm px-3 py-1',
              isValid && 'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            {isValid ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Passed
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" />
                Failed
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Score progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Validation Score</span>
            <span className="font-semibold text-slate-100">{passRate}%</span>
          </div>
          <Progress
            value={passRate}
            className={cn(
              'h-3 bg-slate-700',
              passRate >= 80 && '[&>div]:bg-emerald-500',
              passRate >= 50 && passRate < 80 && '[&>div]:bg-amber-500',
              passRate < 50 && '[&>div]:bg-red-500'
            )}
          />
          <p className="text-xs text-slate-500">
            {summary.passed} of {summary.total} checks passed
          </p>
        </div>

        {/* Severity counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(SEVERITY_CONFIG).map(([key, config]) => {
            // Map severity keys to summary property names
            const countMap: Record<string, number> = {
              critical: summary.critical,
              error: summary.errors,
              warning: summary.warnings,
              info: summary.info,
            };
            const count = countMap[key] ?? 0;
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className={config.color}>{config.icon}</div>
                <div>
                  <p className={cn('text-2xl font-bold', config.color)}>
                    {count}
                  </p>
                  <p className="text-xs text-slate-400">{config.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Report metadata */}
        {metadata && (
          <>
            <Separator className="bg-slate-700" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {metadata.filename && (
                <div>
                  <p className="text-slate-500">Filename</p>
                  <p className="font-medium text-slate-200 truncate" title={metadata.filename}>
                    {metadata.filename}
                  </p>
                </div>
              )}
              {metadata.fiscalYear && (
                <div>
                  <p className="text-slate-500">Fiscal Year</p>
                  <p className="font-medium text-slate-200">{metadata.fiscalYear}</p>
                </div>
              )}
              {metadata.upeJurisdiction && (
                <div>
                  <p className="text-slate-500">UPE Jurisdiction</p>
                  <p className="font-medium text-slate-200">{metadata.upeJurisdiction}</p>
                </div>
              )}
              {metadata.upeName && (
                <div>
                  <p className="text-slate-500">UPE Name</p>
                  <p className="font-medium text-slate-200 truncate" title={metadata.upeName}>
                    {metadata.upeName}
                  </p>
                </div>
              )}
              {metadata.jurisdictionCount !== undefined && (
                <div>
                  <p className="text-slate-500">Jurisdictions</p>
                  <p className="font-medium text-slate-200">{metadata.jurisdictionCount}</p>
                </div>
              )}
              {metadata.entityCount !== undefined && (
                <div>
                  <p className="text-slate-500">Entities</p>
                  <p className="font-medium text-slate-200">{metadata.entityCount}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Category breakdown - collapsible */}
        {byCategory && Object.keys(byCategory).length > 0 && (
          <>
            <Separator className="bg-slate-700" />
            <div>
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center justify-between w-full text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="font-medium">Issues by Category</span>
                {showCategories ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showCategories && (
                <div className="mt-4 space-y-2">
                  {Object.entries(byCategory).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg"
                    >
                      <span className="text-sm text-slate-300">
                        {CATEGORY_LABELS[category] || category}
                      </span>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Duration */}
        {durationMs !== undefined && (
          <p className="text-xs text-slate-400 text-right">
            Validated in {(durationMs / 1000).toFixed(2)}s
          </p>
        )}
      </CardContent>
    </Card>
  );
}

