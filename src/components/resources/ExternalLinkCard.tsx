'use client';

/**
 * External Link Card Component
 *
 * Card display for external resources with link.
 *
 * @module components/resources/ExternalLinkCard
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import type { ExternalResource, ResourceCategory } from '@/constants/external-resources';

interface ExternalLinkCardProps {
  resource: ExternalResource;
}

const CATEGORY_COLORS: Record<ResourceCategory, { bg: string; text: string }> = {
  oecd: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
  },
  government: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
  },
  'tax-authority': {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-800 dark:text-violet-300',
  },
  tool: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
  },
  guidance: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-800 dark:text-cyan-300',
  },
  legislation: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-800 dark:text-slate-300',
  },
};

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  oecd: 'OECD Document',
  government: 'Government Portal',
  'tax-authority': 'Tax Authority',
  tool: 'Tool',
  guidance: 'Guidance',
  legislation: 'Legislation',
};

export function ExternalLinkCard({ resource }: ExternalLinkCardProps) {
  const categoryColors = CATEGORY_COLORS[resource.category];

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-accent/50 group-hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Badge
              variant="outline"
              className={`${categoryColors.bg} ${categoryColors.text} border-0`}
            >
              {CATEGORY_LABELS[resource.category]}
            </Badge>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
          </div>
          <CardTitle className="text-base group-hover:text-accent transition-colors">
            {resource.title}
          </CardTitle>
          <CardDescription className="text-sm">
            {resource.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5">
            {resource.jurisdiction && (
              <Badge variant="outline" className="text-xs">
                {resource.jurisdiction}
              </Badge>
            )}
            {resource.language && resource.language !== 'en' && (
              <Badge variant="outline" className="text-xs">
                {resource.language.toUpperCase()}
              </Badge>
            )}
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
          {resource.lastUpdated && (
            <p className="text-xs text-muted-foreground mt-3">
              Last updated: {resource.lastUpdated}
            </p>
          )}
        </CardContent>
      </Card>
    </a>
  );
}
