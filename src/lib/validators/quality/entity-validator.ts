/**
 * Entity Validator
 *
 * Validates constituent entity data quality including addresses,
 * TIN presence, naming conventions, and duplicate detection.
 *
 * @module lib/validators/quality/entity-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { ConstituentEntity, Address, TIN } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';
import { isValidCountryCode } from '@/constants/countries';

// =============================================================================
// CONSTANTS
// =============================================================================

/** NOTIN value for entities without TIN */
const NOTIN_VALUE = 'NOTIN';

/** Pattern for PE naming convention: "Entity Name – Jurisdiction PE" */
const PE_NAMING_PATTERN = /\s*[-–—]\s*[A-Z]{2}\s+PE\s*$/i;

/** Alternative PE patterns */
const PE_ALTERNATIVE_PATTERNS = [
  /\bPE\s*$/i,
  /\bPermanent\s+Establishment\b/i,
  /\bBranch\b/i,
];

/** Minimum address length for meaningful address */
const MIN_ADDRESS_LENGTH = 10;

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates constituent entity data quality
 */
export class EntityValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'quality-entity',
    name: 'Entity Validator',
    description: 'Validates entity addresses, TINs, naming, and duplicates',
    category: ValidationCategory.DATA_QUALITY,
    order: 70,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Track entities for duplicate detection
    const entitySignatures = new Map<string, { jurisdiction: string; index: number; name: string }>();

    // Validate each entity
    for (const [entity, entityIndex, report, reportIndex] of this.iterateEntities(ctx)) {
      const jurisdiction = report.resCountryCode;
      const entityPath = this.xpathEntity(reportIndex, entityIndex);
      const entityName = entity.name[0]?.value ?? 'Unknown';

      // Validate addresses
      results.push(...this.validateAddress(entity, entityPath, entityName, jurisdiction));

      // Validate TIN presence and NOTIN handling
      results.push(...this.validateTinPresence(entity, entityPath, entityName, jurisdiction));

      // Check PE naming convention
      results.push(...this.validatePeNaming(entity, entityPath, entityName, jurisdiction, report.resCountryCode));

      // Check for duplicates
      const signature = this.getEntitySignature(entity, jurisdiction);
      const existing = entitySignatures.get(signature);
      
      if (existing && existing.jurisdiction === jurisdiction) {
        results.push(
          this.result('ENT-004')
            .warning()
            .message(
              `Potential duplicate entity in ${jurisdiction}: "${entityName}" ` +
              `(similar to "${existing.name}" at index ${existing.index})`
            )
            .xpath(entityPath)
            .details({
              entity1: entityName,
              entity2: existing.name,
              jurisdiction,
            })
            .build()
        );
      } else {
        entitySignatures.set(signature, { jurisdiction, index: entityIndex, name: entityName });
      }
    }

    // Check for entities with same name across jurisdictions (group structure)
    results.push(...this.validateCrossJurisdictionEntities(ctx));

    return results;
  }

  /**
   * Validate entity address
   */
  private validateAddress(
    entity: ConstituentEntity,
    basePath: string,
    entityName: string,
    jurisdiction: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const addresses = entity.address ?? [];

    // Check if address is present
    if (addresses.length === 0) {
      results.push(
        this.result('ENT-001')
          .warning()
          .message(`Entity "${entityName}" in ${jurisdiction} has no address`)
          .xpath(`${basePath}/Address`)
          .build()
      );
      return results;
    }

    // Validate each address
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const addressPath = `${basePath}/Address[${i}]`;

      // Check country code
      if (this.isEmpty(address.countryCode)) {
        results.push(
          this.result('ENT-001')
            .warning()
            .message(`Entity "${entityName}": Address missing country code`)
            .xpath(`${addressPath}/CountryCode`)
            .build()
        );
      } else if (!isValidCountryCode(address.countryCode)) {
        results.push(
          this.result('CC-003')
            .error()
            .message(`Entity "${entityName}": Invalid address country code: ${address.countryCode}`)
            .xpath(`${addressPath}/CountryCode`)
            .build()
        );
      }

      // Check if address has content
      if (address.addressFix) {
        // Structured address - check for city at minimum
        if (this.isEmpty(address.addressFix.city)) {
          results.push(
            this.result('ENT-001')
              .warning()
              .message(`Entity "${entityName}": Address missing city`)
              .xpath(`${addressPath}/AddressFix/City`)
              .build()
          );
        }
      } else if (address.addressFree) {
        // Free-form address - check minimum length
        const addressText = address.addressFree.value ?? '';
        if (addressText.length < MIN_ADDRESS_LENGTH) {
          results.push(
            this.result('ENT-001')
              .warning()
              .message(`Entity "${entityName}": Address appears incomplete (${addressText.length} characters)`)
              .xpath(`${addressPath}/AddressFree`)
              .build()
          );
        }
      } else {
        // No address content
        results.push(
          this.result('ENT-001')
            .warning()
            .message(`Entity "${entityName}": Address element present but no content`)
            .xpath(addressPath)
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Validate TIN presence and NOTIN handling
   */
  private validateTinPresence(
    entity: ConstituentEntity,
    basePath: string,
    entityName: string,
    jurisdiction: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const tins = entity.tin ?? [];
    const otherInfo = entity.otherEntityInfo ?? '';

    if (tins.length === 0) {
      // No TIN at all
      results.push(
        this.result('ENT-002')
          .info()
          .message(`Entity "${entityName}" in ${jurisdiction} has no TIN`)
          .xpath(`${basePath}/TIN`)
          .suggestion('Provide TIN or use NOTIN with explanation in OtherEntityInfo')
          .build()
      );
      return results;
    }

    // Check for NOTIN
    const hasNotin = tins.some((t) => t.value?.toUpperCase() === NOTIN_VALUE);

    if (hasNotin) {
      // NOTIN present - check for explanation
      if (this.isEmpty(otherInfo)) {
        results.push(
          this.result('ENT-002')
            .warning()
            .message(
              `Entity "${entityName}" in ${jurisdiction} uses NOTIN but has no explanation in OtherEntityInfo`
            )
            .xpath(`${basePath}/TIN`)
            .suggestion('Provide reason for unavailable TIN in OtherEntityInfo element')
            .build()
        );
      } else {
        // Check if explanation mentions TIN/NOTIN
        const mentionsTin = /\b(TIN|tax\s+identification|no\s+tin|not\s+issued|not\s+available)/i.test(otherInfo);
        if (!mentionsTin) {
          results.push(
            this.result('ENT-002')
              .info()
              .message(
                `Entity "${entityName}" uses NOTIN - consider ensuring OtherEntityInfo explains the reason`
              )
              .xpath(`${basePath}/OtherEntityInfo`)
              .build()
          );
        }
      }

      // Check if NOTIN is the only TIN (shouldn't be mixed with real TINs)
      if (tins.length > 1) {
        const realTins = tins.filter((t) => t.value?.toUpperCase() !== NOTIN_VALUE);
        if (realTins.length > 0) {
          results.push(
            this.result('ENT-002')
              .warning()
              .message(
                `Entity "${entityName}" has both NOTIN and actual TIN values - use one or the other`
              )
              .xpath(`${basePath}/TIN`)
              .build()
          );
        }
      }
    }

    return results;
  }

  /**
   * Validate PE naming convention
   */
  private validatePeNaming(
    entity: ConstituentEntity,
    basePath: string,
    entityName: string,
    reportJurisdiction: string,
    entityJurisdiction: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check if entity appears to be a PE based on naming
    const looksLikePe = PE_ALTERNATIVE_PATTERNS.some((p) => p.test(entityName));

    if (looksLikePe) {
      // Check if it follows the recommended format
      if (!PE_NAMING_PATTERN.test(entityName)) {
        results.push(
          this.result('ENT-003')
            .info()
            .message(
              `Entity "${entityName}" appears to be a PE but doesn't follow recommended naming convention`
            )
            .xpath(`${basePath}/Name`)
            .suggestion('Consider format: "Parent Entity Name – XX PE" where XX is the PE jurisdiction code')
            .build()
        );
      }
    }

    // Check if incorporation country differs (might be a PE)
    const incorpCountry = entity.incorpCountryCode;
    if (incorpCountry && incorpCountry !== reportJurisdiction) {
      // Entity incorporated elsewhere but reported in this jurisdiction
      if (!looksLikePe) {
        results.push(
          this.result('ENT-003')
            .info()
            .message(
              `Entity "${entityName}" incorporated in ${incorpCountry} but reported in ${reportJurisdiction} - ` +
              `may be a PE`
            )
            .xpath(`${basePath}/IncorpCountryCode`)
            .suggestion('If this is a PE, consider indicating in entity name')
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Generate a signature for duplicate detection
   */
  private getEntitySignature(entity: ConstituentEntity, jurisdiction: string): string {
    const name = entity.name[0]?.value?.toLowerCase().trim() ?? '';
    const tin = entity.tin?.[0]?.value?.toLowerCase() ?? '';
    
    // Normalize name (remove common suffixes, whitespace)
    const normalizedName = name
      .replace(/\s+(ltd|limited|inc|incorporated|corp|corporation|llc|gmbh|sa|bv|nv)\.?$/i, '')
      .replace(/\s+/g, ' ');

    return `${jurisdiction}:${normalizedName}:${tin}`;
  }

  /**
   * Validate entities across jurisdictions
   */
  private validateCrossJurisdictionEntities(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const entities = ctx.getEntityReferences();

    // Group entities by normalized name
    const entityGroups = new Map<string, typeof entities>();
    
    for (const entity of entities) {
      const normalizedName = entity.name.toLowerCase().replace(/\s+/g, ' ').trim();
      const existing = entityGroups.get(normalizedName) ?? [];
      existing.push(entity);
      entityGroups.set(normalizedName, existing);
    }

    // Check for entities in multiple jurisdictions (subsidiaries vs PEs)
    for (const [name, group] of entityGroups) {
      if (group.length > 1) {
        const jurisdictions = [...new Set(group.map((e) => e.jurisdiction))];
        
        if (jurisdictions.length > 1) {
          // Same entity name in multiple jurisdictions
          results.push(
            this.result('ENT-004')
              .info()
              .message(
                `Entity "${group[0].name}" appears in ${jurisdictions.length} jurisdictions: ${jurisdictions.join(', ')}`
              )
              .suggestion('Verify these are distinct legal entities or properly reported PEs')
              .build()
          );
        }
      }
    }

    return results;
  }
}

