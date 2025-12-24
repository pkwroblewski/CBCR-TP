/**
 * Validation Report PDF
 *
 * Complete PDF document for CbC validation reports.
 *
 * @module components/reports/ValidationReportPdf
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Link,
} from '@react-pdf/renderer';
import { styles, getSeverityStyles, getCategoryLabel, COLORS } from './PdfStyles';
import type { ValidationReport, ValidationResult, ValidationSummary } from '@/types/validation';

// =============================================================================
// TYPES
// =============================================================================

interface ValidationReportPdfProps {
  report: ValidationReport;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Page header component
 */
function Header({ generatedDate }: { generatedDate: string }) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerLogo}>
        <View style={styles.headerLogoBox}>
          <Text style={styles.headerLogoText}>PW</Text>
        </View>
        <Text style={styles.headerTitle}>PW-(CbCR) Analyzer</Text>
      </View>
      <Text style={styles.headerDate}>Generated: {generatedDate}</Text>
    </View>
  );
}

/**
 * Page footer component
 */
function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        CbCR Validation Report • Confidential
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

/**
 * Severity badge component
 */
function SeverityBadge({ severity }: { severity: string }) {
  const severityStyles = getSeverityStyles(severity);
  return (
    <Text style={[styles.resultBadge, severityStyles.badge]}>
      {severity.toUpperCase()}
    </Text>
  );
}

/**
 * Summary box component
 */
function SummaryBox({
  count,
  label,
  severity,
}: {
  count: number;
  label: string;
  severity: string;
}) {
  const severityStyles = getSeverityStyles(severity);
  return (
    <View style={[styles.summaryBox, severityStyles.box]}>
      <Text style={[styles.summaryCount, severityStyles.count]}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

/**
 * Result card component
 */
function ResultCard({ result }: { result: ValidationResult }) {
  const severityStyles = getSeverityStyles(result.severity);

  return (
    <View style={[styles.resultCard, severityStyles.card]} wrap={false}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultRuleId}>{result.ruleId}</Text>
        <SeverityBadge severity={result.severity} />
      </View>
      <Text style={styles.resultMessage}>{result.message}</Text>
      {result.xpath && (
        <Text style={styles.resultXpath}>{result.xpath}</Text>
      )}
      {result.suggestion && (
        <Text style={styles.resultSuggestion}>{result.suggestion}</Text>
      )}
    </View>
  );
}

/**
 * Category section component
 */
function CategorySection({
  category,
  results,
}: {
  category: string;
  results: ValidationResult[];
}) {
  if (results.length === 0) return null;

  return (
    <View>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{getCategoryLabel(category)}</Text>
        <Text style={styles.categoryCount}>{results.length} issues</Text>
      </View>
      {results.map((result, index) => (
        <ResultCard key={`${result.ruleId}-${index}`} result={result} />
      ))}
    </View>
  );
}

// =============================================================================
// COVER PAGE
// =============================================================================

function CoverPage({
  report,
  generatedDate,
}: {
  report: ValidationReport;
  generatedDate: string;
}) {
  const isValid = report.summary.critical === 0;
  const totalIssues =
    report.summary.critical +
    report.summary.errors +
    report.summary.warnings +
    report.summary.info;
  const score =
    report.summary.total > 0
      ? Math.round((report.summary.passed / report.summary.total) * 100)
      : 100;

  return (
    <Page size="A4" style={styles.coverPage}>
      {/* Logo */}
      <View style={styles.coverLogoBox}>
        <Text style={styles.coverLogoText}>PW</Text>
      </View>

      {/* Title */}
      <Text style={styles.coverTitle}>CbCR Validation Report</Text>
      <Text style={styles.coverSubtitle}>
        Country-by-Country Reporting Compliance Analysis
      </Text>

      {/* Metadata */}
      <View style={styles.coverMeta}>
        <View style={styles.coverMetaRow}>
          <Text style={styles.coverMetaLabel}>File Name:</Text>
          <Text style={styles.coverMetaValue}>{report.filename}</Text>
        </View>
        {report.fiscalYear && (
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Fiscal Year:</Text>
            <Text style={styles.coverMetaValue}>{report.fiscalYear}</Text>
          </View>
        )}
        {report.upeJurisdiction && (
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>UPE Jurisdiction:</Text>
            <Text style={styles.coverMetaValue}>{report.upeJurisdiction}</Text>
          </View>
        )}
        {report.upeName && (
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>UPE Name:</Text>
            <Text style={styles.coverMetaValue}>{report.upeName}</Text>
          </View>
        )}
        <View style={styles.coverMetaRow}>
          <Text style={styles.coverMetaLabel}>Generated:</Text>
          <Text style={styles.coverMetaValue}>{generatedDate}</Text>
        </View>
      </View>

      {/* Status */}
      <View
        style={[
          styles.coverStatusBox,
          isValid ? styles.coverStatusPass : styles.coverStatusFail,
        ]}
      >
        <Text
          style={[
            styles.coverStatusText,
            isValid ? styles.coverStatusTextPass : styles.coverStatusTextFail,
          ]}
        >
          {isValid ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}
        </Text>
      </View>

      {/* Score */}
      <Text style={styles.coverScore}>{score}%</Text>
      <Text style={styles.coverScoreLabel}>
        Compliance Score • {report.summary.passed} of {report.summary.total} checks passed
      </Text>
    </Page>
  );
}

// =============================================================================
// EXECUTIVE SUMMARY PAGE
// =============================================================================

function ExecutiveSummaryPage({
  report,
  generatedDate,
}: {
  report: ValidationReport;
  generatedDate: string;
}) {
  // Get top critical/error issues
  const topIssues = report.results
    .filter((r) => r.severity === 'critical' || r.severity === 'error')
    .slice(0, 5);

  // Get by category
  const byCategory: Record<string, number> = {};
  for (const result of report.results) {
    byCategory[result.category] = (byCategory[result.category] || 0) + 1;
  }

  return (
    <Page size="A4" style={styles.page}>
      <Header generatedDate={generatedDate} />

      <Text style={styles.sectionTitle}>Executive Summary</Text>

      {/* Overview by Severity */}
      <Text style={styles.subsectionTitle}>Results by Severity</Text>
      <View style={styles.summaryGrid}>
        <SummaryBox
          count={report.summary.critical}
          label="Critical"
          severity="critical"
        />
        <SummaryBox
          count={report.summary.errors}
          label="Errors"
          severity="error"
        />
        <SummaryBox
          count={report.summary.warnings}
          label="Warnings"
          severity="warning"
        />
        <SummaryBox
          count={report.summary.info}
          label="Info"
          severity="info"
        />
      </View>

      {/* Overview by Category */}
      <Text style={styles.subsectionTitle}>Results by Category</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>
            Issues
          </Text>
        </View>
        {Object.entries(byCategory).map(([category, count], index) => (
          <View
            key={category}
            style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
          >
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {getCategoryLabel(category)}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' as const }]}>
              {count}
            </Text>
          </View>
        ))}
      </View>

      {/* Key Findings */}
      {topIssues.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>Key Findings</Text>
          <Text style={[styles.text, styles.mb10]}>
            The following critical and error-level issues require immediate attention:
          </Text>
          {topIssues.map((issue, index) => (
            <ResultCard key={`top-${index}`} result={issue} />
          ))}
        </>
      )}

      <Footer />
    </Page>
  );
}

// =============================================================================
// DETAILED RESULTS PAGES
// =============================================================================

function DetailedResultsPages({
  report,
  generatedDate,
}: {
  report: ValidationReport;
  generatedDate: string;
}) {
  // Group results by category
  const resultsByCategory: Record<string, ValidationResult[]> = {};
  for (const result of report.results) {
    if (!resultsByCategory[result.category]) {
      resultsByCategory[result.category] = [];
    }
    resultsByCategory[result.category].push(result);
  }

  // Sort categories by severity of issues
  const categoryOrder = [
    'xml_wellformedness',
    'schema_validation',
    'schema_compliance',
    'business_rules',
    'country_rules',
    'data_quality',
    'pillar2_readiness',
  ];

  const sortedCategories = Object.keys(resultsByCategory).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  if (sortedCategories.length === 0) {
    return (
      <Page size="A4" style={styles.page}>
        <Header generatedDate={generatedDate} />
        <Text style={styles.sectionTitle}>Detailed Results</Text>
        <Text style={styles.text}>
          No validation issues were found. Your CbC report passed all checks.
        </Text>
        <Footer />
      </Page>
    );
  }

  return (
    <Page size="A4" style={styles.page}>
      <Header generatedDate={generatedDate} />
      <Text style={styles.sectionTitle}>Detailed Results</Text>
      <Text style={[styles.text, styles.mb20]}>
        The following section contains all validation findings organized by category.
        Each result includes the rule identifier, severity, message, and location in the XML.
      </Text>

      {sortedCategories.map((category) => (
        <CategorySection
          key={category}
          category={category}
          results={resultsByCategory[category]}
        />
      ))}

      <Footer />
    </Page>
  );
}

// =============================================================================
// APPENDIX PAGE
// =============================================================================

function AppendixPage({ generatedDate }: { generatedDate: string }) {
  return (
    <Page size="A4" style={styles.page}>
      <Header generatedDate={generatedDate} />

      <Text style={styles.sectionTitle}>Appendix</Text>

      {/* Severity Definitions */}
      <View style={styles.appendixSection}>
        <Text style={styles.subsectionTitle}>Severity Levels</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Level</Text>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Description</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1, color: COLORS.critical }]}>
              Critical
            </Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>
              Filing will be rejected by tax authorities. Must be fixed before submission.
            </Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={[styles.tableCell, { flex: 1, color: COLORS.error }]}>
              Error
            </Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>
              May cause processing issues or trigger follow-up inquiries.
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1, color: COLORS.warning }]}>
              Warning
            </Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>
              Data quality concern. Consider reviewing before submission.
            </Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={[styles.tableCell, { flex: 1, color: COLORS.info }]}>
              Info
            </Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>
              Best practice suggestion for improved compliance.
            </Text>
          </View>
        </View>
      </View>

      {/* References */}
      <View style={styles.appendixSection}>
        <Text style={styles.subsectionTitle}>References</Text>
        <Text style={styles.text}>
          This validation is based on the following official guidance:
        </Text>
        <Text style={[styles.text, styles.mb10]}>
          • OECD CbC XML Schema v2.0 User Guide{'\n'}
          • BEPS Action 13 Implementation Package{'\n'}
          • OECD Guidance on Country-by-Country Reporting{'\n'}
          • Jurisdiction-specific filing requirements
        </Text>
        <Text style={styles.textSmall}>
          For the latest guidance, visit:{' '}
          <Link src="https://www.oecd.org/tax/beps/">
            https://www.oecd.org/tax/beps/
          </Link>
        </Text>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          This validation report is provided for informational purposes only and does not
          constitute legal or tax advice. While every effort has been made to ensure accuracy,
          users should independently verify compliance with applicable tax authority requirements.
          PW-(CbCR) Analyzer and its operators assume no liability for any errors or omissions in this
          report or for any actions taken based on its contents. Always consult with qualified
          tax professionals before filing Country-by-Country Reports.
        </Text>
      </View>

      {/* Contact */}
      <View style={[styles.appendixSection, { marginTop: 20 }]}>
        <Text style={styles.subsectionTitle}>Support</Text>
        <Text style={styles.text}>
          For questions about this report or our validation service:{'\n'}
          Email: support@cbcr-review.com{'\n'}
          Website: https://cbcr-review.com
        </Text>
      </View>

      <Footer />
    </Page>
  );
}

// =============================================================================
// MAIN DOCUMENT
// =============================================================================

/**
 * Complete PDF validation report document
 */
export function ValidationReportPdf({ report }: ValidationReportPdfProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Document
      title={`CbCR Validation Report - ${report.filename}`}
      author="PW-(CbCR) Analyzer"
      subject="Country-by-Country Report Validation"
      creator="PW-(CbCR) Analyzer"
    >
      <CoverPage report={report} generatedDate={generatedDate} />
      <ExecutiveSummaryPage report={report} generatedDate={generatedDate} />
      <DetailedResultsPages report={report} generatedDate={generatedDate} />
      <AppendixPage generatedDate={generatedDate} />
    </Document>
  );
}

