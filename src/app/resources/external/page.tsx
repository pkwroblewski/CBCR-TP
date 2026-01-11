'use client';

/**
 * External Resources Page
 *
 * Links to OECD documents, government portals, and technical resources.
 * Dark theme with blue accents.
 *
 * @module app/resources/external/page
 */

import { useState, useMemo } from 'react';
import { ExternalLink as ExternalLinkIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourcesBreadcrumb } from '@/components/resources/ResourcesBreadcrumb';
import { ExternalLinkCard } from '@/components/resources/ExternalLinkCard';
import {
  ALL_EXTERNAL_RESOURCES,
  OECD_DOCUMENTS,
  EU_GOVERNMENT_PORTALS,
  MAJOR_ECONOMY_PORTALS,
  TECHNICAL_RESOURCES,
  type ResourceCategory,
} from '@/constants/external-resources';

const CATEGORY_OPTIONS: { value: ResourceCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'oecd', label: 'OECD Documents' },
  { value: 'government', label: 'Government Portals' },
  { value: 'tax-authority', label: 'Tax Authorities' },
  { value: 'tool', label: 'Tools' },
  { value: 'guidance', label: 'Guidance' },
];

export default function ExternalResourcesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredResources = useMemo(() => {
    return ALL_EXTERNAL_RESOURCES.filter((resource) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description.toLowerCase().includes(searchLower) ||
        resource.jurisdiction?.toLowerCase().includes(searchLower) ||
        resource.tags.some((t) => t.toLowerCase().includes(searchLower));

      // Category filter
      const matchesCategory =
        categoryFilter === 'all' || resource.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  const stats = {
    oecd: OECD_DOCUMENTS.length,
    eu: EU_GOVERNMENT_PORTALS.length,
    major: MAJOR_ECONOMY_PORTALS.length,
    technical: TECHNICAL_RESOURCES.length,
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <ResourcesBreadcrumb items={[{ label: 'External Resources' }]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <ExternalLinkIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
                External Resources
              </h1>
              <p className="text-slate-400">
                {ALL_EXTERNAL_RESOURCES.length} curated resources
              </p>
            </div>
          </div>
          <p className="text-slate-400 max-w-3xl">
            Curated collection of external resources including OECD documents and
            guidelines, government portals, tax authority filing systems, and
            technical specifications. All links open in a new tab.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.oecd}</div>
            <div className="text-sm text-slate-500">OECD Documents</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.eu}</div>
            <div className="text-sm text-slate-500">EU Portals</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-violet-400">{stats.major}</div>
            <div className="text-sm text-slate-500">Major Economies</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.technical}</div>
            <div className="text-sm text-slate-500">Technical Specs</div>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-slate-800/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">All Resources</TabsTrigger>
            <TabsTrigger value="oecd" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">OECD</TabsTrigger>
            <TabsTrigger value="portals" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">Portals</TabsTrigger>
            <TabsTrigger value="technical" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">Technical</TabsTrigger>
          </TabsList>

          {/* All Resources Tab */}
          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search resources..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-slate-900/50 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <p className="text-sm text-slate-500">
              Showing {filteredResources.length} of {ALL_EXTERNAL_RESOURCES.length} resources
            </p>

            {/* Resource Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <ExternalLinkCard key={resource.id} resource={resource} />
              ))}
            </div>

            {filteredResources.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No resources found matching your criteria.
              </div>
            )}
          </TabsContent>

          {/* OECD Tab */}
          <TabsContent value="oecd" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OECD_DOCUMENTS.map((resource) => (
                <ExternalLinkCard key={resource.id} resource={resource} />
              ))}
            </div>
          </TabsContent>

          {/* Portals Tab */}
          <TabsContent value="portals" className="space-y-8">
            {/* EU Portals */}
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">European Union</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {EU_GOVERNMENT_PORTALS.map((resource) => (
                  <ExternalLinkCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>

            {/* Major Economy Portals */}
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Major Economies</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MAJOR_ECONOMY_PORTALS.map((resource) => (
                  <ExternalLinkCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TECHNICAL_RESOURCES.map((resource) => (
                <ExternalLinkCard key={resource.id} resource={resource} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
