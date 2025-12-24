'use client';

/**
 * Upload Progress Component
 *
 * Premium progress display with gradient steps and refined animations.
 * Shows: Upload → Parse → Validate → Complete
 *
 * @module components/upload/UploadProgress
 */

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { UploadStage } from '@/hooks/useFileUpload';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Upload,
  FileSearch,
  Shield,
  Sparkles,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface UploadProgressProps {
  /** Current upload stage */
  stage: UploadStage;
  /** Progress percentage (0-100) */
  progress: number;
  /** Status message to display */
  statusMessage?: string;
  /** Error message if any */
  errorMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

interface Step {
  id: UploadStage;
  label: string;
  description: string;
  icon: React.ElementType;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STEPS: Step[] = [
  {
    id: 'uploading',
    label: 'Upload',
    description: 'Uploading file to server',
    icon: Upload,
  },
  {
    id: 'parsing',
    label: 'Parse',
    description: 'Parsing XML structure',
    icon: FileSearch,
  },
  {
    id: 'validating',
    label: 'Validate',
    description: 'Running validation checks',
    icon: Shield,
  },
  {
    id: 'complete',
    label: 'Complete',
    description: 'Validation finished',
    icon: Sparkles,
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Premium upload and validation progress display
 */
export function UploadProgress({
  stage,
  progress,
  statusMessage,
  errorMessage,
  className,
}: UploadProgressProps) {
  const isError = stage === 'error';
  const isComplete = stage === 'complete';
  const isActive = !['idle', 'error', 'complete'].includes(stage);

  /**
   * Get step status
   */
  const getStepStatus = (step: Step): 'pending' | 'active' | 'complete' | 'error' => {
    if (isError) {
      const currentIndex = STEPS.findIndex((s) => s.id === stage);
      const stepIndex = STEPS.findIndex((s) => s.id === step.id);

      if (stepIndex < currentIndex) return 'complete';
      if (stage !== 'error' && step.id === stage) return 'error';
      return 'pending';
    }

    if (isComplete) {
      return 'complete';
    }

    const currentIndex = STEPS.findIndex((s) => s.id === stage);
    const stepIndex = STEPS.findIndex((s) => s.id === step.id);

    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  /**
   * Render step icon
   */
  const renderStepIcon = (step: Step, status: 'pending' | 'active' | 'complete' | 'error') => {
    const IconComponent = step.icon;

    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-white" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-white animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-white" />;
      default:
        return <IconComponent className="h-5 w-5 text-muted-foreground/50" />;
    }
  };

  // Don't render if idle
  if (stage === 'idle') {
    return null;
  }

  return (
    <div
      className={cn('space-y-6 animate-fade-in', className)}
      aria-busy={isActive}
      aria-live="polite"
    >
      {/* Progress bar with gradient */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground" aria-live="polite">
            {statusMessage || 'Processing...'}
          </span>
          <span
            className={cn(
              'text-sm font-bold px-3 py-1 rounded-full',
              isComplete && 'bg-emerald-100 text-emerald-700',
              isError && 'bg-red-100 text-red-700',
              isActive && 'bg-accent/10 text-accent'
            )}
            aria-label={`Progress: ${Math.round(progress)} percent`}
          >
            {Math.round(progress)}%
          </span>
        </div>
        <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out',
              isError && 'bg-gradient-to-r from-red-500 to-red-400',
              isComplete && 'bg-gradient-to-r from-emerald-500 to-emerald-400',
              isActive && 'bg-gradient-to-r from-accent to-cyan-400'
            )}
            style={{ width: `${progress}%` }}
          />
          {isActive && (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/30 to-transparent animate-pulse"
              style={{ width: `${progress}%` }}
            />
          )}
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step);
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500',
                    status === 'complete' && 'bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/30',
                    status === 'active' && 'bg-gradient-to-br from-accent to-cyan-400 shadow-lg shadow-accent/30 scale-110',
                    status === 'error' && 'bg-gradient-to-br from-red-500 to-red-400 shadow-lg shadow-red-500/30',
                    status === 'pending' && 'bg-slate-100 border-2 border-slate-200'
                  )}
                >
                  {renderStepIcon(step, status)}
                  {status === 'active' && (
                    <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-3 text-xs font-bold uppercase tracking-wider transition-colors duration-300',
                    status === 'complete' && 'text-emerald-600',
                    status === 'active' && 'text-accent',
                    status === 'error' && 'text-red-600',
                    status === 'pending' && 'text-muted-foreground/50'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 h-1 mx-3 rounded-full overflow-hidden bg-slate-100">
                  <div
                    className={cn(
                      'h-full transition-all duration-500 ease-out rounded-full',
                      status === 'complete'
                        ? 'w-full bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : 'w-0'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {isError && errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-5 glass border border-red-200/50 rounded-2xl shadow-lg animate-fade-in"
        >
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100">
              <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-red-800">{errorMessage}</p>
              <p className="text-sm text-red-600 mt-1">
                Please check your file and try again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {isComplete && (
        <div
          role="status"
          aria-live="polite"
          className="relative overflow-hidden p-5 bg-gradient-to-r from-emerald-50 to-emerald-50/50 border border-emerald-200/50 rounded-2xl shadow-lg animate-fade-in"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-emerald-800">
                Validation Complete
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                Your CbC report has been validated successfully. View the results to see detailed findings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
