'use client';

/**
 * Validation Progress Component
 *
 * Real-time validation progress display with animated spinner
 * and layer-by-layer status updates.
 *
 * @module components/validation/ValidationProgress
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ValidationProgress as ValidationProgressType } from '@/types/validation';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ValidationProgressProps {
  /** Progress data */
  progress: ValidationProgressType;
  /** Callback to cancel validation */
  onCancel?: () => void;
  /** Whether cancellation is allowed */
  canCancel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface LayerStatus {
  id: string;
  label: string;
  description: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const VALIDATION_LAYERS: LayerStatus[] = [
  {
    id: 'parsing',
    label: 'XML Parsing',
    description: 'Checking XML structure and well-formedness',
  },
  {
    id: 'schema',
    label: 'Schema Validation',
    description: 'Validating against OECD CbC-Schema v2.0',
  },
  {
    id: 'business_rules',
    label: 'Business Rules',
    description: 'Checking OECD business rule compliance',
  },
  {
    id: 'country_rules',
    label: 'Country Rules',
    description: 'Applying jurisdiction-specific rules',
  },
  {
    id: 'data_quality',
    label: 'Data Quality',
    description: 'Analyzing data consistency and completeness',
  },
  {
    id: 'pillar2',
    label: 'Pillar 2 Analysis',
    description: 'Checking GloBE readiness and safe harbour eligibility',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Real-time validation progress display
 */
export function ValidationProgress({
  progress,
  onCancel,
  canCancel = true,
  className,
}: ValidationProgressProps) {
  const isComplete = progress.phase === 'complete';
  const isError = progress.phase === 'error';
  const currentLayerIndex = VALIDATION_LAYERS.findIndex(
    (layer) => layer.id === progress.phase
  );

  /**
   * Get layer status
   */
  const getLayerStatus = (index: number): 'pending' | 'active' | 'complete' => {
    if (isComplete) return 'complete';
    if (index < currentLayerIndex) return 'complete';
    if (index === currentLayerIndex) return 'active';
    return 'pending';
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isComplete ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : isError ? (
                <XCircle className="h-6 w-6 text-red-500" />
              ) : (
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              )}
              <div>
                <h3 className="font-semibold text-slate-900">
                  {isComplete
                    ? 'Validation Complete'
                    : isError
                    ? 'Validation Failed'
                    : 'Validating CbC Report'}
                </h3>
                <p className="text-sm text-slate-500">{progress.message}</p>
              </div>
            </div>

            {canCancel && !isComplete && !isError && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Overall Progress</span>
              <span className="font-medium text-slate-900">
                {Math.round(progress.percentage)}%
              </span>
            </div>
            <Progress
              value={progress.percentage}
              className={cn(
                'h-2',
                isComplete && '[&>div]:bg-emerald-500',
                isError && '[&>div]:bg-red-500'
              )}
            />
          </div>

          {/* Layer progress */}
          <div className="space-y-1">
            {VALIDATION_LAYERS.map((layer, index) => {
              const status = getLayerStatus(index);
              const isActive = status === 'active';

              return (
                <div
                  key={layer.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-all duration-300',
                    status === 'complete' && 'bg-emerald-50',
                    isActive && 'bg-blue-50',
                    status === 'pending' && 'opacity-50'
                  )}
                >
                  {/* Status indicator */}
                  <div className="w-6 flex justify-center">
                    {status === 'complete' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-slate-300" />
                    )}
                  </div>

                  {/* Layer info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        status === 'complete' && 'text-emerald-700',
                        isActive && 'text-blue-700',
                        status === 'pending' && 'text-slate-500'
                      )}
                    >
                      {layer.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {layer.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Issues found counter */}
          {progress.issuesFound > 0 && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Issues Found</span>
              <span className="text-lg font-semibold text-slate-900">
                {progress.issuesFound}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

