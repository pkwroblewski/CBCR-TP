'use client';

/**
 * OECD Error Card Component
 *
 * Card display for OECD common errors.
 *
 * @module components/resources/OecdErrorCard
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import type { OecdCommonErrorRule } from '@/constants/validation-rules';

interface OecdErrorCardProps {
  error: OecdCommonErrorRule;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-500',
  },
  error: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-500',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-500',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-500',
  },
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

export function OecdErrorCard({ error }: OecdErrorCardProps) {
  const severityColors = SEVERITY_COLORS[error.severity] || SEVERITY_COLORS.warning;
  const severityLabel = SEVERITY_LABELS[error.severity] || error.severity;

  return (
    <Card className={`border-l-4 ${severityColors.border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="font-mono mb-2">
              {error.id}
            </Badge>
            <CardTitle className="text-lg">{error.title}</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={`${severityColors.bg} ${severityColors.text} border-0 shrink-0`}
          >
            {severityLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{error.description}</p>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors">
            <ChevronDown className="h-4 w-4" />
            View Details
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            {error.correctTreatment && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Correct Treatment
                </h4>
                <p className="text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-3 rounded-lg">
                  {error.correctTreatment}
                </p>
              </div>
            )}

            {error.reference && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Reference
                </h4>
                <p className="text-sm text-muted-foreground">
                  {error.reference}
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
