'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ValidationSummary,
  CategoryTabs,
  QuickActions,
} from '@/components/validation';
import { ExecutiveSummary } from '@/components/reports/ExecutiveSummary';
import { ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { ValidationResult, ValidationReport, ValidationSummary as ValidationSummaryType } from '@/types/validation';
import {
  ArrowLeft,
  FileCheck2,
  RefreshCw,
  Calendar,
  Globe,
  Building2,
  Hash,
  Clock,
  Loader2,
  AlertCircle,
  Cloud,
} from 'lucide-react';

/**
 * Report Detail Page
 *
 * Full validation report view with results organized by category.
 */
export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isConvexReport, setIsConvexReport] = useState(false);

  // Try to fetch from Convex if this looks like a Convex ID
  const isConvexId = id && !id.startsWith('local-') && !id.includes('-');
  const convexReport = useQuery(
    api.validationReports.get,
    isConvexId ? { id: id as any } : 'skip'
  );

  /**
   * Download PDF report
   */
  const handleDownloadPdf = useCallback(async () => {
    if (!report) return;

    try {
      setIsDownloadingPdf(true);

      // For cached reports, we need to generate PDF client-side or use API
      // Try API first
      const response = await fetch(`/api/reports/${id}/pdf`);

      if (!response.ok) {
        // If API fails (e.g., report not in DB), generate simple text report
        const textContent = generateTextReport(report);
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cbcr-validation-${report.filename.replace('.xml', '')}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      // Download PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cbcr-validation-${report.filename.replace('.xml', '')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [id, report]);

  useEffect(() => {
    async function fetchReport() {
      try {
        setIsLoading(true);
        setError(null);

        // First check sessionStorage for recently validated report
        const cachedReport = sessionStorage.getItem(`validation-report-${id}`);
        if (cachedReport) {
          const parsed = JSON.parse(cachedReport);
          setReport(parsed);
          setIsConvexReport(!!parsed.convexId);
          setIsLoading(false);
          return;
        }

        // Check if this looks like an old Supabase ID (numeric or UUID format)
        // Convex IDs are base64-like strings that are longer
        const isLegacyId = /^[0-9]+$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        if (isLegacyId) {
          throw new Error(
            'This report was stored in the previous database (Supabase) which has been migrated. ' +
            'Please run a new validation to generate a fresh report.'
          );
        }

        // If we have a Convex ID but no cached data, wait for Convex query
        if (isConvexId && convexReport === undefined) {
          // Still loading from Convex
          return;
        }

        if (isConvexId && convexReport) {
          // Transform Convex data to ValidationReport format
          const validationResults = convexReport.validationResults as any;
          const transformedReport: ValidationReport = {
            id: convexReport._id,
            filename: convexReport.fileName,
            uploadedAt: new Date(convexReport._creationTime).toISOString(),
            completedAt: new Date(convexReport._creationTime).toISOString(),
            status: 'completed',
            isValid: convexReport.totalErrors === 0,
            fiscalYear: convexReport.reportingPeriod,
            upeJurisdiction: validationResults?.metadata?.upeJurisdiction,
            upeName: convexReport.reportingEntity || validationResults?.metadata?.upeName,
            messageRefId: validationResults?.metadata?.messageRefId,
            jurisdictionCount: convexReport.jurisdictionCount,
            entityCount: validationResults?.metadata?.entityCount,
            durationMs: validationResults?.durationMs,
            summary: validationResults?.summary || {
              critical: 0,
              errors: convexReport.totalErrors,
              warnings: convexReport.totalWarnings,
              info: 0,
              passed: 0,
              total: convexReport.totalErrors + convexReport.totalWarnings,
            },
            byCategory: validationResults?.byCategory || {},
            results: validationResults?.results || [],
          };
          setReport(transformedReport);
          setIsConvexReport(true);
          setIsLoading(false);
          return;
        }

        // If Convex returned null, report not found
        if (isConvexId && convexReport === null) {
          throw new Error('Report not found. It may have been deleted.');
        }

        // For local IDs, the data should be in sessionStorage
        throw new Error(
          'Report not found in cache. Please validate again to generate a new report.'
        );
      } catch (err) {
        console.error('Failed to fetch report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
        setIsLoading(false);
      }
    }

    fetchReport();
  }, [id, isConvexId, convexReport]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-muted-foreground">Loading validation report...</p>
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Failed to Load Report</h2>
        <p className="text-muted-foreground">{error || 'Report not found'}</p>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a365d] flex items-center gap-2">
            <FileCheck2 className="h-7 w-7" />
            Validation Report
          </h1>
          <p className="text-slate-600 mt-1 truncate max-w-xl flex items-center gap-2" title={report.filename}>
            {report.filename}
            {isConvexReport && (
              <span className="flex items-center gap-1 text-xs text-blue-500">
                <Cloud className="h-3 w-3" />
                Saved
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/validate?revalidate=${id}`}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-validate
            </Link>
          </Button>
        </div>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Fiscal Year
            </div>
            <p className="text-lg font-semibold text-[#1a365d]">
              {report.fiscalYear}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Globe className="h-4 w-4" />
              UPE Jurisdiction
            </div>
            <p className="text-lg font-semibold text-[#1a365d]">
              {report.upeJurisdiction}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Building2 className="h-4 w-4" />
              Entities
            </div>
            <p className="text-lg font-semibold text-[#1a365d]">
              {report.entityCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Hash className="h-4 w-4" />
              Jurisdictions
            </div>
            <p className="text-lg font-semibold text-[#1a365d]">
              {report.jurisdictionCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary and quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ValidationSummary
            summary={report.summary}
            isValid={report.isValid}
            metadata={{
              filename: report.filename,
              fiscalYear: report.fiscalYear,
              upeJurisdiction: report.upeJurisdiction,
              upeName: report.upeName,
              jurisdictionCount: report.jurisdictionCount,
              entityCount: report.entityCount,
            }}
            byCategory={report.byCategory as Record<string, number>}
            durationMs={report.durationMs}
          />
        </div>
        <div className="space-y-4">
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions
                report={report}
                onNewValidation={() => window.location.href = '/validate'}
                compact
              />
            </CardContent>
          </Card>

          {/* Report info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">MessageRefId</span>
                <code className="text-xs bg-slate-100 px-2 py-1 rounded truncate max-w-[180px]" title={report.messageRefId}>
                  {report.messageRefId}
                </code>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Uploaded</span>
                <span className="text-slate-700">{formatDate(report.uploadedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Completed</span>
                <span className="text-slate-700">{formatDate(report.completedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Duration</span>
                <span className="text-slate-700">
                  {report.durationMs ? `${(report.durationMs / 1000).toFixed(2)}s` : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Executive Summary with PDF Download */}
      <ExecutiveSummary
        report={report}
        onDownloadPdf={handleDownloadPdf}
        isDownloading={isDownloadingPdf}
      />

      {/* Results by category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#1a365d]">
            Detailed Validation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryTabs results={report.results} />
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a text report for fallback when PDF API is unavailable
 */
function generateTextReport(report: ValidationReport): string {
  const lines: string[] = [];
  const divider = '='.repeat(80);
  const subDivider = '-'.repeat(80);

  // Header
  lines.push(divider);
  lines.push('PW-(CbCR) ANALYZER - VALIDATION REPORT');
  lines.push(divider);
  lines.push('');

  // File Info
  lines.push('FILE INFORMATION');
  lines.push(subDivider);
  lines.push(`File Name: ${report.filename}`);
  lines.push(`Fiscal Year: ${report.fiscalYear || 'N/A'}`);
  lines.push(`UPE Jurisdiction: ${report.upeJurisdiction || 'N/A'}`);
  lines.push(`UPE Name: ${report.upeName || 'N/A'}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');

  // Overall Status
  lines.push('VALIDATION STATUS');
  lines.push(subDivider);
  lines.push(`Status: ${report.isValid ? 'PASSED' : 'FAILED'}`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push(subDivider);
  lines.push(`Critical Issues: ${report.summary.critical}`);
  lines.push(`Errors: ${report.summary.errors}`);
  lines.push(`Warnings: ${report.summary.warnings}`);
  lines.push(`Informational: ${report.summary.info}`);
  lines.push(`Total Checks: ${report.summary.total}`);
  lines.push(`Passed: ${report.summary.passed}`);
  const score = report.summary.total > 0
    ? Math.round((report.summary.passed / report.summary.total) * 100)
    : 100;
  lines.push(`Compliance Score: ${score}%`);
  lines.push('');

  // Overall Assessment
  lines.push('ASSESSMENT');
  lines.push(subDivider);
  if (report.isValid && report.summary.critical === 0 && report.summary.errors === 0) {
    lines.push('Your CbC report has passed validation. The report appears to be compliant');
    lines.push('with OECD CbC-Schema v2.0 requirements and is ready for submission.');
  } else if (report.summary.critical > 0) {
    lines.push('Your CbC report has CRITICAL issues that will cause rejection by tax');
    lines.push('authorities. These must be corrected before submission.');
  } else {
    lines.push('Your CbC report has issues that should be reviewed before submission.');
  }
  lines.push('');

  // Detailed Results
  if (report.results.length > 0) {
    lines.push('DETAILED FINDINGS');
    lines.push(subDivider);

    // Group by severity
    const bySeverity: Record<string, ValidationResult[]> = {};
    for (const result of report.results) {
      if (!bySeverity[result.severity]) {
        bySeverity[result.severity] = [];
      }
      bySeverity[result.severity].push(result);
    }

    const severityOrder = ['critical', 'error', 'warning', 'info'];
    for (const severity of severityOrder) {
      const results = bySeverity[severity];
      if (results && results.length > 0) {
        lines.push('');
        lines.push(`[${severity.toUpperCase()}] - ${results.length} issue(s)`);
        lines.push('');
        for (const result of results) {
          lines.push(`  Rule: ${result.ruleId}`);
          lines.push(`  Message: ${result.message}`);
          if (result.xpath) {
            lines.push(`  Location: ${result.xpath}`);
          }
          if (result.suggestion) {
            lines.push(`  Suggestion: ${result.suggestion}`);
          }
          lines.push('');
        }
      }
    }
  }

  // Disclaimer
  lines.push(divider);
  lines.push('DISCLAIMER');
  lines.push(subDivider);
  lines.push('This validation report is provided for informational purposes only and');
  lines.push('does not constitute legal or tax advice. Always consult with qualified');
  lines.push('tax professionals before filing Country-by-Country Reports.');
  lines.push('');
  lines.push(divider);
  lines.push('Generated by PW-(CbCR) Analyzer');
  lines.push(divider);

  return lines.join('\n');
}


