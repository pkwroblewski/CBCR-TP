'use client';

/**
 * AI Insights Panel Component
 *
 * Control panel for generating AI insights for validation reports.
 * Allows users to trigger AI explanation generation for findings.
 *
 * @module components/ai/AiInsightsPanel
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  FileText,
  DollarSign,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface AiInsightsPanelProps {
  /** Total number of findings */
  totalFindings: number;
  /** Number of findings with AI explanations */
  findingsWithAi: number;
  /** Whether generation is in progress */
  isGenerating?: boolean;
  /** Current progress (0-100) */
  progress?: number;
  /** Estimated cost in dollars */
  estimatedCost?: number;
  /** Callback to start generating explanations */
  onGenerateAll?: () => void;
  /** Callback to generate summary only */
  onGenerateSummary?: () => void;
  /** Error message if generation failed */
  error?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * AI insights control panel
 */
export function AiInsightsPanel({
  totalFindings,
  findingsWithAi,
  isGenerating = false,
  progress = 0,
  estimatedCost,
  onGenerateAll,
  onGenerateSummary,
  error,
  className,
}: AiInsightsPanelProps) {
  const remainingFindings = totalFindings - findingsWithAi;
  const completionRate = totalFindings > 0 ? (findingsWithAi / totalFindings) * 100 : 0;
  const isComplete = remainingFindings === 0;

  return (
    <Card
      className={cn(
        'overflow-hidden bg-slate-900/50 border-slate-800',
        className
      )}
    >
      <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
          <Sparkles className="h-5 w-5 text-purple-400" />
          AI Insights
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">AI Explanations</span>
            <span className="text-slate-200 font-medium">
              {findingsWithAi} / {totalFindings}
            </span>
          </div>
          <Progress
            value={completionRate}
            className="h-2 [&>div]:bg-purple-500"
          />
          {isComplete ? (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              All findings have AI explanations
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              {remainingFindings} findings need AI explanations
            </p>
          )}
        </div>

        {/* Generating Progress */}
        {isGenerating && (
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              <span className="text-sm text-purple-300">
                Generating AI insights...
              </span>
            </div>
            <Progress value={progress} className="h-1.5 [&>div]:bg-purple-400" />
            <p className="text-xs text-slate-500 mt-2">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {/* Cost Estimate */}
        {estimatedCost !== undefined && remainingFindings > 0 && (
          <div className="flex items-center justify-between text-sm p-3 bg-slate-800/50 rounded-lg">
            <span className="text-slate-400 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              Estimated Cost
            </span>
            <span className="text-slate-200 font-medium">
              ${estimatedCost.toFixed(3)}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {!isGenerating && !isComplete && (
          <div className="flex flex-col gap-2 pt-2">
            {onGenerateAll && (
              <Button
                onClick={onGenerateAll}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm"
              >
                <Zap className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Generate All AI</span>
              </Button>
            )}
            {onGenerateSummary && (
              <Button
                variant="outline"
                onClick={onGenerateSummary}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Summary Only</span>
              </Button>
            )}
          </div>
        )}

        {/* Completed State */}
        {!isGenerating && isComplete && totalFindings > 0 && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm text-slate-300">
              All AI insights generated!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
