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
  Sparkles,
  Loader2,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ValidationResultCardProps {
  /** Validation result data */
  result: ValidationResult;
  /** AI-generated explanation for this finding */
  aiExplanation?: string;
  /** Whether AI explanation is being generated */
  isGeneratingAi?: boolean;
  /** Callback to request AI explanation generation */
  onRequestAiExplanation?: () => void;
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
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    borderClass: 'border-l-red-500',
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" />,
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    borderClass: 'border-l-orange-500',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    borderClass: 'border-l-amber-500',
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
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
  aiExplanation,
  isGeneratingAi = false,
  onRequestAiExplanation,
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
        'border-l-4 transition-shadow hover:shadow-md bg-slate-900/50 border-slate-800',
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
              <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-300">
                <Tag className="h-3 w-3 mr-1" />
                {result.ruleId}
              </Badge>
              <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                {CATEGORY_LABELS[result.category] || result.category}
              </Badge>
            </div>

            {/* Message */}
            <p className="text-sm text-slate-200 leading-relaxed">
              {result.message}
            </p>

            {/* AI Explanation Section */}
            {aiExplanation && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-1">
                  <Sparkles className="h-4 w-4" />
                  AI Explanation
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{aiExplanation}</p>
              </div>
            )}

            {/* AI Loading State */}
            {isGeneratingAi && !aiExplanation && (
              <div className="mt-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating AI explanation...
                </div>
              </div>
            )}

            {/* Request AI Explanation Button */}
            {!aiExplanation && !isGeneratingAi && onRequestAiExplanation && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                onClick={onRequestAiExplanation}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Get AI Explanation
              </Button>
            )}

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
          <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
            {/* XPath with copy button */}
            {result.xpath && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    XPath Location
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-slate-400 hover:text-slate-200"
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
                <code className="block p-2 bg-slate-800 rounded text-xs font-mono text-slate-300 break-all">
                  {result.xpath}
                </code>
              </div>
            )}

            {/* Suggestion */}
            {result.suggestion && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Suggestion
                </span>
                <p className="text-sm text-emerald-300 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                  {result.suggestion}
                </p>
              </div>
            )}

            {/* Reference */}
            {result.reference && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Reference
                </span>
                <p className="text-sm text-slate-300">
                  {result.reference}
                </p>
              </div>
            )}

            {/* Additional details */}
            {result.details && Object.keys(result.details).length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400">
                  Additional Details
                </span>
                <pre className="p-2 bg-slate-800 rounded text-xs font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            )}

            {/* OECD error code */}
            {result.oecdErrorCode && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">
                  OECD Error Code:
                </span>
                <Badge variant="outline" className="text-xs font-mono text-slate-300 border-slate-600">
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

