'use client';

/**
 * Pillar 2 Guide Page
 *
 * Comprehensive guide to Pillar 2 / GloBE rules.
 *
 * @module app/resources/pillar2/page
 */

import { useState, useMemo } from 'react';
import { Scale, Check, X, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResourcesBreadcrumb } from '@/components/resources/ResourcesBreadcrumb';
import { Pillar2Card } from '@/components/resources/Pillar2Card';
import {
  PILLAR2_CONCEPTS,
  PILLAR2_JURISDICTIONS,
  getPillar2Statistics,
} from '@/constants/pillar2-info';

export default function Pillar2Page() {
  const stats = getPillar2Statistics();
  const [jurisdictionSearch, setJurisdictionSearch] = useState('');

  const filteredJurisdictions = useMemo(() => {
    if (!jurisdictionSearch) return PILLAR2_JURISDICTIONS;
    const search = jurisdictionSearch.toLowerCase();
    return PILLAR2_JURISDICTIONS.filter(
      (j) =>
        j.name.toLowerCase().includes(search) ||
        j.code.toLowerCase().includes(search)
    );
  }, [jurisdictionSearch]);

  const StatusBadge = ({ date }: { date: string | null }) => {
    if (!date) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <X className="h-3 w-3 mr-1" /> N/A
        </Badge>
      );
    }
    const dateObj = new Date(date);
    const now = new Date();
    if (dateObj <= now) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-0">
          <Check className="h-3 w-3 mr-1" /> {date}
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-800 border-0">
        <Clock className="h-3 w-3 mr-1" /> {date}
      </Badge>
    );
  };

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <ResourcesBreadcrumb items={[{ label: 'Pillar 2 Guide' }]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Scale className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Pillar 2 Guide
              </h1>
              <p className="text-muted-foreground">
                Global Minimum Tax and GloBE Rules Reference
              </p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Comprehensive guide to the OECD&apos;s Pillar 2 framework for a global minimum
            tax of 15%. Learn about the GloBE rules, IIR, UTPR, QDMTT mechanisms, safe
            harbours, and track jurisdiction implementation status.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-primary">15%</div>
            <div className="text-sm text-muted-foreground">Minimum Tax Rate</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {stats.implemented}
            </div>
            <div className="text-sm text-muted-foreground">Active Jurisdictions</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.withQdmtt}
            </div>
            <div className="text-sm text-muted-foreground">With QDMTT</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-violet-600">
              {PILLAR2_CONCEPTS.length}
            </div>
            <div className="text-sm text-muted-foreground">Key Concepts</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="concepts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="concepts">Key Concepts</TabsTrigger>
            <TabsTrigger value="jurisdictions">Jurisdictions</TabsTrigger>
          </TabsList>

          {/* Concepts Tab */}
          <TabsContent value="concepts" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PILLAR2_CONCEPTS.map((concept) => (
                <Pillar2Card key={concept.id} concept={concept} />
              ))}
            </div>
          </TabsContent>

          {/* Jurisdictions Tab */}
          <TabsContent value="jurisdictions" className="space-y-6">
            {/* Search */}
            <div className="max-w-md">
              <Input
                placeholder="Search jurisdictions..."
                value={jurisdictionSearch}
                onChange={(e) => setJurisdictionSearch(e.target.value)}
              />
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
              Showing {filteredJurisdictions.length} of {PILLAR2_JURISDICTIONS.length} jurisdictions
            </p>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Code</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead className="w-32 text-center">IIR</TableHead>
                    <TableHead className="w-32 text-center">UTPR</TableHead>
                    <TableHead className="w-32 text-center">QDMTT</TableHead>
                    <TableHead className="hidden lg:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJurisdictions.map((jurisdiction) => (
                    <TableRow key={jurisdiction.code}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {jurisdiction.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {jurisdiction.name}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge date={jurisdiction.iirDate} />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge date={jurisdiction.utprDate} />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge date={jurisdiction.qdmttDate} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {jurisdiction.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-0">
                  <Check className="h-3 w-3" />
                </Badge>
                <span>Implemented</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-800 border-0">
                  <Clock className="h-3 w-3" />
                </Badge>
                <span>Announced (future date)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-muted-foreground">
                  <X className="h-3 w-3" />
                </Badge>
                <span>Not applicable / No announcement</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
