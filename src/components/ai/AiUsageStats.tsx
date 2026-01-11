'use client';

/**
 * AI Usage Statistics Component
 *
 * Displays AI API usage statistics for the current user.
 * Shows token counts, estimated costs, and usage breakdown.
 *
 * @module components/ai/AiUsageStats
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Zap,
  DollarSign,
  TrendingUp,
  FileText,
  MessageSquare,
  Calendar,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface AiUsageStatsProps {
  /** Usage data from Convex query */
  usage?: {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCost: number;
    thisMonth: {
      requests: number;
      inputTokens: number;
      outputTokens: number;
      estimatedCost: number;
    };
    byOperation: Record<
      string,
      { count: number; inputTokens: number; outputTokens: number }
    >;
  };
  /** Whether data is loading */
  isLoading?: boolean;
  /** Monthly token limit (if applicable) */
  monthlyLimit?: number;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * AI usage statistics display
 */
export function AiUsageStats({
  usage,
  isLoading = false,
  monthlyLimit,
  className,
}: AiUsageStatsProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('bg-slate-900 border-slate-800', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading usage data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No usage data yet
  if (!usage || usage.totalRequests === 0) {
    return (
      <Card className={cn('bg-slate-900 border-slate-800', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Sparkles className="h-5 w-5 text-purple-400" />
            AI Usage
          </CardTitle>
          <CardDescription className="text-slate-400">
            Track your AI-powered insights usage and costs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 mb-2">No AI usage yet</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Start using AI-powered explanations and summaries in your
              validation reports to see usage statistics here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthlyUsagePercent = monthlyLimit
    ? Math.min(100, (usage.thisMonth.outputTokens / monthlyLimit) * 100)
    : 0;

  return (
    <Card className={cn('bg-slate-900 border-slate-800', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Sparkles className="h-5 w-5 text-purple-400" />
          AI Usage
        </CardTitle>
        <CardDescription className="text-slate-400">
          Track your AI-powered insights usage and costs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* This Month Overview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Calendar className="h-4 w-4 text-slate-400" />
            This Month
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <MessageSquare className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-100">
                {usage.thisMonth.requests}
              </p>
              <p className="text-xs text-slate-400">Requests</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Zap className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-100">
                {formatNumber(usage.thisMonth.inputTokens)}
              </p>
              <p className="text-xs text-slate-400">Input Tokens</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <TrendingUp className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-100">
                {formatNumber(usage.thisMonth.outputTokens)}
              </p>
              <p className="text-xs text-slate-400">Output Tokens</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <DollarSign className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-100">
                ${usage.thisMonth.estimatedCost.toFixed(2)}
              </p>
              <p className="text-xs text-slate-400">Est. Cost</p>
            </div>
          </div>

          {/* Monthly Limit Progress */}
          {monthlyLimit && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Monthly Limit</span>
                <span className="text-slate-300">
                  {formatNumber(usage.thisMonth.outputTokens)} /{' '}
                  {formatNumber(monthlyLimit)} tokens
                </span>
              </div>
              <Progress
                value={monthlyUsagePercent}
                className={cn(
                  'h-2',
                  monthlyUsagePercent >= 90
                    ? '[&>div]:bg-red-500'
                    : monthlyUsagePercent >= 70
                      ? '[&>div]:bg-amber-500'
                      : '[&>div]:bg-emerald-500'
                )}
              />
              {monthlyUsagePercent >= 90 && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Approaching monthly limit
                </p>
              )}
            </div>
          )}
        </div>

        <Separator className="bg-slate-800" />

        {/* Usage by Operation */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-300">By Operation</p>
          <div className="space-y-2">
            {Object.entries(usage.byOperation).map(([operation, data]) => (
              <div
                key={operation}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  {operation === 'finding_explanation' ? (
                    <FileText className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-purple-400" />
                  )}
                  <div>
                    <p className="text-sm text-slate-200">
                      {operation === 'finding_explanation'
                        ? 'Finding Explanations'
                        : 'Executive Summaries'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatNumber(data.inputTokens)} in /{' '}
                      {formatNumber(data.outputTokens)} out
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                  {data.count} calls
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* All Time Totals */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-300">All Time</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Total Requests</p>
              <p className="text-lg font-semibold text-slate-100">
                {usage.totalRequests}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Total Input</p>
              <p className="text-lg font-semibold text-slate-100">
                {formatNumber(usage.totalInputTokens)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Total Output</p>
              <p className="text-lg font-semibold text-slate-100">
                {formatNumber(usage.totalOutputTokens)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Total Cost</p>
              <p className="text-lg font-semibold text-slate-100">
                ${usage.estimatedCost.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Note */}
        <p className="text-xs text-slate-500 pt-2">
          Cost estimates based on Claude 3.5 Sonnet pricing ($3/M input, $15/M
          output tokens). Actual billing may vary.
        </p>
      </CardContent>
    </Card>
  );
}
