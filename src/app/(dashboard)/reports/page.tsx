'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderOpen,
  Search,
  ArrowRight,
  Download,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
  Eye,
  AlertCircle,
  Loader2,
  Cloud,
  HardDrive,
} from 'lucide-react';

interface LocalReport {
  id: string;
  filename: string;
  uploadedAt: string;
  status: 'passed' | 'failed';
  isValid: boolean;
  summary?: {
    critical?: number;
    criticals?: number;
    errors?: number;
    warnings?: number;
    info?: number;
    infos?: number;
    total?: number;
  };
  fiscalYear?: string;
  upeJurisdiction?: string;
  source: 'convex' | 'local';
}

/**
 * Reports Page
 *
 * List of all validation reports with filtering and pagination.
 * Loads from both Convex (cloud) and sessionStorage (local).
 */
export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [localReportsState, setLocalReportsState] = useState<LocalReport[]>([]);
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const itemsPerPage = 10;

  // Load Convex reports
  const convexReports = useQuery(api.validationReports.list) ?? [];
  const deleteConvexReport = useMutation(api.validationReports.remove);

  // Load reports from sessionStorage
  useEffect(() => {
    try {
      const localReports: LocalReport[] = [];
      
      // Search sessionStorage for validation reports
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('validation-report-')) {
          try {
            const data = JSON.parse(sessionStorage.getItem(key) || '{}');
            // Skip if this is a Convex report (has convexId)
            if (data.id && !data.convexId) {
              localReports.push({
                id: data.id,
                filename: data.filename || 'Unknown',
                uploadedAt: data.uploadedAt || new Date().toISOString(),
                status: data.isValid ? 'passed' : 'failed',
                isValid: data.isValid,
                summary: data.summary,
                fiscalYear: data.fiscalYear,
                upeJurisdiction: data.upeJurisdiction,
                source: 'local',
              });
            }
          } catch {
            // Skip invalid entries
          }
        }
      }
      
      setLocalReportsState(localReports);
    } catch (e) {
      console.warn('Failed to load reports from sessionStorage:', e);
    } finally {
      setIsLocalLoading(false);
    }
  }, []);

  // Combine Convex and local reports
  const reports = useMemo(() => {
    const combined: LocalReport[] = [];
    
    // Add Convex reports
    for (const r of convexReports) {
      const validationResults = r.validationResults as { isValid?: boolean; summary?: LocalReport['summary'] } | undefined;
      combined.push({
        id: r._id,
        filename: r.fileName,
        uploadedAt: new Date(r._creationTime).toISOString(),
        status: (r.totalErrors === 0) ? 'passed' : 'failed',
        isValid: r.totalErrors === 0,
        summary: {
          critical: validationResults?.summary?.critical ?? 0,
          errors: r.totalErrors,
          warnings: r.totalWarnings,
          info: validationResults?.summary?.info ?? 0,
        },
        fiscalYear: r.reportingPeriod,
        upeJurisdiction: undefined, // Not stored directly
        source: 'convex',
      });
    }
    
    // Add local-only reports (those not in Convex)
    for (const local of localReportsState) {
      // Check if already in Convex by looking at sessionStorage
      const hasConvexVersion = convexReports.some(c => {
        const cached = sessionStorage.getItem(`validation-report-${c._id}`);
        if (cached) {
          const data = JSON.parse(cached);
          return data.localId === local.id;
        }
        return false;
      });
      
      if (!hasConvexVersion) {
        combined.push(local);
      }
    }
    
    // Sort by date (newest first)
    combined.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    
    return combined;
  }, [convexReports, localReportsState]);

  const isLoading = isLocalLoading;

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.filename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginate
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  /**
   * Delete a report (from Convex or sessionStorage)
   */
  const handleDelete = async (id: string, source: 'convex' | 'local') => {
    if (source === 'convex') {
      try {
        await deleteConvexReport({ id: id as any });
      } catch (e) {
        console.error('Failed to delete Convex report:', e);
      }
    }
    // Always remove from sessionStorage
    sessionStorage.removeItem(`validation-report-${id}`);
    setLocalReportsState((prev) => prev.filter((r) => r.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
        <p className="text-slate-400">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[{ label: 'Reports', icon: <FolderOpen className="h-4 w-4" /> }]}
      />

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-2">
            <FolderOpen className="h-7 w-7 text-blue-400" aria-hidden="true" />
            Validation Reports
          </h1>
          <p className="text-slate-400 mt-1">
            View and manage your CbC validation history.
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-600 hover:brightness-110 shadow-lg shadow-blue-500/20 text-white border-0">
          <Link href="/validate">
            <Upload className="mr-2 h-4 w-4" />
            New Validation
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {/* Status filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'passed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('passed')}
                className={statusFilter === 'passed' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Passed
              </Button>
              <Button
                variant={statusFilter === 'failed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('failed')}
                className={statusFilter === 'failed' ? 'bg-red-600 hover:bg-red-500 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Failed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports table */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-6">
                    File
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-6">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-6">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-6">
                    Issues
                  </th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {report.status === 'passed' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-slate-100 truncate max-w-[240px]">
                            {report.filename}
                          </p>
                          <p className="text-xs text-slate-500">
                            {report.upeJurisdiction || '-'} • FY {report.fiscalYear || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(report.uploadedAt)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            report.status === 'passed'
                              ? 'bg-emerald-500/20 text-emerald-400 border-0'
                              : 'bg-red-500/20 text-red-400 border-0'
                          }
                        >
                          {report.status === 'passed' ? 'Passed' : 'Failed'}
                        </Badge>
                        <span title={report.source === 'convex' ? 'Saved to cloud' : 'Local only'}>
                          {report.source === 'convex' ? (
                            <Cloud className="h-3.5 w-3.5 text-blue-400" />
                          ) : (
                            <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        {(report.summary?.critical ?? report.summary?.criticals) ? (
                          <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                            {report.summary?.critical ?? report.summary?.criticals}
                          </span>
                        ) : null}
                        {report.summary?.errors ? (
                          <span className="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded">
                            {report.summary.errors}
                          </span>
                        ) : null}
                        {report.summary?.warnings ? (
                          <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                            {report.summary.warnings}
                          </span>
                        ) : null}
                        {(report.summary?.info ?? report.summary?.infos) ? (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                            {report.summary?.info ?? report.summary?.infos}
                          </span>
                        ) : null}
                        {!(report.summary?.critical ?? report.summary?.criticals) && !report.summary?.errors && !report.summary?.warnings && !(report.summary?.info ?? report.summary?.infos) && (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-slate-100">
                          <Link href={`/reports/${report.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                            <DropdownMenuItem asChild className="text-slate-300 hover:text-slate-100 focus:bg-slate-800">
                              <Link href={`/reports/${report.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem 
                              className="text-red-400 hover:text-red-300 focus:bg-slate-800"
                              onClick={() => handleDelete(report.id, report.source)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-slate-800">
            {paginatedReports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {report.status === 'passed' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100 truncate">
                      {report.filename}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(report.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      report.status === 'passed'
                        ? 'bg-emerald-500/20 text-emerald-400 border-0'
                        : 'bg-red-500/20 text-red-400 border-0'
                    }
                  >
                    {report.status === 'passed' ? 'Valid' : 'Invalid'}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </div>
              </Link>
            ))}
          </div>

          {/* Empty state */}
          {paginatedReports.length === 0 && (
            <div className="text-center py-12 px-4">
              <FolderOpen className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-200 font-medium text-lg">No Reports Yet</p>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your validation reports will appear here. Upload a CbC XML file to generate your first report.'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button asChild className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:brightness-110 shadow-lg shadow-blue-500/20 text-white border-0">
                  <Link href="/validate">
                    <Upload className="mr-2 h-4 w-4" />
                    Validate New Report
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredReports.length)} of{' '}
            {filteredReports.length} reports
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
