'use client';

/**
 * Glossary Accordion Component
 *
 * Accordion display for glossary terms.
 *
 * @module components/resources/GlossaryAccordion
 */

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search } from 'lucide-react';
import type { GlossaryTerm, GlossaryCategory } from '@/constants/glossary';

interface GlossaryAccordionProps {
  terms: GlossaryTerm[];
}

const CATEGORY_COLORS: Record<GlossaryCategory, { bg: string; text: string }> = {
  cbcr: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-800 dark:text-violet-300',
  },
  pillar2: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
  },
  general: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
  },
  technical: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
  },
};

const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  cbcr: 'CbCR',
  pillar2: 'Pillar 2',
  general: 'General',
  technical: 'Technical',
};

export function GlossaryAccordion({ terms }: GlossaryAccordionProps) {
  const [search, setSearch] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Get all unique first letters
  const letters = useMemo(() => {
    const letterSet = new Set(terms.map((t) => t.term[0].toUpperCase()));
    return Array.from(letterSet).sort();
  }, [terms]);

  // Filter terms
  const filteredTerms = useMemo(() => {
    return terms.filter((term) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        term.term.toLowerCase().includes(searchLower) ||
        term.definition.toLowerCase().includes(searchLower) ||
        term.acronym?.toLowerCase().includes(searchLower);

      // Letter filter
      const matchesLetter =
        !selectedLetter || term.term[0].toUpperCase() === selectedLetter;

      return matchesSearch && matchesLetter;
    });
  }, [terms, search, selectedLetter]);

  // Group filtered terms by letter
  const groupedTerms = useMemo(() => {
    const groups = new Map<string, GlossaryTerm[]>();
    filteredTerms.forEach((term) => {
      const letter = term.term[0].toUpperCase();
      if (!groups.has(letter)) {
        groups.set(letter, []);
      }
      groups.get(letter)!.push(term);
    });
    return groups;
  }, [filteredTerms]);

  return (
    <div className="space-y-6">
      {/* Search and Letter Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Letter navigation */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedLetter(null)}
            className={`px-2.5 py-1 text-sm font-medium rounded transition-colors ${
              selectedLetter === null
                ? 'bg-accent text-white'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            All
          </button>
          {letters.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-2.5 py-1 text-sm font-medium rounded transition-colors ${
                selectedLetter === letter
                  ? 'bg-accent text-white'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredTerms.length} of {terms.length} terms
      </p>

      {/* Terms by letter */}
      {Array.from(groupedTerms.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([letter, letterTerms]) => (
          <div key={letter} className="space-y-2">
            <h3 className="text-lg font-bold text-primary border-b pb-2">
              {letter}
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {letterTerms.map((term) => {
                const categoryColors = CATEGORY_COLORS[term.category];
                return (
                  <AccordionItem
                    key={term.term}
                    value={term.term}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <span className="font-semibold">{term.term}</span>
                        {term.acronym && (
                          <Badge variant="outline" className="font-mono">
                            {term.acronym}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`${categoryColors.bg} ${categoryColors.text} border-0`}
                        >
                          {CATEGORY_LABELS[term.category]}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-3">
                      <p className="text-muted-foreground">{term.definition}</p>

                      {term.relatedTerms && term.relatedTerms.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Related Terms
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {term.relatedTerms.map((related) => (
                              <Badge key={related} variant="outline">
                                {related}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {term.reference && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Reference
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {term.reference}
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        ))}

      {filteredTerms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No terms found matching your search.
        </div>
      )}
    </div>
  );
}
