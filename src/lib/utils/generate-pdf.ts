/**
 * PDF Generation Utility
 *
 * Server-side utility for generating PDF validation reports.
 *
 * @module lib/utils/generate-pdf
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { ValidationReportPdf } from '@/components/reports/ValidationReportPdf';
import type { ValidationReport, ValidationResult, ValidationSummary, ValidationCategory } from '@/types/validation';
import React from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * PDF generation options
 */
export interface PdfGenerationOptions {
  /** Include detailed results section */
  includeDetails?: boolean;
  /** Include appendix section */
  includeAppendix?: boolean;
  /** Maximum results to include in detailed section */
  maxResults?: number;
}

/**
 * PDF generation result
 */
export interface PdfGenerationResult {
  /** PDF buffer */
  buffer: Buffer;
  /** Suggested filename */
  filename: string;
  /** File size in bytes */
  size: number;
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Generate PDF buffer from validation report
 *
 * @param report - Validation report data
 * @param options - Generation options
 * @returns PDF buffer and metadata
 *
 * @example
 * ```typescript
 * const report = await getReportById(id);
 * const { buffer, filename } = await generatePdfReport(report);
 *
 * return new Response(buffer, {
 *   headers: {
 *     'Content-Type': 'application/pdf',
 *     'Content-Disposition': `attachment; filename="${filename}"`,
 *   },
 * });
 * ```
 */
export async function generatePdfReport(
  report: ValidationReport,
  options: PdfGenerationOptions = {}
): Promise<PdfGenerationResult> {
  const { maxResults = 1000 } = options;

  // Limit results if needed
  const limitedReport: ValidationReport = {
    ...report,
    results: report.results.slice(0, maxResults),
  };

  // Generate PDF buffer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfElement = React.createElement(ValidationReportPdf, { report: limitedReport }) as any;
  const buffer = await renderToBuffer(pdfElement);

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const safeFilename = report.filename
    .replace(/\.xml$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50);
  const filename = `cbcr-validation-${safeFilename}-${timestamp}.pdf`;

  return {
    buffer: Buffer.from(buffer),
    filename,
    size: buffer.byteLength,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a minimal report for quick PDF generation
 */
export function createMinimalReport(
  data: Partial<ValidationReport>
): ValidationReport {
  const now = new Date().toISOString();

  return {
    id: data.id || 'unknown',
    filename: data.filename || 'Unknown.xml',
    uploadedAt: data.uploadedAt || now,
    status: data.status || 'completed',
    isValid: data.isValid ?? false,
    summary: data.summary || {
      critical: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      passed: 0,
      total: 0,
    },
    byCategory: data.byCategory || ({} as Record<ValidationCategory, number>),
    results: data.results || [],
    ...data,
  };
}

/**
 * Format results from database rows to ValidationResult
 */
export function formatDbResults(rows: unknown[]): ValidationResult[] {
  return (rows as Record<string, unknown>[]).map((row) => ({
    ruleId: String(row.rule_id || ''),
    category: String(row.category || '') as ValidationResult['category'],
    severity: String(row.severity || '') as ValidationResult['severity'],
    message: String(row.message || ''),
    xpath: row.xpath ? String(row.xpath) : undefined,
    suggestion: row.suggestion ? String(row.suggestion) : undefined,
    details: row.details_json as Record<string, unknown> | undefined,
    reference: row.reference ? String(row.reference) : undefined,
  }));
}

/**
 * Calculate summary from results
 */
export function calculateSummary(
  results: ValidationResult[],
  totalRules: number = 0
): ValidationSummary {
  const summary: ValidationSummary = {
    critical: 0,
    errors: 0,
    warnings: 0,
    info: 0,
    passed: 0,
    total: totalRules || results.length,
  };

  for (const result of results) {
    switch (result.severity) {
      case 'critical':
        summary.critical++;
        break;
      case 'error':
        summary.errors++;
        break;
      case 'warning':
        summary.warnings++;
        break;
      case 'info':
        summary.info++;
        break;
    }
  }

  summary.passed = summary.total - (summary.critical + summary.errors);

  return summary;
}

/**
 * Group results by category
 */
export function groupResultsByCategory(
  results: ValidationResult[]
): Record<string, ValidationResult[]> {
  const grouped: Record<string, ValidationResult[]> = {};

  for (const result of results) {
    if (!grouped[result.category]) {
      grouped[result.category] = [];
    }
    grouped[result.category].push(result);
  }

  return grouped;
}

/**
 * Get counts by category
 */
export function countByCategory(
  results: ValidationResult[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const result of results) {
    counts[result.category] = (counts[result.category] || 0) + 1;
  }

  return counts;
}

