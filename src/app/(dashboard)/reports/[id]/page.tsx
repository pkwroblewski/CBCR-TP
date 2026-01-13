'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useAction, useMutation } from 'convex/react';
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
import { AiInsightsPanel } from '@/components/ai';
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
  Sparkles,
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

  // AI state management
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatingFindingId, setGeneratingFindingId] = useState<string | null>(null);

  // Convex actions for AI
  const generateExplanation = useAction(api.actions.generateAiExplanation.generateExplanation);
  const generateBatchExplanations = useAction(api.actions.generateAiExplanation.generateBatchExplanations);
  const generateExecutiveSummary = useAction(api.actions.generateSummary.generateExecutiveSummary);
  const trackAiUsage = useMutation(api.aiUsage.trackUsage);

  // Try to fetch from Convex if this looks like a Convex ID
  // Convex IDs are base64-like strings without hyphens
  const isConvexId = id && !id.startsWith('local-') && !id.includes('-');
  // Use getById which doesn't require auth (having the ID is authorization)
  const convexReport = useQuery(
    api.validationReports.getById,
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

  /**
   * Generate AI explanation for a single finding
   */
  const handleGenerateSingleExplanation = useCallback(async (findingId: string, finding: ValidationResult) => {
    if (!report) return;

    console.log('[AI] Starting single explanation for:', findingId);

    try {
      setGeneratingFindingId(findingId);
      setAiError(null);

      const result = await generateExplanation({
        finding: {
          ruleCode: finding.ruleId,
          title: finding.ruleId,
          description: finding.message,
          severity: finding.severity,
          affectedField: finding.xpath,
        },
        context: {
          reportingEntity: report.upeName,
          jurisdiction: report.upeJurisdiction,
        },
      });

      console.log('[AI] Result received:', {
        hasError: !!result.error,
        explanationLength: result.explanation?.length,
        tokens: { input: result.inputTokens, output: result.outputTokens }
      });

      if (result.error) {
        console.error('[AI] Error from action:', result.error);
        setAiError(result.error);
      } else {
        setAiExplanations(prev => ({
          ...prev,
          [findingId]: result.explanation,
        }));

        // Track usage
        try {
          await trackAiUsage({
            userId: 'anonymous', // Will be replaced with actual user ID
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            operation: 'finding_explanation',
          });
        } catch (e) {
          console.warn('Failed to track AI usage:', e);
        }
      }
    } catch (err) {
      console.error('[AI] Failed to generate AI explanation:', err);
      setAiError(err instanceof Error ? err.message : 'Failed to generate explanation');
    } finally {
      setGeneratingFindingId(null);
    }
  }, [report, generateExplanation, trackAiUsage]);

  /**
   * Generate AI explanations for all findings
   */
  const handleGenerateAllExplanations = useCallback(async () => {
    if (!report || report.results.length === 0) return;

    console.log('[AI] Starting batch explanation generation');

    try {
      setIsGeneratingAi(true);
      setAiProgress(0);
      setAiError(null);

      // Prepare findings that don't have explanations yet
      const findingsToExplain = report.results
        .map((r, i) => ({
          id: `${r.ruleId}-${i}`,
          ruleCode: r.ruleId,
          title: r.ruleId,
          description: r.message,
          severity: r.severity,
          affectedField: r.xpath,
        }))
        .filter(f => !aiExplanations[f.id]);

      console.log('[AI] Findings to explain:', findingsToExplain.length);

      if (findingsToExplain.length === 0) {
        setIsGeneratingAi(false);
        return;
      }

      const result = await generateBatchExplanations({
        findings: findingsToExplain,
        context: {
          reportingEntity: report.upeName,
          jurisdiction: report.upeJurisdiction,
        },
        maxConcurrent: 3,
      });

      console.log('[AI] Batch result:', {
        explanationsCount: result.explanations.length,
        totalInputTokens: result.totalInputTokens,
        totalOutputTokens: result.totalOutputTokens,
        errors: result.explanations.filter(e => e.error).length,
      });

      // Update explanations
      const newExplanations: Record<string, string> = { ...aiExplanations };
      for (const exp of result.explanations) {
        if (!exp.error) {
          newExplanations[exp.id] = exp.explanation;
        }
      }
      setAiExplanations(newExplanations);
      setAiProgress(100);

      // Track total usage
      try {
        await trackAiUsage({
          userId: 'anonymous',
          inputTokens: result.totalInputTokens,
          outputTokens: result.totalOutputTokens,
          operation: 'finding_explanation',
        });
      } catch (e) {
        console.warn('Failed to track AI usage:', e);
      }
    } catch (err) {
      console.error('[AI] Failed to generate AI explanations:', err);
      setAiError(err instanceof Error ? err.message : 'Failed to generate explanations');
    } finally {
      setIsGeneratingAi(false);
    }
  }, [report, aiExplanations, generateBatchExplanations, trackAiUsage]);

  /**
   * Generate AI executive summary
   */
  const handleGenerateSummary = useCallback(async () => {
    if (!report) return;

    console.log('[AI] Starting executive summary generation');

    try {
      setIsGeneratingAi(true);
      setAiError(null);

      const findings = report.results.map((r, i) => ({
        severity: r.severity,
        title: r.ruleId,
        category: r.category,
        aiExplanation: aiExplanations[`${r.ruleId}-${i}`],
      }));

      console.log('[AI] Sending findings for summary:', findings.length);

      const result = await generateExecutiveSummary({
        findings,
        metadata: {
          reportingEntity: report.upeName,
          jurisdictionCount: report.jurisdictionCount,
          fiscalYear: report.fiscalYear,
          fileName: report.filename,
        },
      });

      console.log('[AI] Summary result:', {
        hasError: !!result.error,
        summaryLength: result.summary?.length,
        tokens: { input: result.inputTokens, output: result.outputTokens }
      });

      if (result.error) {
        console.error('[AI] Summary error:', result.error);
        setAiError(result.error);
      } else {
        setAiSummary(result.summary);

        // Track usage
        try {
          await trackAiUsage({
            userId: 'anonymous',
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            operation: 'executive_summary',
          });
        } catch (e) {
          console.warn('Failed to track AI usage:', e);
        }
      }
    } catch (err) {
      console.error('[AI] Failed to generate AI summary:', err);
      setAiError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsGeneratingAi(false);
    }
  }, [report, aiExplanations, generateExecutiveSummary, trackAiUsage]);

  useEffect(() => {
    async function fetchReport() {
      try {
        setIsLoading(true);
        setError(null);

        // First check sessionStorage for recently validated report (try exact ID)
        let cachedReport = sessionStorage.getItem(`validation-report-${id}`);

        // If not found by exact ID, search sessionStorage for matching convexId or localId
        if (!cachedReport) {
          cachedReport = findCachedReportById(id);
        }

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
          throw new Error('Report not found. It may have been deleted or you may not have access.');
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
    <div className="space-y-4 overflow-x-hidden">
      {/* Header - More compact */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-blue-400" />
              {report.filename}
              {isConvexReport && (
                <span className="flex items-center gap-1 text-xs text-blue-400 font-normal">
                  <Cloud className="h-3 w-3" />
                </span>
              )}
            </h1>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/validate?revalidate=${id}`}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-validate
          </Link>
        </Button>
      </div>

      {/* Compact metadata row - Responsive grid on mobile */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-3 md:gap-4 px-4 py-3 bg-slate-900/50 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <span className="text-sm text-slate-400">FY:</span>
          <span className="text-sm font-medium text-slate-200">{report.fiscalYear}</span>
        </div>
        <div className="hidden md:block w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <span className="text-sm text-slate-400">UPE:</span>
          <span className="text-sm font-medium text-slate-200 truncate">{report.upeJurisdiction}</span>
        </div>
        <div className="hidden md:block w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-200">{report.entityCount}</span>
          <span className="text-sm text-slate-400">entities</span>
        </div>
        <div className="hidden md:block w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-200">{report.jurisdictionCount}</span>
          <span className="text-sm text-slate-400">jurisdictions</span>
        </div>
      </div>

      {/* Summary and quick actions - More compact grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
        <div className="space-y-3">
          {/* AI Insights Panel */}
          <AiInsightsPanel
            totalFindings={report.results.length}
            findingsWithAi={Object.keys(aiExplanations).length}
            isGenerating={isGeneratingAi}
            progress={aiProgress}
            estimatedCost={report.results.length * 0.002} // ~$0.002 per finding estimate
            onGenerateAll={handleGenerateAllExplanations}
            onGenerateSummary={handleGenerateSummary}
            error={aiError || undefined}
          />

          {/* Quick actions */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100">Quick Actions</CardTitle>
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
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100">Report Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">MessageRefId</span>
                <code className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded truncate max-w-[180px]" title={report.messageRefId}>
                  {report.messageRefId}
                </code>
              </div>
              <Separator className="bg-slate-700" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Uploaded</span>
                <span className="text-slate-300">{formatDate(report.uploadedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Completed</span>
                <span className="text-slate-300">{formatDate(report.completedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Duration</span>
                <span className="text-slate-300">
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

      {/* AI Executive Summary (if generated) */}
      {aiSummary && (
        <Card className="bg-gradient-to-br from-purple-500/10 via-slate-900/50 to-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              AI Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
            <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Generated by Claude AI - Review before sharing
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results by category - Main content area */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-100">Validation Results</h2>
        <CategoryTabs
          results={report.results}
          aiExplanations={aiExplanations}
          generatingFindingId={generatingFindingId}
          onRequestAiExplanation={handleGenerateSingleExplanation}
        />
      </div>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Search sessionStorage for a cached report by ID
 * Matches against convexId, localId, or id field
 */
function findCachedReportById(id: string): string | null {
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key?.startsWith('validation-report-')) continue;

    try {
      const data = JSON.parse(sessionStorage.getItem(key) || '{}');
      if (data.convexId === id || data.localId === id || data.id === id) {
        return JSON.stringify(data);
      }
    } catch {
      // Skip invalid entries
    }
  }
  return null;
}

/**
 * Group validation results by rule ID for summary display
 */
interface GroupedResultForReport {
  ruleId: string;
  severity: string;
  count: number;
  message: string;
  suggestion?: string;
  sampleXpaths: string[];
}

function groupResultsForReport(results: ValidationResult[]): GroupedResultForReport[] {
  const groups = new Map<string, GroupedResultForReport>();

  for (const result of results) {
    const key = result.ruleId;

    if (!groups.has(key)) {
      groups.set(key, {
        ruleId: result.ruleId,
        severity: result.severity,
        count: 0,
        message: result.message,
        suggestion: result.suggestion,
        sampleXpaths: [],
      });
    }

    const group = groups.get(key)!;
    group.count++;

    // Store up to 3 sample xpaths
    if (result.xpath && group.sampleXpaths.length < 3) {
      group.sampleXpaths.push(result.xpath);
    }
  }

  // Sort by severity, then by count (descending)
  const severityOrder: Record<string, number> = { critical: 0, error: 1, warning: 2, info: 3 };
  return Array.from(groups.values()).sort((a, b) => {
    const severityDiff = (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });
}

/**
 * Generate a text report for fallback when PDF API is unavailable
 * Now uses grouped results for better readability
 */
function generateTextReport(report: ValidationReport): string {
  const lines: string[] = [];
  const divider = '='.repeat(80);
  const subDivider = '-'.repeat(80);

  // Header
  lines.push(divider);
  lines.push('CbCR ANALYZER - VALIDATION REPORT');
  lines.push(divider);
  lines.push('');

  // File Info
  lines.push('FILE INFORMATION');
  lines.push(subDivider);
  lines.push(`File Name: ${report.filename}`);
  lines.push(`Fiscal Year: ${report.fiscalYear || 'N/A'}`);
  lines.push(`UPE Jurisdiction: ${report.upeJurisdiction || 'N/A'}`);
  lines.push(`UPE Name: ${report.upeName || 'N/A'}`);
  lines.push(`Jurisdictions: ${report.jurisdictionCount || 'N/A'}`);
  lines.push(`Entities: ${report.entityCount || 'N/A'}`);
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
  lines.push(`Total Issues: ${report.results.length}`);
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

  // Grouped Results - Executive Summary
  if (report.results.length > 0) {
    const groupedResults = groupResultsForReport(report.results);
    const uniqueRules = groupedResults.length;

    lines.push(divider);
    lines.push('ISSUES SUMMARY (GROUPED BY RULE)');
    lines.push(divider);
    lines.push('');
    lines.push(`Found ${report.results.length} total issues across ${uniqueRules} unique validation rules.`);
    lines.push('Issues are grouped by rule ID to make review easier.');
    lines.push('');

    // Group by severity for the summary
    const bySeverity: Record<string, GroupedResultForReport[]> = {};
    for (const group of groupedResults) {
      if (!bySeverity[group.severity]) {
        bySeverity[group.severity] = [];
      }
      bySeverity[group.severity].push(group);
    }

    const severityOrder = ['critical', 'error', 'warning', 'info'];
    const severityLabels: Record<string, string> = {
      critical: 'CRITICAL - Must Fix Before Submission',
      error: 'ERRORS - Should Be Addressed',
      warning: 'WARNINGS - Review Recommended',
      info: 'INFO - For Your Information',
    };

    for (const severity of severityOrder) {
      const groups = bySeverity[severity];
      if (groups && groups.length > 0) {
        const totalCount = groups.reduce((sum, g) => sum + g.count, 0);

        lines.push('');
        lines.push(subDivider);
        lines.push(`[${severityLabels[severity]}]`);
        lines.push(`${totalCount} issue(s) across ${groups.length} rule(s)`);
        lines.push(subDivider);
        lines.push('');

        for (const group of groups) {
          lines.push(`  ${group.ruleId} (${group.count} occurrence${group.count > 1 ? 's' : ''})`);
          lines.push(`  ${'-'.repeat(60)}`);

          // Show a generic version of the message for grouped items
          let displayMessage = group.message;
          if (group.count > 1) {
            // Try to make the message more generic if it's entity-specific
            displayMessage = displayMessage
              .replace(/Entity ['"][^'"]+['"]:/i, 'Multiple entities:')
              .replace(/^([A-Z]{2}):/, 'Multiple jurisdictions:');
          }
          lines.push(`  Issue: ${displayMessage}`);

          if (group.suggestion) {
            lines.push(`  Suggestion: ${group.suggestion}`);
          }

          if (group.sampleXpaths.length > 0) {
            lines.push(`  Sample locations:`);
            for (const xpath of group.sampleXpaths) {
              lines.push(`    - ${xpath}`);
            }
            if (group.count > group.sampleXpaths.length) {
              lines.push(`    ... and ${group.count - group.sampleXpaths.length} more occurrence(s)`);
            }
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
  lines.push('Generated by CbCR Analyzer');
  lines.push(divider);

  return lines.join('\n');
}


