'use client';

/**
 * Pillar 2 Guide Page
 *
 * Comprehensive guide to Pillar 2 / GloBE rules.
 * Dark theme with blue accents.
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
        <Badge variant="outline" className="text-slate-500 border-slate-700">
          <X className="h-3 w-3 mr-1" /> N/A
        </Badge>
      );
    }
    const dateObj = new Date(date);
    const now = new Date();
    if (dateObj <= now) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
          <Check className="h-3 w-3 mr-1" /> {date}
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-0">
        <Clock className="h-3 w-3 mr-1" /> {date}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <ResourcesBreadcrumb items={[{ label: 'Pillar 2 Guide' }]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
                Pillar 2 Guide
              </h1>
              <p className="text-slate-400">
                Global Minimum Tax and GloBE Rules Reference
              </p>
            </div>
          </div>
          <p className="text-slate-400 max-w-3xl">
            Comprehensive guide to the OECD&apos;s Pillar 2 framework for a global minimum
            tax of 15%. Learn about the GloBE rules, IIR, UTPR, QDMTT mechanisms, safe
            harbours, and track jurisdiction implementation status.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gradient">15%</div>
            <div className="text-sm text-slate-500">Minimum Tax Rate</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {stats.implemented}
            </div>
            <div className="text-sm text-slate-500">Active Jurisdictions</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {stats.withQdmtt}
            </div>
            <div className="text-sm text-slate-500">With QDMTT</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-violet-400">
              {PILLAR2_CONCEPTS.length}
            </div>
            <div className="text-sm text-slate-500">Key Concepts</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="concepts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-800/50">
            <TabsTrigger value="concepts" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">Key Concepts</TabsTrigger>
            <TabsTrigger value="jurisdictions" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">Jurisdictions</TabsTrigger>
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
                className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {/* Results count */}
            <p className="text-sm text-slate-500">
              Showing {filteredJurisdictions.length} of {PILLAR2_JURISDICTIONS.length} jurisdictions
            </p>

            {/* Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-900/50">
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="w-20 text-slate-400">Code</TableHead>
                    <TableHead className="text-slate-400">Jurisdiction</TableHead>
                    <TableHead className="w-32 text-center text-slate-400">IIR</TableHead>
                    <TableHead className="w-32 text-center text-slate-400">UTPR</TableHead>
                    <TableHead className="w-32 text-center text-slate-400">QDMTT</TableHead>
                    <TableHead className="hidden lg:table-cell text-slate-400">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJurisdictions.map((jurisdiction) => (
                    <TableRow key={jurisdiction.code} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell>
                        <Badge variant="outline" className="font-mono border-slate-700 text-slate-300">
                          {jurisdiction.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-200">
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
                      <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                        {jurisdiction.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                  <Check className="h-3 w-3" />
                </Badge>
                <span>Implemented</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-400 border-0">
                  <Clock className="h-3 w-3" />
                </Badge>
                <span>Announced (future date)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-slate-500 border-slate-700">
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
