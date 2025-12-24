'use client';

/**
 * Pillar 2 Card Component
 *
 * Card display for Pillar 2 concepts and jurisdictions.
 *
 * @module components/resources/Pillar2Card
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Pillar2Concept, Pillar2ConceptCategory } from '@/constants/pillar2-info';

interface Pillar2CardProps {
  concept: Pillar2Concept;
}

const CATEGORY_COLORS: Record<Pillar2ConceptCategory, { bg: string; text: string }> = {
  rule: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
  },
  mechanism: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-800 dark:text-violet-300',
  },
  calculation: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
  },
  'safe-harbour': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
  },
  threshold: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-800 dark:text-cyan-300',
  },
};

const CATEGORY_LABELS: Record<Pillar2ConceptCategory, string> = {
  rule: 'Core Rule',
  mechanism: 'Mechanism',
  calculation: 'Calculation',
  'safe-harbour': 'Safe Harbour',
  threshold: 'Threshold',
};

export function Pillar2Card({ concept }: Pillar2CardProps) {
  const categoryColors = CATEGORY_COLORS[concept.category];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className={`${categoryColors.bg} ${categoryColors.text} border-0`}
          >
            {CATEGORY_LABELS[concept.category]}
          </Badge>
        </div>
        <CardTitle className="text-lg">{concept.title}</CardTitle>
        <CardDescription className="text-sm">
          {concept.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Points */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Key Points
          </h4>
          <ul className="space-y-1.5">
            {concept.keyPoints.map((point, index) => (
              <li key={index} className="text-sm flex gap-2">
                <span className="text-accent">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Related Concepts */}
        {concept.relatedConcepts && concept.relatedConcepts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Related Concepts
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {concept.relatedConcepts.map((related) => (
                <Badge key={related} variant="outline" className="text-xs">
                  {related}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Reference */}
        {concept.reference && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Reference
            </h4>
            <p className="text-xs text-muted-foreground">{concept.reference}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
