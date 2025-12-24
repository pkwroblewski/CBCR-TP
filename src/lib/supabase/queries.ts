/**
 * Supabase Database Queries
 *
 * Provides typed query functions for common database operations.
 * All functions use the appropriate Supabase client based on context.
 *
 * @module lib/supabase/queries
 */

import { createServerSupabaseClient, createServiceRoleClient } from './server';
import type {
  Database,
  ValidationReport,
  ValidationReportInsert,
  ValidationReportUpdate,
  ValidationReportWithResults,
  ValidationReportWithCounts,
  ValidationResultRow,
  ValidationResultInsert,
  ValidationRule,
  Profile,
  ProfileUpdate,
  ValidationSummaryJson,
} from './database.types';
import type { ValidationReport as AppValidationReport, ValidationResult } from '@/types/validation';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Query result with optional error
 */
export interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Filter options for reports
 */
export interface ReportFilterOptions extends PaginationOptions {
  status?: ValidationReport['status'];
  fiscalYear?: string;
  isValid?: boolean;
}

// =============================================================================
// VALIDATION REPORTS
// =============================================================================

/**
 * Save a validation report and its results to the database
 *
 * @param report - The validation report from the validation engine
 * @param userId - The user ID who owns this report
 * @param filename - Original filename
 * @param fileHash - SHA-256 hash of the file (optional)
 * @returns The created report ID or error
 */
export async function saveValidationReport(
  report: AppValidationReport,
  userId: string,
  filename: string,
  fileHash?: string
): Promise<QueryResult<string>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Create the report record
    const reportData: ValidationReportInsert = {
      user_id: userId,
      filename,
      file_size: report.fileSize,
      file_hash: fileHash,
      fiscal_year: report.fiscalYear,
      upe_jurisdiction: report.upeJurisdiction,
      upe_name: report.upeName,
      message_ref_id: report.messageRefId,
      jurisdiction_count: report.jurisdictionCount,
      entity_count: report.entityCount,
      status: 'completed',
      is_valid: report.isValid,
      summary_json: {
        critical: report.summary.critical,
        error: report.summary.errors,
        warning: report.summary.warnings,
        info: report.summary.info,
        passed: report.summary.passed,
        total: report.summary.total,
      },
      duration_ms: report.durationMs,
    };

    const { data: insertedReport, error: reportError } = await supabase
      .from('validation_reports')
      .insert(reportData)
      .select('id')
      .single();

    if (reportError) {
      return { data: null, error: reportError.message };
    }

    if (!insertedReport) {
      return { data: null, error: 'Failed to create report' };
    }

    // Insert validation results in batches
    if (report.results.length > 0) {
      const resultRecords: ValidationResultInsert[] = report.results.map((result) => ({
        report_id: insertedReport.id,
        rule_id: result.ruleId,
        category: result.category as string,
        severity: result.severity as 'critical' | 'error' | 'warning' | 'info',
        message: result.message,
        xpath: result.xpath ?? null,
        suggestion: result.suggestion ?? null,
        reference: result.reference ?? null,
        oecd_error_code: result.oecdErrorCode ? String(result.oecdErrorCode) : null,
        details_json: result.details ?? null,
      }));

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < resultRecords.length; i += batchSize) {
        const batch = resultRecords.slice(i, i + batchSize);
        const { error: resultsError } = await supabase
          .from('validation_results')
          .insert(batch);

        if (resultsError) {
          // Log error but don't fail the whole operation
          console.error('Error inserting results batch:', resultsError);
        }
      }
    }

    return { data: insertedReport.id, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get a validation report by ID
 *
 * @param reportId - The report UUID
 * @returns The report or null if not found
 */
export async function getReportById(
  reportId: string
): Promise<QueryResult<ValidationReport>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('validation_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get a validation report with all its results
 *
 * @param reportId - The report UUID
 * @returns The report with results
 */
export async function getReportWithResults(
  reportId: string
): Promise<QueryResult<ValidationReportWithResults>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('validation_reports')
      .select(`
        *,
        validation_results (*)
      `)
      .eq('id', reportId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ValidationReportWithResults, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get all reports for the current user
 *
 * @param options - Filter and pagination options
 * @returns Array of reports
 */
export async function getUserReports(
  options: ReportFilterOptions = {}
): Promise<QueryResult<ValidationReportWithCounts[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { page = 1, pageSize = 10, status, fiscalYear, isValid } = options;

    let query = supabase
      .from('validation_reports')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (fiscalYear) {
      query = query.eq('fiscal_year', fiscalYear);
    }
    if (isValid !== undefined) {
      query = query.eq('is_valid', isValid);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ValidationReportWithCounts[], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get validation results for a report
 *
 * @param reportId - The report UUID
 * @param options - Filter options (severity, category)
 * @returns Array of validation results
 */
export async function getReportResults(
  reportId: string,
  options: {
    severity?: ValidationResultRow['severity'];
    category?: string;
    limit?: number;
  } = {}
): Promise<QueryResult<ValidationResultRow[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { severity, category, limit = 1000 } = options;

    let query = supabase
      .from('validation_results')
      .select('*')
      .eq('report_id', reportId)
      .order('severity', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Update a validation report status
 *
 * @param reportId - The report UUID
 * @param update - Fields to update
 * @returns Success or error
 */
export async function updateReport(
  reportId: string,
  update: ValidationReportUpdate
): Promise<QueryResult<ValidationReport>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('validation_reports')
      .update(update)
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Delete a validation report and all its results
 *
 * @param reportId - The report UUID
 * @returns Success or error
 */
export async function deleteReport(reportId: string): Promise<QueryResult<boolean>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Results will be cascade deleted due to FK constraint
    const { error } = await supabase
      .from('validation_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Check if a file has already been validated (by hash)
 *
 * @param fileHash - SHA-256 hash of the file
 * @returns The existing report ID if found
 */
export async function findReportByHash(
  fileHash: string
): Promise<QueryResult<string | null>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('validation_reports')
      .select('id')
      .eq('file_hash', fileHash)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return { data: null, error: error.message };
    }

    return { data: data?.id ?? null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

// =============================================================================
// VALIDATION RULES
// =============================================================================

/**
 * Get all active validation rules
 *
 * @param options - Filter options
 * @returns Array of validation rules
 */
export async function getValidationRules(
  options: {
    source?: ValidationRule['source'];
    category?: string;
    jurisdiction?: string;
    activeOnly?: boolean;
  } = {}
): Promise<QueryResult<ValidationRule[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { source, category, jurisdiction, activeOnly = true } = options;

    let query = supabase
      .from('validation_rules')
      .select('*')
      .order('category')
      .order('rule_id');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    if (source) {
      query = query.eq('source', source);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (jurisdiction) {
      query = query.or(`jurisdiction.eq.${jurisdiction},jurisdiction.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

// =============================================================================
// USER PROFILE
// =============================================================================

/**
 * Get the current user's profile
 *
 * @returns The user profile
 */
export async function getCurrentProfile(): Promise<QueryResult<Profile>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Update the current user's profile
 *
 * @param update - Fields to update
 * @returns Updated profile
 */
export async function updateProfile(
  update: ProfileUpdate
): Promise<QueryResult<Profile>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get user validation statistics
 *
 * @returns User statistics
 */
export async function getUserStats(): Promise<QueryResult<{
  totalReports: number;
  validReports: number;
  invalidReports: number;
  lastValidation: string | null;
}>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase.rpc('get_user_validation_stats', {
      p_user_id: user.id,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        totalReports: data.total_reports,
        validReports: data.valid_reports,
        invalidReports: data.invalid_reports,
        lastValidation: data.last_validation,
      },
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message };
  }
}

