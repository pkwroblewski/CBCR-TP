'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Filter,
  Calendar,
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
} from 'lucide-react';

/**
 * Reports Page
 *
 * List of all validation reports with filtering and pagination.
 */
export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // TODO: Fetch from Supabase
  const allReports = [
    {
      id: '1',
      filename: 'CbCR_2023_Q4_Final.xml',
      uploadedAt: '2024-01-15T14:30:00Z',
      status: 'passed',
      score: 95,
      fiscalYear: '2023',
      jurisdiction: 'LU',
      issues: { critical: 0, errors: 1, warnings: 3, info: 5 },
    },
    {
      id: '2',
      filename: 'CbCR_2023_Amendment.xml',
      uploadedAt: '2024-01-12T10:15:00Z',
      status: 'failed',
      score: 62,
      fiscalYear: '2023',
      jurisdiction: 'LU',
      issues: { critical: 2, errors: 5, warnings: 8, info: 2 },
    },
    {
      id: '3',
      filename: 'CbCR_2022_Correction.xml',
      uploadedAt: '2024-01-10T09:00:00Z',
      status: 'passed',
      score: 100,
      fiscalYear: '2022',
      jurisdiction: 'DE',
      issues: { critical: 0, errors: 0, warnings: 0, info: 3 },
    },
    {
      id: '4',
      filename: 'CbCR_Test_File.xml',
      uploadedAt: '2024-01-08T16:45:00Z',
      status: 'passed',
      score: 88,
      fiscalYear: '2023',
      jurisdiction: 'FR',
      issues: { critical: 0, errors: 2, warnings: 5, info: 1 },
    },
    {
      id: '5',
      filename: 'CbCR_2023_Q3.xml',
      uploadedAt: '2024-01-05T11:20:00Z',
      status: 'failed',
      score: 45,
      fiscalYear: '2023',
      jurisdiction: 'LU',
      issues: { critical: 5, errors: 10, warnings: 3, info: 2 },
    },
    {
      id: '6',
      filename: 'CbCR_2023_Q2.xml',
      uploadedAt: '2024-01-03T08:30:00Z',
      status: 'passed',
      score: 92,
      fiscalYear: '2023',
      jurisdiction: 'NL',
      issues: { critical: 0, errors: 1, warnings: 4, info: 6 },
    },
    {
      id: '7',
      filename: 'CbCR_Initial_Draft.xml',
      uploadedAt: '2024-01-02T14:00:00Z',
      status: 'failed',
      score: 35,
      fiscalYear: '2023',
      jurisdiction: 'LU',
      issues: { critical: 8, errors: 15, warnings: 10, info: 5 },
    },
  ];

  // Filter reports
  const filteredReports = allReports.filter((report) => {
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[{ label: 'Reports', icon: <FolderOpen className="h-4 w-4" /> }]}
      />

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--brand-primary)] flex items-center gap-2">
            <FolderOpen className="h-7 w-7" aria-hidden="true" />
            Validation Reports
          </h1>
          <p className="text-slate-600 mt-1">
            View and manage your CbC validation history.
          </p>
        </div>
        <Button asChild className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]">
          <Link href="/validate">
            <Upload className="mr-2 h-4 w-4" />
            New Validation
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-[var(--brand-primary)]' : ''}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'passed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('passed')}
                className={statusFilter === 'passed' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Passed
              </Button>
              <Button
                variant={statusFilter === 'failed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('failed')}
                className={statusFilter === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Failed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports table */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">
                    File
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">
                    Score
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">
                    Issues
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {report.status === 'passed' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-slate-900 truncate max-w-[240px]">
                            {report.filename}
                          </p>
                          <p className="text-xs text-slate-500">
                            {report.jurisdiction} • FY{report.fiscalYear}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(report.uploadedAt)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={report.status === 'passed' ? 'default' : 'destructive'}
                        className={
                          report.status === 'passed'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            : ''
                        }
                      >
                        {report.status === 'passed' ? 'Passed' : 'Failed'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-lg font-semibold text-slate-900">
                        {report.score}%
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        {report.issues.critical > 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                            {report.issues.critical}
                          </span>
                        )}
                        {report.issues.errors > 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                            {report.issues.errors}
                          </span>
                        )}
                        {report.issues.warnings > 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                            {report.issues.warnings}
                          </span>
                        )}
                        {report.issues.info > 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {report.issues.info}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/reports/${report.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/reports/${report.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
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
          <div className="md:hidden divide-y">
            {paginatedReports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {report.status === 'passed' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {report.filename}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(report.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={report.status === 'passed' ? 'default' : 'destructive'}
                    className={
                      report.status === 'passed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : ''
                    }
                  >
                    {report.score}%
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>

          {/* Empty state */}
          {paginatedReports.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No reports found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Upload your first CbC report to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button asChild className="mt-4 bg-[var(--brand-primary)]">
                  <Link href="/validate">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Report
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
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? 'bg-[var(--brand-primary)]' : ''}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

