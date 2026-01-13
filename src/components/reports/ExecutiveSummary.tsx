'use client';

/**
 * Executive Summary Component
 *
 * Human-readable summary of validation results with recommendations.
 * Collapsible by default to save screen space.
 *
 * @module components/reports/ExecutiveSummary
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ClipboardList,
  TrendingUp,
  Shield,
  FileWarning,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ValidationReport, ValidationResult, ValidationSummary } from '@/types/validation';
import { ValidationCategory, ValidationSeverity } from '@/types/validation';

// =============================================================================
// TYPES
// =============================================================================

interface ExecutiveSummaryProps {
  report: ValidationReport;
  onDownloadPdf?: () => void;
  isDownloading?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate overall assessment based on validation results
 */
function generateOverallAssessment(summary: ValidationSummary, isValid: boolean): string {
  if (isValid && summary.critical === 0 && summary.errors === 0 && summary.warnings === 0) {
    return "Excellent! Your CbC report has passed all validation checks without any issues. The report appears to be fully compliant with OECD CbC-Schema v2.0 requirements and is ready for submission to the Luxembourg tax authorities.";
  }

  if (isValid && summary.critical === 0 && summary.errors === 0) {
    return `Your CbC report has passed validation with ${summary.warnings} warning(s) and ${summary.info} informational note(s). While the report meets the minimum requirements for submission, we recommend reviewing the warnings to ensure data quality and avoid potential follow-up inquiries from tax authorities.`;
  }

  if (summary.critical === 0 && summary.errors > 0) {
    return `Your CbC report has ${summary.errors} error(s) that should be addressed before submission. While these may not cause immediate rejection, they could trigger processing issues or follow-up inquiries from tax authorities. We strongly recommend correcting these issues.`;
  }

  if (summary.critical > 0) {
    return `Your CbC report has ${summary.critical} critical issue(s) that will cause rejection by tax authorities. These must be corrected before the report can be submitted. Please review the critical findings below and make the necessary corrections to your XML file.`;
  }

  return "Your CbC report has been analyzed. Please review the findings below.";
}

/**
 * Generate category-specific commentary
 */
function generateCategoryCommentary(
  category: string,
  results: ValidationResult[]
): string | null {
  if (results.length === 0) return null;

  const criticalCount = results.filter(r => r.severity === 'critical').length;
  const errorCount = results.filter(r => r.severity === 'error').length;
  const warningCount = results.filter(r => r.severity === 'warning').length;

  switch (category) {
    case ValidationCategory.XML_WELLFORMEDNESS:
      if (criticalCount > 0) {
        return "The XML file has structural problems that prevent proper parsing. This typically indicates malformed XML syntax, encoding issues, or invalid characters. The file must be corrected before it can be validated or submitted.";
      }
      return null;

    case ValidationCategory.SCHEMA_COMPLIANCE:
      if (criticalCount > 0 || errorCount > 0) {
        return "The report does not fully comply with the OECD CbC-Schema v2.0 specification. This may include missing required elements, invalid element values, or incorrect data formats. These issues must be resolved for the report to be accepted.";
      }
      return null;

    case ValidationCategory.BUSINESS_RULES:
      if (criticalCount > 0 || errorCount > 0) {
        return "Business rule violations were detected, such as duplicate document references, inconsistent message indicators, or invalid reference IDs. These issues affect the logical integrity of the report and must be corrected.";
      }
      if (warningCount > 0) {
        return "Some business rule recommendations were identified. While not blocking, addressing these will improve report quality and reduce the likelihood of queries from tax authorities.";
      }
      return null;

    case ValidationCategory.COUNTRY_RULES:
      if (criticalCount > 0 || errorCount > 0) {
        return "Luxembourg-specific validation rules have identified issues with TIN formats, filing deadlines, or local regulatory requirements. These must be corrected to ensure acceptance by the Administration des Contributions Directes (ACD).";
      }
      if (warningCount > 0) {
        return "Some Luxembourg-specific recommendations were identified. Reviewing these will help ensure smooth processing by the ACD.";
      }
      return null;

    case ValidationCategory.DATA_QUALITY:
      if (warningCount > 0 || errorCount > 0) {
        return "Data quality checks have identified potential inconsistencies or anomalies in your financial data. These include revenue mismatches, unusual tax ratios, or questionable employee counts. While not always errors, these may trigger additional scrutiny.";
      }
      return null;

    case ValidationCategory.PILLAR2_READINESS:
      return "Pillar 2 (Global Minimum Tax) analysis has been performed. This section identifies jurisdictions that may qualify for Safe Harbour provisions and estimates potential top-up tax exposure. Note: This is for informational purposes only.";

    default:
      return null;
  }
}

/**
 * Generate action items based on severity
 */
function generateActionItems(summary: ValidationSummary): string[] {
  const items: string[] = [];

  if (summary.critical > 0) {
    items.push("URGENT: Correct all critical issues immediately - these will cause rejection");
  }

  if (summary.errors > 0) {
    items.push("Review and address error-level findings to prevent processing issues");
  }

  if (summary.warnings > 0) {
    items.push("Consider reviewing warnings to improve data quality");
  }

  if (summary.critical === 0 && summary.errors === 0) {
    if (summary.warnings > 0) {
      items.push("Report is submittable but review warnings for best compliance");
    } else {
      items.push("Report is ready for submission to tax authorities");
    }
  }

  items.push("Keep this validation report for your records");
  items.push("Ensure you meet the filing deadline (12 months after fiscal year-end for Luxembourg)");

  return items;
}

/**
 * Get category label
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    [ValidationCategory.XML_WELLFORMEDNESS]: 'XML Structure',
    [ValidationCategory.SCHEMA_COMPLIANCE]: 'Schema Compliance',
    [ValidationCategory.BUSINESS_RULES]: 'Business Rules',
    [ValidationCategory.COUNTRY_RULES]: 'Luxembourg Rules',
    [ValidationCategory.DATA_QUALITY]: 'Data Quality',
    [ValidationCategory.PILLAR2_READINESS]: 'Pillar 2 Analysis',
  };
  return labels[category] || category;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ExecutiveSummary({
  report,
  onDownloadPdf,
  isDownloading = false,
}: ExecutiveSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { summary, results, isValid } = report;

  // Group results by category
  const resultsByCategory: Record<string, ValidationResult[]> = {};
  for (const result of results) {
    if (!resultsByCategory[result.category]) {
      resultsByCategory[result.category] = [];
    }
    resultsByCategory[result.category].push(result);
  }

  // Calculate compliance score
  const score = summary.total > 0
    ? Math.round((summary.passed / summary.total) * 100)
    : 100;

  // Generate commentaries
  const overallAssessment = generateOverallAssessment(summary, isValid);
  const actionItems = generateActionItems(summary);

  return (
    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
      {/* Compact Header with Toggle - Responsive layout */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left side: Title and status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${
            isValid ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-slate-100">Executive Summary</span>
            <span className={`ml-2 text-sm ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
              {isValid ? 'Passed' : 'Failed'}
            </span>
          </div>
        </div>

        {/* Right side: Stats badges and actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quick stats - hidden on mobile, visible on lg+ */}
          <div className="hidden lg:flex items-center gap-2">
            {summary.critical > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
                {summary.critical} critical
              </span>
            )}
            {summary.errors > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 whitespace-nowrap">
                {summary.errors} errors
              </span>
            )}
            {summary.warnings > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                {summary.warnings} warnings
              </span>
            )}
          </div>
          {onDownloadPdf && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPdf();
              }}
              disabled={isDownloading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 flex-shrink-0"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </Button>
          )}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <CardContent className="p-4 space-y-4">
          {/* Overall Assessment */}
          <div className={`p-3 rounded-lg border ${
            isValid
              ? 'bg-emerald-950/20 border-emerald-800'
              : 'bg-red-950/20 border-red-800'
          }`}>
            <p className={`text-sm ${isValid ? 'text-emerald-300' : 'text-red-300'}`}>
              {overallAssessment}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            <div className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-slate-100">{score}%</div>
              <div className="text-xs text-slate-400">Compliance</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-2xl font-bold text-red-400">{summary.critical}</div>
              <div className="text-xs text-red-400">Critical</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <div className="text-2xl font-bold text-orange-400">{summary.errors}</div>
              <div className="text-xs text-orange-400">Errors</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-2xl font-bold text-amber-400">{summary.warnings}</div>
              <div className="text-xs text-amber-400">Warnings</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="text-2xl font-bold text-blue-400">{summary.info}</div>
              <div className="text-xs text-blue-400">Info</div>
            </div>
          </div>

          <Separator className="bg-slate-700" />

        {/* Category Analysis */}
        <div>
          <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <ClipboardList className="h-5 w-5 text-blue-400" />
            Analysis by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(resultsByCategory).map(([category, categoryResults]) => {
              const commentary = generateCategoryCommentary(category, categoryResults);
              const criticalCount = categoryResults.filter(r => r.severity === 'critical').length;
              const errorCount = categoryResults.filter(r => r.severity === 'error').length;
              const warningCount = categoryResults.filter(r => r.severity === 'warning').length;
              const infoCount = categoryResults.filter(r => r.severity === 'info').length;

              return (
                <div key={category} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h4 className="font-medium text-slate-200">{getCategoryLabel(category)}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {criticalCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          {criticalCount} critical
                        </span>
                      )}
                      {errorCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {errorCount} error{errorCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {warningCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {warningCount} warning{warningCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {infoCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {infoCount} info
                        </span>
                      )}
                    </div>
                  </div>
                  {commentary && (
                    <p className="text-sm text-slate-400">{commentary}</p>
                  )}
                </div>
              );
            })}
            {Object.keys(resultsByCategory).length === 0 && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-emerald-400">
                  All validation checks passed without any issues!
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Recommended Actions */}
        <div>
          <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Recommended Actions
          </h3>
          <ul className="space-y-2">
            {actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium ${
                  item.includes('URGENT')
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {index + 1}
                </div>
                <span className={item.includes('URGENT') ? 'text-red-400 font-medium' : 'text-slate-400'}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Findings */}
        {(summary.critical > 0 || summary.errors > 0) && (
          <>
            <Separator className="bg-slate-700" />
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-4">
                <FileWarning className="h-5 w-5 text-amber-400" />
                Key Findings Requiring Attention
              </h3>
              <div className="space-y-3">
                {results
                  .filter(r => r.severity === 'critical' || r.severity === 'error')
                  .slice(0, 5)
                  .map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.severity === 'critical'
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-orange-500/10 border-orange-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          result.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {result.ruleId}
                        </span>
                        <span className={`text-xs uppercase font-semibold ${
                          result.severity === 'critical' ? 'text-red-400' : 'text-orange-400'
                        }`}>
                          {result.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200">{result.message}</p>
                      {result.suggestion && (
                        <p className="text-xs text-slate-400 mt-1">
                          <strong className="text-slate-300">Suggestion:</strong> {result.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">
              <strong className="text-slate-400">Disclaimer:</strong> This validation report is provided for informational purposes only and does not constitute legal or tax advice.
              While every effort has been made to ensure accuracy, users should independently verify compliance with applicable tax authority requirements.
              Always consult with qualified tax professionals before filing Country-by-Country Reports.
            </p>
          </div>
        </div>
        </CardContent>
      )}
    </Card>
  );
}
