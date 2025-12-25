'use client';

/**
 * Executive Summary Component
 *
 * Human-readable summary of validation results with recommendations.
 *
 * @module components/reports/ExecutiveSummary
 */

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
    <Card className="glass border-white/20 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-primary">Executive Summary</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Human-readable analysis and recommendations
              </p>
            </div>
          </CardTitle>
          {onDownloadPdf && (
            <Button
              onClick={onDownloadPdf}
              disabled={isDownloading}
              className="bg-gradient-to-r from-accent to-cyan-500 hover:from-accent/90 hover:to-cyan-500/90 shadow-lg"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Report
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Overall Status */}
        <div className={`p-4 rounded-xl border ${
          isValid
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
            : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {isValid ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={`font-semibold ${isValid ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
                {isValid ? 'Validation Passed' : 'Validation Failed'}
              </h3>
              <p className={`text-sm mt-1 ${isValid ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                {overallAssessment}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center p-3 rounded-lg bg-stone-100 dark:bg-stone-800">
            <div className="text-2xl font-bold text-primary">{score}%</div>
            <div className="text-xs text-muted-foreground">Compliance Score</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
            <div className="text-xs text-red-600">Critical</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-600">{summary.errors}</div>
            <div className="text-xs text-orange-600">Errors</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="text-2xl font-bold text-amber-600">{summary.warnings}</div>
            <div className="text-xs text-amber-600">Warnings</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600">{summary.info}</div>
            <div className="text-xs text-blue-600">Info</div>
          </div>
        </div>

        <Separator />

        {/* Category Analysis */}
        <div>
          <h3 className="font-semibold text-primary flex items-center gap-2 mb-4">
            <ClipboardList className="h-5 w-5" />
            Analysis by Category
          </h3>
          <div className="space-y-4">
            {Object.entries(resultsByCategory).map(([category, categoryResults]) => {
              const commentary = generateCategoryCommentary(category, categoryResults);
              const criticalCount = categoryResults.filter(r => r.severity === 'critical').length;
              const errorCount = categoryResults.filter(r => r.severity === 'error').length;
              const warningCount = categoryResults.filter(r => r.severity === 'warning').length;
              const infoCount = categoryResults.filter(r => r.severity === 'info').length;

              return (
                <div key={category} className="p-4 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{getCategoryLabel(category)}</h4>
                    <div className="flex items-center gap-2 text-xs">
                      {criticalCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                          {criticalCount} critical
                        </span>
                      )}
                      {errorCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                          {errorCount} error{errorCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {warningCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          {warningCount} warning{warningCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {infoCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          {infoCount} info
                        </span>
                      )}
                    </div>
                  </div>
                  {commentary && (
                    <p className="text-sm text-muted-foreground">{commentary}</p>
                  )}
                </div>
              );
            })}
            {Object.keys(resultsByCategory).length === 0 && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  All validation checks passed without any issues!
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Recommended Actions */}
        <div>
          <h3 className="font-semibold text-primary flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5" />
            Recommended Actions
          </h3>
          <ul className="space-y-2">
            {actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  item.includes('URGENT')
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/50'
                    : 'bg-accent/10 text-accent'
                }`}>
                  {index + 1}
                </div>
                <span className={item.includes('URGENT') ? 'text-red-700 dark:text-red-300 font-medium' : 'text-muted-foreground'}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Findings */}
        {(summary.critical > 0 || summary.errors > 0) && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-primary flex items-center gap-2 mb-4">
                <FileWarning className="h-5 w-5" />
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
                          ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                          : 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          result.severity === 'critical'
                            ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                            : 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                        }`}>
                          {result.ruleId}
                        </span>
                        <span className={`text-xs uppercase font-semibold ${
                          result.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {result.severity}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{result.message}</p>
                      {result.suggestion && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Suggestion:</strong> {result.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <div className="p-4 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong>Disclaimer:</strong> This validation report is provided for informational purposes only and does not constitute legal or tax advice.
              While every effort has been made to ensure accuracy, users should independently verify compliance with applicable tax authority requirements.
              Always consult with qualified tax professionals before filing Country-by-Country Reports.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
