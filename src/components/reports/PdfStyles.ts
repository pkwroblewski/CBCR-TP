/**
 * PDF Styles
 *
 * Professional styling for PDF validation reports.
 *
 * @module components/reports/PdfStyles
 */

import { StyleSheet, Font } from '@react-pdf/renderer';

// =============================================================================
// COLORS
// =============================================================================

export const COLORS = {
  // Primary
  primary: '#1a365d',
  primaryLight: '#2d4a7c',
  primaryDark: '#0f1f35',

  // Severity colors
  critical: '#dc2626',
  criticalBg: '#fef2f2',
  error: '#ea580c',
  errorBg: '#fff7ed',
  warning: '#d97706',
  warningBg: '#fffbeb',
  info: '#2563eb',
  infoBg: '#eff6ff',

  // Status
  success: '#16a34a',
  successBg: '#f0fdf4',
  fail: '#dc2626',
  failBg: '#fef2f2',

  // Neutrals
  white: '#ffffff',
  background: '#f8fafc',
  border: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

// Register fonts (using default for simplicity)
// For production, register custom fonts like:
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
// });

export const FONTS = {
  primary: 'Helvetica',
  primaryBold: 'Helvetica-Bold',
  mono: 'Courier',
} as const;

// =============================================================================
// COMMON STYLES
// =============================================================================

export const styles = StyleSheet.create({
  // ==========================================================================
  // PAGE LAYOUT
  // ==========================================================================
  page: {
    flexDirection: 'column',
    backgroundColor: COLORS.white,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: FONTS.primary,
    fontSize: 10,
    color: COLORS.textPrimary,
  },

  coverPage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 50,
  },

  // ==========================================================================
  // HEADER & FOOTER
  // ==========================================================================
  header: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerLogoBox: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  headerLogoText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: FONTS.primaryBold,
  },

  headerTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONTS.primaryBold,
  },

  headerDate: {
    color: COLORS.textSecondary,
    fontSize: 9,
  },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  footerText: {
    color: COLORS.textMuted,
    fontSize: 8,
  },

  pageNumber: {
    color: COLORS.textSecondary,
    fontSize: 9,
  },

  // ==========================================================================
  // COVER PAGE
  // ==========================================================================
  coverLogoBox: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },

  coverLogoText: {
    color: COLORS.white,
    fontSize: 32,
    fontFamily: FONTS.primaryBold,
  },

  coverTitle: {
    fontSize: 32,
    fontFamily: FONTS.primaryBold,
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: 'center',
  },

  coverSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },

  coverMeta: {
    marginBottom: 40,
    alignItems: 'center',
  },

  coverMetaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  coverMetaLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    width: 120,
    textAlign: 'right',
    marginRight: 12,
  },

  coverMetaValue: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontFamily: FONTS.primaryBold,
    width: 200,
  },

  coverStatusBox: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 20,
  },

  coverStatusPass: {
    backgroundColor: COLORS.successBg,
    borderWidth: 2,
    borderColor: COLORS.success,
  },

  coverStatusFail: {
    backgroundColor: COLORS.failBg,
    borderWidth: 2,
    borderColor: COLORS.fail,
  },

  coverStatusText: {
    fontSize: 24,
    fontFamily: FONTS.primaryBold,
    textAlign: 'center',
  },

  coverStatusTextPass: {
    color: COLORS.success,
  },

  coverStatusTextFail: {
    color: COLORS.fail,
  },

  coverScore: {
    fontSize: 48,
    fontFamily: FONTS.primaryBold,
    color: COLORS.primary,
    marginBottom: 5,
    textAlign: 'center',
  },

  coverScoreLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ==========================================================================
  // SECTION HEADERS
  // ==========================================================================
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.primaryBold,
    color: COLORS.primary,
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },

  subsectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.primaryBold,
    color: COLORS.textPrimary,
    marginTop: 15,
    marginBottom: 10,
  },

  // ==========================================================================
  // SUMMARY BOXES
  // ==========================================================================
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },

  summaryBox: {
    width: '23%',
    marginRight: '2%',
    marginBottom: 10,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },

  summaryBoxCritical: {
    backgroundColor: COLORS.criticalBg,
    borderWidth: 1,
    borderColor: COLORS.critical,
  },

  summaryBoxError: {
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.error,
  },

  summaryBoxWarning: {
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },

  summaryBoxInfo: {
    backgroundColor: COLORS.infoBg,
    borderWidth: 1,
    borderColor: COLORS.info,
  },

  summaryCount: {
    fontSize: 24,
    fontFamily: FONTS.primaryBold,
    marginBottom: 4,
  },

  summaryCountCritical: {
    color: COLORS.critical,
  },

  summaryCountError: {
    color: COLORS.error,
  },

  summaryCountWarning: {
    color: COLORS.warning,
  },

  summaryCountInfo: {
    color: COLORS.info,
  },

  summaryLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },

  // ==========================================================================
  // TABLES
  // ==========================================================================
  table: {
    marginBottom: 15,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  tableHeaderCell: {
    color: COLORS.white,
    fontSize: 9,
    fontFamily: FONTS.primaryBold,
    textTransform: 'uppercase',
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  tableRowAlt: {
    backgroundColor: COLORS.background,
  },

  tableCell: {
    fontSize: 9,
    color: COLORS.textPrimary,
  },

  tableCellMono: {
    fontFamily: FONTS.mono,
    fontSize: 8,
  },

  // ==========================================================================
  // RESULT CARDS
  // ==========================================================================
  resultCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
  },

  resultCardCritical: {
    borderLeftColor: COLORS.critical,
    backgroundColor: COLORS.criticalBg,
  },

  resultCardError: {
    borderLeftColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },

  resultCardWarning: {
    borderLeftColor: COLORS.warning,
    backgroundColor: COLORS.warningBg,
  },

  resultCardInfo: {
    borderLeftColor: COLORS.info,
    backgroundColor: COLORS.infoBg,
  },

  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  resultRuleId: {
    fontSize: 10,
    fontFamily: FONTS.primaryBold,
    color: COLORS.textPrimary,
  },

  resultBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: FONTS.primaryBold,
    textTransform: 'uppercase',
  },

  resultBadgeCritical: {
    backgroundColor: COLORS.critical,
    color: COLORS.white,
  },

  resultBadgeError: {
    backgroundColor: COLORS.error,
    color: COLORS.white,
  },

  resultBadgeWarning: {
    backgroundColor: COLORS.warning,
    color: COLORS.white,
  },

  resultBadgeInfo: {
    backgroundColor: COLORS.info,
    color: COLORS.white,
  },

  resultMessage: {
    fontSize: 10,
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 1.4,
  },

  resultXpath: {
    fontSize: 8,
    fontFamily: FONTS.mono,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.white,
    padding: 6,
    borderRadius: 4,
    marginBottom: 6,
  },

  resultSuggestion: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.info,
  },

  // ==========================================================================
  // CATEGORY SECTION
  // ==========================================================================
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    marginTop: 20,
  },

  categoryTitle: {
    fontSize: 12,
    fontFamily: FONTS.primaryBold,
    color: COLORS.textPrimary,
    flex: 1,
  },

  categoryCount: {
    fontSize: 10,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.white,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },

  // ==========================================================================
  // APPENDIX
  // ==========================================================================
  appendixSection: {
    marginBottom: 20,
  },

  disclaimer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  disclaimerTitle: {
    fontSize: 10,
    fontFamily: FONTS.primaryBold,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  disclaimerText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },

  // ==========================================================================
  // UTILITY
  // ==========================================================================
  mb10: {
    marginBottom: 10,
  },

  mb20: {
    marginBottom: 20,
  },

  text: {
    fontSize: 10,
    color: COLORS.textPrimary,
    lineHeight: 1.5,
  },

  textSmall: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },

  textBold: {
    fontFamily: FONTS.primaryBold,
  },

  link: {
    color: COLORS.info,
    textDecoration: 'underline',
  },
});

// =============================================================================
// SEVERITY HELPERS
// =============================================================================

export function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'critical':
      return {
        card: styles.resultCardCritical,
        badge: styles.resultBadgeCritical,
        count: styles.summaryCountCritical,
        box: styles.summaryBoxCritical,
      };
    case 'error':
      return {
        card: styles.resultCardError,
        badge: styles.resultBadgeError,
        count: styles.summaryCountError,
        box: styles.summaryBoxError,
      };
    case 'warning':
      return {
        card: styles.resultCardWarning,
        badge: styles.resultBadgeWarning,
        count: styles.summaryCountWarning,
        box: styles.summaryBoxWarning,
      };
    case 'info':
    default:
      return {
        card: styles.resultCardInfo,
        badge: styles.resultBadgeInfo,
        count: styles.summaryCountInfo,
        box: styles.summaryBoxInfo,
      };
  }
}

// =============================================================================
// CATEGORY LABELS
// =============================================================================

export const CATEGORY_LABELS: Record<string, string> = {
  xml_wellformedness: 'XML Structure',
  schema_validation: 'Schema Compliance',
  schema_compliance: 'Schema Compliance',
  business_rules: 'Business Rules',
  country_rules: 'Country Rules',
  data_quality: 'Data Quality',
  pillar2_readiness: 'Pillar 2 Readiness',
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

