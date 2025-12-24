'use client';

/**
 * OECD Common Errors Page
 *
 * Reference guide to the 28 common CbCR errors identified by the OECD.
 *
 * @module app/resources/oecd-errors/page
 */

import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResourcesBreadcrumb } from '@/components/resources/ResourcesBreadcrumb';
import { OecdErrorCard } from '@/components/resources/OecdErrorCard';
import { getOecdCommonErrors } from '@/lib/resources-utils';

export default function OecdErrorsPage() {
  const errors = getOecdCommonErrors();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredErrors = useMemo(() => {
    return errors.filter((error) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        error.id.toLowerCase().includes(searchLower) ||
        error.title.toLowerCase().includes(searchLower) ||
        error.description.toLowerCase().includes(searchLower);

      // Severity filter
      const matchesSeverity =
        severityFilter === 'all' || error.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [errors, search, severityFilter]);

  const severityCounts = useMemo(() => {
    return {
      critical: errors.filter((e) => e.severity === 'critical').length,
      error: errors.filter((e) => e.severity === 'error').length,
      warning: errors.filter((e) => e.severity === 'warning').length,
    };
  }, [errors]);

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <ResourcesBreadcrumb items={[{ label: 'OECD Common Errors' }]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                OECD Common Errors
              </h1>
              <p className="text-muted-foreground">
                {errors.length} error types identified by the OECD
              </p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Reference guide to the common CbCR filing errors identified by the OECD.
            Each error includes severity classification, detailed description, correct
            treatment guidance, and examples to help avoid common pitfalls.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-l-4 border-l-red-500 p-4">
            <div className="text-2xl font-bold text-red-600">{severityCounts.critical}</div>
            <div className="text-sm text-muted-foreground">Critical Errors</div>
          </div>
          <div className="bg-white rounded-lg border border-l-4 border-l-orange-500 p-4">
            <div className="text-2xl font-bold text-orange-600">{severityCounts.error}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
          <div className="bg-white rounded-lg border border-l-4 border-l-amber-500 p-4">
            <div className="text-2xl font-bold text-amber-600">{severityCounts.warning}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder="Search errors by ID, title, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          Showing {filteredErrors.length} of {errors.length} errors
        </p>

        {/* Error Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredErrors.map((error) => (
            <OecdErrorCard key={error.id} error={error} />
          ))}
        </div>

        {filteredErrors.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No errors found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
