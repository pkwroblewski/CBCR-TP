'use client';

/**
 * AI Executive Summary Component
 *
 * Displays AI-generated executive summary at the top of validation reports.
 * Shows overall compliance status, key risks, and prioritized recommendations.
 * This is separate from the rule-based ExecutiveSummary component.
 *
 * @module components/reports/AiExecutiveSummary
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface AiExecutiveSummaryProps {
  /** AI-generated summary text */
  summary?: string;
  /** Whether the summary is AI-generated vs fallback */
  isAiGenerated?: boolean;
  /** Whether summary is being generated */
  isLoading?: boolean;
  /** Risk score 0-100 */
  riskScore?: number;
  /** Risk level classification */
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  /** Callback to regenerate summary */
  onRegenerate?: () => void;
  /** Finding counts for display */
  counts?: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RISK_LEVEL_CONFIG = {
  low: {
    label: 'Low Risk',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: CheckCircle2,
  },
  medium: {
    label: 'Medium Risk',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: AlertTriangle,
  },
  high: {
    label: 'High Risk',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: AlertCircle,
  },
  critical: {
    label: 'Critical Risk',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: XCircle,
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * AI-powered executive summary component for validation reports
 */
export function AiExecutiveSummary({
  summary,
  isAiGenerated = false,
  isLoading = false,
  riskScore,
  riskLevel = 'low',
  onRegenerate,
  counts,
  className,
}: AiExecutiveSummaryProps) {
  const config = RISK_LEVEL_CONFIG[riskLevel];
  const RiskIcon = config.icon;

  return (
    <Card
      className={cn(
        'overflow-hidden bg-slate-900/50 border-slate-800',
        className
      )}
    >
      <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
            <FileText className="h-5 w-5 text-blue-400" />
            AI Executive Summary
            {isAiGenerated && (
              <Badge
                variant="outline"
                className="ml-2 text-xs bg-blue-500/10 text-blue-400 border-blue-500/30"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
          </CardTitle>

          {/* Risk Score Badge */}
          {riskScore !== undefined && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Risk Score</p>
                <p className={cn('text-2xl font-bold', config.color)}>
                  {riskScore}
                </p>
              </div>
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <RiskIcon className={cn('h-4 w-4', config.color)} />
                <span className={cn('text-sm font-medium', config.color)}>
                  {config.label}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-sm text-slate-400">
                Generating AI executive summary...
              </p>
            </div>
          </div>
        )}

        {/* Summary Text */}
        {!isLoading && summary && (
          <div className="space-y-4">
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>
            </div>

            {/* Finding Counts */}
            {counts && (
              <div className="flex flex-wrap gap-3 pt-2">
                {counts.critical > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    <XCircle className="h-3 w-3 mr-1" />
                    {counts.critical} Critical
                  </Badge>
                )}
                {counts.error > 0 && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {counts.error} Errors
                  </Badge>
                )}
                {counts.warning > 0 && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {counts.warning} Warnings
                  </Badge>
                )}
                {counts.info > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {counts.info} Info
                  </Badge>
                )}
              </div>
            )}

            {/* Regenerate Button */}
            {onRegenerate && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate Summary
                </Button>
              </div>
            )}
          </div>
        )}

        {/* No Summary State */}
        {!isLoading && !summary && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 mb-4">
              No AI summary available yet.
            </p>
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Summary
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
