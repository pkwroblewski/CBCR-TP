'use client';

/**
 * Rules Table Component
 *
 * Searchable, filterable table for validation rules.
 *
 * @module components/resources/RulesTable
 */

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { ValidationCategory, ValidationSeverity } from '@/types/validation';
import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  CATEGORY_COLORS,
} from '@/lib/resources-utils';
import type { ValidationRule } from '@/types/validation';

interface RulesTableProps {
  rules: ValidationRule[];
}

export function RulesTable({ rules }: RulesTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        rule.ruleId.toLowerCase().includes(searchLower) ||
        rule.name.toLowerCase().includes(searchLower) ||
        rule.description.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory =
        categoryFilter === 'all' || rule.category === categoryFilter;

      // Severity filter
      const matchesSeverity =
        severityFilter === 'all' || rule.defaultSeverity === severityFilter;

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [rules, search, categoryFilter, severityFilter]);

  const toggleRow = (ruleId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rules by ID, name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.values(ValidationCategory).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {Object.values(ValidationSeverity).map((sev) => (
              <SelectItem key={sev} value={sev}>
                {SEVERITY_LABELS[sev]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredRules.length} of {rules.length} rules
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-32">Rule ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-40">Category</TableHead>
              <TableHead className="w-28">Severity</TableHead>
              <TableHead className="w-32 hidden lg:table-cell">OECD Code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRules.map((rule) => {
              const isExpanded = expandedRows.has(rule.ruleId);
              const severityColors = SEVERITY_COLORS[rule.defaultSeverity];
              const categoryColors = CATEGORY_COLORS[rule.category];

              return (
                <React.Fragment key={rule.ruleId}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleRow(rule.ruleId)}
                  >
                    <TableCell>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {rule.ruleId}
                    </TableCell>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${categoryColors.bg} ${categoryColors.text} border-0`}
                      >
                        {CATEGORY_LABELS[rule.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${severityColors.bg} ${severityColors.text} border-0`}
                      >
                        {SEVERITY_LABELS[rule.defaultSeverity]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-sm">
                      {rule.oecdErrorCode || '—'}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={6} className="p-0">
                        <div className="px-6 py-4 space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">
                              Description
                            </h4>
                            <p className="text-sm">{rule.description}</p>
                          </div>
                          {rule.reference && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                Reference
                              </h4>
                              <p className="text-sm font-mono text-muted-foreground">
                                {rule.reference}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredRules.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No rules found matching your criteria.
        </div>
      )}
    </div>
  );
}
