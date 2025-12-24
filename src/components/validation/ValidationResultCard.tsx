'use client';

/**
 * Validation Result Card Component
 *
 * Individual validation result display with severity badge,
 * expandable details, and copy functionality.
 *
 * @module components/validation/ValidationResultCard
 */

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ValidationResult, ValidationSeverity, ValidationCategory } from '@/types/validation';
import {
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code,
  Lightbulb,
  ExternalLink,
  Tag,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ValidationResultCardProps {
  /** Validation result data */
  result: ValidationResult;
  /** Whether the card is expanded by default */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface SeverityStyle {
  icon: React.ReactNode;
  badgeClass: string;
  borderClass: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SEVERITY_STYLES: Record<ValidationSeverity, SeverityStyle> = {
  critical: {
    icon: <XCircle className="h-4 w-4" />,
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    borderClass: 'border-l-red-500',
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" />,
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    borderClass: 'border-l-orange-500',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    borderClass: 'border-l-amber-500',
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    borderClass: 'border-l-blue-500',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  xml_wellformedness: 'XML',
  schema_validation: 'Schema',
  business_rules: 'Business',
  country_rules: 'Country',
  data_quality: 'Quality',
  pillar2_readiness: 'Pillar 2',
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Individual validation result card
 */
export function ValidationResultCard({
  result,
  defaultExpanded = false,
  className,
}: ValidationResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const severityStyle = SEVERITY_STYLES[result.severity];
  const hasDetails = result.xpath || result.suggestion || result.details || result.reference;

  /**
   * Copy XPath to clipboard
   */
  const copyXpath = useCallback(async () => {
    if (!result.xpath) return;

    try {
      await navigator.clipboard.writeText(result.xpath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy XPath');
    }
  }, [result.xpath]);

  return (
    <Card
      className={cn(
        'border-l-4 transition-shadow hover:shadow-md',
        severityStyle.borderClass,
        className
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Severity icon */}
          <div className={cn('mt-0.5', `text-${result.severity === 'critical' ? 'red' : result.severity === 'error' ? 'orange' : result.severity === 'warning' ? 'amber' : 'blue'}-500`)}>
            {severityStyle.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={cn('text-xs font-medium', severityStyle.badgeClass)}
              >
                {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {result.ruleId}
              </Badge>
              <Badge variant="outline" className="text-xs text-slate-600">
                {CATEGORY_LABELS[result.category] || result.category}
              </Badge>
            </div>

            {/* Message */}
            <p className="text-sm text-slate-900 leading-relaxed">
              {result.message}
            </p>

            {/* XPath preview */}
            {result.xpath && !isExpanded && (
              <p className="mt-2 text-xs text-slate-500 font-mono truncate">
                {result.xpath}
              </p>
            )}
          </div>

          {/* Expand button */}
          {hasDetails && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Expanded details */}
        {isExpanded && hasDetails && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            {/* XPath with copy button */}
            {result.xpath && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    XPath Location
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={copyXpath}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <code className="block p-2 bg-slate-100 rounded text-xs font-mono text-slate-700 break-all">
                  {result.xpath}
                </code>
              </div>
            )}

            {/* Suggestion */}
            {result.suggestion && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Suggestion
                </span>
                <p className="text-sm text-slate-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  {result.suggestion}
                </p>
              </div>
            )}

            {/* Reference */}
            {result.reference && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Reference
                </span>
                <p className="text-sm text-slate-600">
                  {result.reference}
                </p>
              </div>
            )}

            {/* Additional details */}
            {result.details && Object.keys(result.details).length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500">
                  Additional Details
                </span>
                <pre className="p-2 bg-slate-100 rounded text-xs font-mono text-slate-700 overflow-x-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            )}

            {/* OECD error code */}
            {result.oecdErrorCode && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  OECD Error Code:
                </span>
                <Badge variant="outline" className="text-xs font-mono">
                  {result.oecdErrorCode}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

