/**
 * DocRefId Service
 *
 * Provides global DocRefId uniqueness checking across all CbCR submissions.
 *
 * Per OECD CbCR requirements, DocRefIds must be globally unique across all
 * submissions from a jurisdiction for the lifetime of CbC reporting.
 *
 * @module lib/services/docrefid-service
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of DocRefId existence check
 */
export interface DocRefIdCheckResult {
  /** Whether the DocRefId already exists */
  exists: boolean;
  /** Jurisdiction that first registered this DocRefId */
  issuingJurisdiction?: string;
  /** Reporting period when first registered */
  reportingPeriod?: string;
  /** Whether it has been superseded by a correction */
  isSuperseded?: boolean;
  /** When the DocRefId was first registered */
  createdAt?: string;
}

/**
 * DocRefId registration data
 */
export interface DocRefIdRegistration {
  docRefId: string;
  reportId?: string;
  userId?: string;
  messageRefId?: string;
  issuingJurisdiction: string;
  reportingPeriod?: string;
  docTypeIndic?: string;
  xpath?: string;
}

/**
 * Batch check result
 */
export interface BatchCheckResult {
  /** DocRefIds that already exist */
  duplicates: Array<{
    docRefId: string;
    existingRecord: DocRefIdCheckResult;
  }>;
  /** DocRefIds that are unique */
  unique: string[];
  /** Whether all DocRefIds are unique */
  allUnique: boolean;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

/**
 * Service for managing global DocRefId uniqueness
 */
export class DocRefIdService {
  /**
   * Check if a single DocRefId already exists
   *
   * @param docRefId - The DocRefId to check
   * @returns Check result with existence and details
   */
  static async checkExists(docRefId: string): Promise<DocRefIdCheckResult> {
    try {
      const supabase = await createServerSupabaseClient();

      const { data, error } = await supabase
        .from('docrefid_registry')
        .select('doc_ref_id, issuing_jurisdiction, reporting_period, is_superseded, created_at')
        .eq('doc_ref_id', docRefId)
        .maybeSingle();

      if (error) {
        console.error('Error checking DocRefId:', error);
        // In case of error, assume it doesn't exist to allow validation to continue
        return { exists: false };
      }

      if (!data) {
        return { exists: false };
      }

      return {
        exists: true,
        issuingJurisdiction: data.issuing_jurisdiction,
        reportingPeriod: data.reporting_period ?? undefined,
        isSuperseded: data.is_superseded,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error('Error in DocRefIdService.checkExists:', err);
      return { exists: false };
    }
  }

  /**
   * Check multiple DocRefIds for uniqueness
   *
   * @param docRefIds - Array of DocRefIds to check
   * @returns Batch check result with duplicates and unique IDs
   */
  static async batchCheck(docRefIds: string[]): Promise<BatchCheckResult> {
    const duplicates: BatchCheckResult['duplicates'] = [];
    const unique: string[] = [];

    try {
      const supabase = await createServerSupabaseClient();

      // Query all DocRefIds at once
      const { data: existingRecords, error } = await supabase
        .from('docrefid_registry')
        .select('doc_ref_id, issuing_jurisdiction, reporting_period, is_superseded, created_at')
        .in('doc_ref_id', docRefIds);

      if (error) {
        console.error('Error batch checking DocRefIds:', error);
        // In case of error, assume all are unique
        return {
          duplicates: [],
          unique: docRefIds,
          allUnique: true,
        };
      }

      // Build a map for quick lookup
      const existingMap = new Map<string, DocRefIdCheckResult>();
      for (const record of existingRecords || []) {
        existingMap.set(record.doc_ref_id, {
          exists: true,
          issuingJurisdiction: record.issuing_jurisdiction,
          reportingPeriod: record.reporting_period ?? undefined,
          isSuperseded: record.is_superseded,
          createdAt: record.created_at,
        });
      }

      // Check each DocRefId
      for (const docRefId of docRefIds) {
        const existingRecord = existingMap.get(docRefId);
        if (existingRecord) {
          duplicates.push({ docRefId, existingRecord });
        } else {
          unique.push(docRefId);
        }
      }

      return {
        duplicates,
        unique,
        allUnique: duplicates.length === 0,
      };
    } catch (err) {
      console.error('Error in DocRefIdService.batchCheck:', err);
      return {
        duplicates: [],
        unique: docRefIds,
        allUnique: true,
      };
    }
  }

  /**
   * Register a new DocRefId in the global registry
   *
   * @param registration - Registration data
   * @returns true if registered, false if already exists
   */
  static async register(registration: DocRefIdRegistration): Promise<boolean> {
    try {
      const supabase = await createServerSupabaseClient();

      const { error } = await supabase
        .from('docrefid_registry')
        .insert({
          doc_ref_id: registration.docRefId,
          report_id: registration.reportId || null,
          user_id: registration.userId || null,
          message_ref_id: registration.messageRefId || null,
          issuing_jurisdiction: registration.issuingJurisdiction,
          reporting_period: registration.reportingPeriod || null,
          doc_type_indic: registration.docTypeIndic || null,
          xpath: registration.xpath || null,
        });

      if (error) {
        // Check if it's a unique constraint violation (already exists)
        if (error.code === '23505') {
          return false; // Already exists
        }
        console.error('Error registering DocRefId:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in DocRefIdService.register:', err);
      return false;
    }
  }

  /**
   * Register multiple DocRefIds in batch
   *
   * @param registrations - Array of registration data
   * @returns Number of successfully registered DocRefIds
   */
  static async batchRegister(
    registrations: DocRefIdRegistration[]
  ): Promise<{ registered: number; failed: string[] }> {
    const failed: string[] = [];
    let registered = 0;

    try {
      const supabase = await createServerSupabaseClient();

      // Prepare batch insert data
      const insertData = registrations.map((reg) => ({
        doc_ref_id: reg.docRefId,
        report_id: reg.reportId || null,
        user_id: reg.userId || null,
        message_ref_id: reg.messageRefId || null,
        issuing_jurisdiction: reg.issuingJurisdiction,
        reporting_period: reg.reportingPeriod || null,
        doc_type_indic: reg.docTypeIndic || null,
        xpath: reg.xpath || null,
      }));

      // Use upsert with on conflict do nothing
      const { error } = await supabase
        .from('docrefid_registry')
        .upsert(insertData, {
          onConflict: 'doc_ref_id',
          ignoreDuplicates: true,
        });

      if (error) {
        console.error('Error batch registering DocRefIds:', error);
        // All failed
        return {
          registered: 0,
          failed: registrations.map((r) => r.docRefId),
        };
      }

      // All succeeded (duplicates were ignored)
      registered = registrations.length;
      return { registered, failed };
    } catch (err) {
      console.error('Error in DocRefIdService.batchRegister:', err);
      return {
        registered: 0,
        failed: registrations.map((r) => r.docRefId),
      };
    }
  }

  /**
   * Mark a DocRefId as superseded by a correction
   *
   * @param originalDocRefId - The original DocRefId being corrected
   * @param correctingDocRefId - The DocRefId of the correction
   * @returns true if updated, false if not found
   */
  static async markSuperseded(
    originalDocRefId: string,
    correctingDocRefId: string
  ): Promise<boolean> {
    try {
      const supabase = await createServerSupabaseClient();

      const { data, error } = await supabase
        .from('docrefid_registry')
        .update({
          is_superseded: true,
          superseded_by: correctingDocRefId,
        })
        .eq('doc_ref_id', originalDocRefId)
        .eq('is_superseded', false)
        .select('id');

      if (error) {
        console.error('Error marking DocRefId as superseded:', error);
        return false;
      }

      // Return true if at least one row was updated
      return data !== null && data.length > 0;
    } catch (err) {
      console.error('Error in DocRefIdService.markSuperseded:', err);
      return false;
    }
  }
}

// =============================================================================
// CLIENT-SIDE UTILITIES
// =============================================================================

/**
 * Check DocRefId uniqueness via API (for client-side use)
 *
 * @param docRefId - The DocRefId to check
 * @returns Check result
 */
export async function checkDocRefIdUniqueness(
  docRefId: string
): Promise<DocRefIdCheckResult> {
  try {
    const response = await fetch('/api/docrefid/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docRefId }),
    });

    if (!response.ok) {
      throw new Error('Failed to check DocRefId');
    }

    return await response.json();
  } catch (err) {
    console.error('Error checking DocRefId uniqueness:', err);
    return { exists: false };
  }
}
