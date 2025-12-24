/**
 * Pillar 2 Jurisdiction Analyzer
 *
 * Analyzes each jurisdiction's Pillar 2 status including:
 * - Whether the jurisdiction has implemented qualified GloBE rules
 * - IIR/UTPR/QDMTT applicability
 * - Potential top-up tax liability estimates
 * - Ordering rules for charging mechanism
 *
 * @module lib/validators/pillar2/jurisdiction-analyzer
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext, JurisdictionReference } from '../core/validation-context';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Jurisdictions with known qualified GloBE rules (as of 2024)
 * This list should be updated as more jurisdictions implement Pillar 2
 */
const QUALIFIED_GLOBE_JURISDICTIONS: Record<string, {
  iir: boolean;
  utpr: boolean;
  qdmtt: boolean;
  effectiveDate: string;
}> = {
  // EU Member States (implementing EU Directive 2022/2523)
  AT: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  BE: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  BG: { iir: true, utpr: true, qdmtt: false, effectiveDate: '2024-01-01' },
  CY: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  CZ: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  DE: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  DK: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  EE: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  ES: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  FI: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  FR: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  GR: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  HR: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  HU: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  IE: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  IT: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  LT: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  LU: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  LV: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  MT: { iir: true, utpr: true, qdmtt: false, effectiveDate: '2024-01-01' },
  NL: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  PL: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  PT: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  RO: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  SE: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  SI: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  SK: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  
  // Non-EU jurisdictions with Pillar 2
  GB: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  CH: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  JP: { iir: true, utpr: false, qdmtt: true, effectiveDate: '2024-04-01' },
  KR: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  AU: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  NZ: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  CA: { iir: true, utpr: true, qdmtt: true, effectiveDate: '2024-01-01' },
  SG: { iir: false, utpr: false, qdmtt: true, effectiveDate: '2025-01-01' },
  HK: { iir: false, utpr: false, qdmtt: true, effectiveDate: '2025-01-01' },
  AE: { iir: false, utpr: false, qdmtt: true, effectiveDate: '2025-01-01' },
};

/**
 * Known low-tax jurisdictions (headline rate < 15%)
 */
const LOW_TAX_JURISDICTIONS = [
  'BM', // Bermuda (0%)
  'VG', // British Virgin Islands (0%)
  'KY', // Cayman Islands (0%)
  'JE', // Jersey (0%)
  'GG', // Guernsey (0%)
  'IM', // Isle of Man (0%)
  'BH', // Bahrain (0%)
  'AE', // UAE (historically 0%, now 9% for large companies)
  'HK', // Hong Kong (8.25-16.5%, but territorial)
  'SG', // Singapore (17% but various incentives)
  'IE', // Ireland (12.5% for trading income)
  'HU', // Hungary (9%)
  'BG', // Bulgaria (10%)
  'CY', // Cyprus (12.5%)
];

/**
 * Minimum tax rate for GloBE
 */
const MINIMUM_TAX_RATE = 0.15;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Jurisdiction Pillar 2 analysis result
 */
export interface JurisdictionPillar2Analysis {
  /** Jurisdiction code */
  jurisdiction: string;
  /** Whether jurisdiction has qualified GloBE rules */
  hasQualifiedRules: boolean;
  /** Which rules are implemented */
  rules: {
    iir: boolean;
    utpr: boolean;
    qdmtt: boolean;
  };
  /** Simplified ETR from CbCR */
  simplifiedEtr: number;
  /** Whether ETR is below minimum */
  isBelowMinimum: boolean;
  /** Estimated top-up tax (rough) */
  estimatedTopUp: number;
  /** Risk level */
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  /** Charging mechanism */
  chargingMechanism: 'qdmtt' | 'iir' | 'utpr' | 'none';
}

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Analyzes jurisdictions for Pillar 2 implications
 */
export class JurisdictionAnalyzer extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'pillar2-jurisdiction-analyzer',
    name: 'Jurisdiction Analyzer',
    description: 'Analyzes Pillar 2 status and top-up tax risk by jurisdiction',
    category: ValidationCategory.PILLAR2_READINESS,
    order: 420,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Skip if Pillar 2 checks not requested
    if (!ctx.options.checkPillar2) {
      return results;
    }

    const jurisdictions = ctx.getJurisdictionReferences();
    const analyses: JurisdictionPillar2Analysis[] = [];

    // Analyze each jurisdiction
    for (const j of jurisdictions) {
      const analysis = this.analyzeJurisdiction(j);
      analyses.push(analysis);
      results.push(...this.createJurisdictionResults(analysis));
    }

    // Summary and ordering analysis
    results.push(...this.createSummaryResults(analyses, ctx));
    results.push(...this.analyzeChargingOrder(analyses, ctx));

    return results;
  }

  /**
   * Analyze a jurisdiction for Pillar 2
   */
  private analyzeJurisdiction(j: JurisdictionReference): JurisdictionPillar2Analysis {
    const qualifiedRules = QUALIFIED_GLOBE_JURISDICTIONS[j.code];
    const hasQualifiedRules = !!qualifiedRules;

    // Calculate simplified ETR
    const simplifiedEtr = j.profitOrLoss > 0 ? j.taxAccrued / j.profitOrLoss : 0;
    const isBelowMinimum = j.profitOrLoss > 0 && simplifiedEtr < MINIMUM_TAX_RATE;

    // Estimate top-up tax (very rough)
    let estimatedTopUp = 0;
    if (isBelowMinimum && j.profitOrLoss > 0) {
      const taxGap = MINIMUM_TAX_RATE - simplifiedEtr;
      estimatedTopUp = j.profitOrLoss * taxGap;
    }

    // Determine risk level
    const riskLevel = this.determineRiskLevel(j, simplifiedEtr, isBelowMinimum);

    // Determine charging mechanism
    const chargingMechanism = this.determineChargingMechanism(
      j.code,
      hasQualifiedRules,
      qualifiedRules
    );

    return {
      jurisdiction: j.code,
      hasQualifiedRules,
      rules: qualifiedRules ?? { iir: false, utpr: false, qdmtt: false },
      simplifiedEtr,
      isBelowMinimum,
      estimatedTopUp,
      riskLevel,
      chargingMechanism,
    };
  }

  /**
   * Determine Pillar 2 risk level
   */
  private determineRiskLevel(
    j: JurisdictionReference,
    etr: number,
    isBelowMinimum: boolean
  ): 'high' | 'medium' | 'low' | 'none' {
    // Loss-making = no risk
    if (j.profitOrLoss <= 0) {
      return 'none';
    }

    // Small profits = low risk (de minimis may apply)
    if (j.profitOrLoss < 1_000_000 && j.totalRevenues < 10_000_000) {
      return 'low';
    }

    // Well above minimum = no risk
    if (etr >= 0.17) {
      return 'none';
    }

    // Below minimum with significant profit = high risk
    if (isBelowMinimum && j.profitOrLoss >= 5_000_000) {
      return 'high';
    }

    // Below minimum = medium risk
    if (isBelowMinimum) {
      return 'medium';
    }

    // Close to minimum = low risk
    if (etr < 0.17) {
      return 'low';
    }

    return 'none';
  }

  /**
   * Determine which mechanism would charge top-up tax
   */
  private determineChargingMechanism(
    jurisdictionCode: string,
    hasQualifiedRules: boolean,
    rules?: { iir: boolean; utpr: boolean; qdmtt: boolean }
  ): 'qdmtt' | 'iir' | 'utpr' | 'none' {
    // Order: QDMTT first (if jurisdiction has it), then IIR (UPE level), then UTPR
    if (hasQualifiedRules && rules?.qdmtt) {
      return 'qdmtt';
    }
    
    // For IIR/UTPR, the mechanism depends on group structure
    // Simplified assumption: if no QDMTT, IIR applies at UPE level
    // This is a simplification - actual ordering is more complex
    return 'none';
  }

  /**
   * Create validation results for a jurisdiction
   */
  private createJurisdictionResults(
    analysis: JurisdictionPillar2Analysis
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const j = analysis.jurisdiction;

    // Qualified rules status
    if (analysis.hasQualifiedRules) {
      const rulesStr = [
        analysis.rules.iir && 'IIR',
        analysis.rules.utpr && 'UTPR',
        analysis.rules.qdmtt && 'QDMTT',
      ].filter(Boolean).join('/');

      results.push(
        this.result('P2-JUR-001')
          .info()
          .message(`${j}: Has qualified GloBE rules (${rulesStr})`)
          .details({
            jurisdiction: j,
            rules: analysis.rules,
          })
          .build()
      );
    } else {
      results.push(
        this.result('P2-JUR-002')
          .info()
          .message(`${j}: No qualified GloBE rules implemented`)
          .suggestion('Top-up tax may apply via IIR/UTPR in other jurisdictions')
          .build()
      );
    }

    // Risk assessment
    if (analysis.riskLevel === 'high') {
      results.push(
        this.result('P2-JUR-010')
          .warning()
          .message(
            `${j}: HIGH Pillar 2 risk - ETR ${(analysis.simplifiedEtr * 100).toFixed(1)}% below 15%, ` +
            `estimated top-up €${this.formatNumber(analysis.estimatedTopUp)}`
          )
          .details({
            jurisdiction: j,
            etr: (analysis.simplifiedEtr * 100).toFixed(2),
            estimatedTopUp: analysis.estimatedTopUp,
            chargingMechanism: analysis.chargingMechanism,
          })
          .suggestion('Full GloBE calculation required to determine actual top-up tax liability')
          .build()
      );
    } else if (analysis.riskLevel === 'medium') {
      results.push(
        this.result('P2-JUR-011')
          .info()
          .message(
            `${j}: MEDIUM Pillar 2 risk - ETR ${(analysis.simplifiedEtr * 100).toFixed(1)}%`
          )
          .build()
      );
    }

    // Low-tax jurisdiction warning
    if (LOW_TAX_JURISDICTIONS.includes(j)) {
      results.push(
        this.result('P2-JUR-020')
          .info()
          .message(`${j}: Known low-tax jurisdiction - may trigger top-up tax`)
          .build()
      );
    }

    return results;
  }

  /**
   * Create summary results
   */
  private createSummaryResults(
    analyses: JurisdictionPillar2Analysis[],
    ctx: ValidationContext
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    const highRisk = analyses.filter((a) => a.riskLevel === 'high');
    const mediumRisk = analyses.filter((a) => a.riskLevel === 'medium');
    const withQdmtt = analyses.filter((a) => a.rules.qdmtt);
    const totalEstimatedTopUp = analyses.reduce((sum, a) => sum + a.estimatedTopUp, 0);

    results.push(
      this.result('P2-JUR-SUMMARY')
        .info()
        .message(
          `Pillar 2 Analysis: ${analyses.length} jurisdictions, ` +
          `${highRisk.length} high risk, ${mediumRisk.length} medium risk, ` +
          `${withQdmtt.length} with QDMTT`
        )
        .details({
          totalJurisdictions: analyses.length,
          highRiskCount: highRisk.length,
          mediumRiskCount: mediumRisk.length,
          withQdmtt: withQdmtt.length,
          highRiskJurisdictions: highRisk.map((a) => a.jurisdiction),
          totalEstimatedTopUp,
        })
        .build()
    );

    if (totalEstimatedTopUp > 0) {
      results.push(
        this.result('P2-JUR-TOPUP')
          .warning()
          .message(
            `Estimated total top-up tax exposure: €${this.formatNumber(totalEstimatedTopUp)}`
          )
          .suggestion(
            'This is a rough estimate based on CbCR data. Actual liability requires full GloBE calculation.'
          )
          .build()
      );
    }

    return results;
  }

  /**
   * Analyze charging order for top-up tax
   */
  private analyzeChargingOrder(
    analyses: JurisdictionPillar2Analysis[],
    ctx: ValidationContext
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    const upeJurisdiction = ctx.getReportingJurisdiction();
    const belowMinimum = analyses.filter((a) => a.isBelowMinimum);

    if (belowMinimum.length === 0) {
      results.push(
        this.result('P2-JUR-ORDER')
          .info()
          .message('No jurisdictions below 15% minimum rate - no top-up tax expected')
          .build()
      );
      return results;
    }

    // Explain charging order
    const qdmttJurisdictions = belowMinimum.filter((a) => a.rules.qdmtt);
    const nonQdmttJurisdictions = belowMinimum.filter((a) => !a.rules.qdmtt);

    if (qdmttJurisdictions.length > 0) {
      results.push(
        this.result('P2-JUR-ORDER-QDMTT')
          .info()
          .message(
            `${qdmttJurisdictions.length} jurisdiction(s) with QDMTT will collect top-up domestically: ` +
            `${qdmttJurisdictions.map((a) => a.jurisdiction).join(', ')}`
          )
          .build()
      );
    }

    if (nonQdmttJurisdictions.length > 0) {
      const upeRules = QUALIFIED_GLOBE_JURISDICTIONS[upeJurisdiction];
      const mechanism = upeRules?.iir ? 'IIR' : 'UTPR';

      results.push(
        this.result('P2-JUR-ORDER-IIR')
          .info()
          .message(
            `${nonQdmttJurisdictions.length} jurisdiction(s) without QDMTT - top-up via ${mechanism}: ` +
            `${nonQdmttJurisdictions.map((a) => a.jurisdiction).join(', ')}`
          )
          .suggestion(
            `Top-up tax for these jurisdictions will be charged via ${mechanism} at the UPE level (${upeJurisdiction})`
          )
          .build()
      );
    }

    return results;
  }
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export { QUALIFIED_GLOBE_JURISDICTIONS, LOW_TAX_JURISDICTIONS, MINIMUM_TAX_RATE };

/**
 * Check if a jurisdiction has qualified GloBE rules
 */
export function hasQualifiedGlobeRules(jurisdictionCode: string): boolean {
  return !!QUALIFIED_GLOBE_JURISDICTIONS[jurisdictionCode];
}

/**
 * Get qualified rules for a jurisdiction
 */
export function getQualifiedRules(jurisdictionCode: string) {
  return QUALIFIED_GLOBE_JURISDICTIONS[jurisdictionCode] ?? null;
}

/**
 * Check if jurisdiction is known low-tax
 */
export function isLowTaxJurisdiction(jurisdictionCode: string): boolean {
  return LOW_TAX_JURISDICTIONS.includes(jurisdictionCode);
}

