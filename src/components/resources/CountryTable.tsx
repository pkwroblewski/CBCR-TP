'use client';

/**
 * Country Table Component
 *
 * Searchable, filterable table for country compliance information.
 *
 * @module components/resources/CountryTable
 */

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ChevronDown, ChevronRight, Check, X } from 'lucide-react';

/**
 * Serializable country data for client component
 * (RegExp converted to string for server-client transfer)
 */
export interface SerializableCountry {
  code: string;
  name: string;
  cbcrParticipant?: boolean;
  pillar2Implemented?: boolean;
  tinFormat?: string;
  tinPatternSource?: string; // RegExp.source converted to string
  filingDeadlineMonths?: number;
  currencyCode?: string;
}

interface CountryTableProps {
  countries: SerializableCountry[];
}

export function CountryTable({ countries }: CountryTableProps) {
  const [search, setSearch] = useState('');
  const [filterCbcr, setFilterCbcr] = useState(false);
  const [filterPillar2, setFilterPillar2] = useState(false);
  const [filterTin, setFilterTin] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredCountries = useMemo(() => {
    return countries.filter((country) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        country.name.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase().includes(searchLower);

      // Checkbox filters
      const matchesCbcr = !filterCbcr || country.cbcrParticipant;
      const matchesPillar2 = !filterPillar2 || country.pillar2Implemented;
      const matchesTin = !filterTin || !!country.tinPatternSource;

      return matchesSearch && matchesCbcr && matchesPillar2 && matchesTin;
    });
  }, [countries, search, filterCbcr, filterPillar2, filterTin]);

  const toggleRow = (code: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const StatusIcon = ({ status }: { status: boolean | undefined }) => {
    if (status) {
      return <Check className="h-4 w-4 text-emerald-600" />;
    }
    return <X className="h-4 w-4 text-muted-foreground/50" />;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by country name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={filterCbcr}
              onCheckedChange={(checked) => setFilterCbcr(checked === true)}
            />
            CbCR Participants
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={filterPillar2}
              onCheckedChange={(checked) => setFilterPillar2(checked === true)}
            />
            Pillar 2 Implemented
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={filterTin}
              onCheckedChange={(checked) => setFilterTin(checked === true)}
            />
            Has TIN Pattern
          </label>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredCountries.length} of {countries.length} countries
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-20">Code</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="w-48 hidden md:table-cell">TIN Format</TableHead>
              <TableHead className="w-28 text-center">CbCR</TableHead>
              <TableHead className="w-28 text-center">Pillar 2</TableHead>
              <TableHead className="w-32 hidden lg:table-cell">Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCountries.map((country) => {
              const isExpanded = expandedRows.has(country.code);

              return (
                <React.Fragment key={country.code}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleRow(country.code)}
                  >
                    <TableCell>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {country.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{country.name}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
                      {country.tinFormat || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusIcon status={country.cbcrParticipant} />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusIcon status={country.pillar2Implemented} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {country.filingDeadlineMonths
                        ? `${country.filingDeadlineMonths} months`
                        : '—'}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={7} className="p-0">
                        <div className="px-6 py-4 grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              TIN Information
                            </h4>
                            <dl className="space-y-1 text-sm">
                              <div className="flex gap-2">
                                <dt className="text-muted-foreground">Format:</dt>
                                <dd className="font-mono">
                                  {country.tinFormat || 'Not specified'}
                                </dd>
                              </div>
                              {country.tinPatternSource && (
                                <div className="flex gap-2">
                                  <dt className="text-muted-foreground">Pattern:</dt>
                                  <dd className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                    {country.tinPatternSource}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              Compliance Status
                            </h4>
                            <dl className="space-y-1 text-sm">
                              <div className="flex gap-2 items-center">
                                <dt className="text-muted-foreground">CbCR Participant:</dt>
                                <dd>
                                  {country.cbcrParticipant ? (
                                    <Badge className="bg-emerald-100 text-emerald-800 border-0">
                                      Yes
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">No</Badge>
                                  )}
                                </dd>
                              </div>
                              <div className="flex gap-2 items-center">
                                <dt className="text-muted-foreground">Pillar 2:</dt>
                                <dd>
                                  {country.pillar2Implemented ? (
                                    <Badge className="bg-blue-100 text-blue-800 border-0">
                                      Implemented
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Not yet</Badge>
                                  )}
                                </dd>
                              </div>
                              {country.filingDeadlineMonths && (
                                <div className="flex gap-2">
                                  <dt className="text-muted-foreground">Filing Deadline:</dt>
                                  <dd>{country.filingDeadlineMonths} months from FY end</dd>
                                </div>
                              )}
                            </dl>
                          </div>
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

      {filteredCountries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No countries found matching your criteria.
        </div>
      )}
    </div>
  );
}
