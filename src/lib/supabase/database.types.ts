/**
 * Supabase Database Types
 *
 * TypeScript types generated from the database schema.
 * These types provide type safety for all Supabase operations.
 *
 * @module lib/supabase/database.types
 */

// =============================================================================
// DATABASE TYPE DEFINITION
// =============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      validation_reports: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          file_size: number | null;
          file_hash: string | null;
          fiscal_year: string | null;
          upe_jurisdiction: string | null;
          upe_name: string | null;
          message_ref_id: string | null;
          jurisdiction_count: number;
          entity_count: number;
          status: 'pending' | 'in_progress' | 'completed' | 'failed';
          is_valid: boolean | null;
          summary_json: ValidationSummaryJson | null;
          duration_ms: number | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          file_size?: number | null;
          file_hash?: string | null;
          fiscal_year?: string | null;
          upe_jurisdiction?: string | null;
          upe_name?: string | null;
          message_ref_id?: string | null;
          jurisdiction_count?: number;
          entity_count?: number;
          status?: 'pending' | 'in_progress' | 'completed' | 'failed';
          is_valid?: boolean | null;
          summary_json?: ValidationSummaryJson | null;
          duration_ms?: number | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          filename?: string;
          file_size?: number | null;
          file_hash?: string | null;
          fiscal_year?: string | null;
          upe_jurisdiction?: string | null;
          upe_name?: string | null;
          message_ref_id?: string | null;
          jurisdiction_count?: number;
          entity_count?: number;
          status?: 'pending' | 'in_progress' | 'completed' | 'failed';
          is_valid?: boolean | null;
          summary_json?: ValidationSummaryJson | null;
          duration_ms?: number | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'validation_reports_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      validation_results: {
        Row: {
          id: string;
          report_id: string;
          rule_id: string;
          category: string;
          severity: 'critical' | 'error' | 'warning' | 'info';
          message: string;
          xpath: string | null;
          suggestion: string | null;
          reference: string | null;
          oecd_error_code: string | null;
          details_json: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          rule_id: string;
          category: string;
          severity: 'critical' | 'error' | 'warning' | 'info';
          message: string;
          xpath?: string | null;
          suggestion?: string | null;
          reference?: string | null;
          oecd_error_code?: string | null;
          details_json?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          rule_id?: string;
          category?: string;
          severity?: 'critical' | 'error' | 'warning' | 'info';
          message?: string;
          xpath?: string | null;
          suggestion?: string | null;
          reference?: string | null;
          oecd_error_code?: string | null;
          details_json?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'validation_results_report_id_fkey';
            columns: ['report_id'];
            referencedRelation: 'validation_reports';
            referencedColumns: ['id'];
          }
        ];
      };
      validation_rules: {
        Row: {
          id: string;
          rule_id: string;
          category: string;
          severity: 'critical' | 'error' | 'warning' | 'info';
          source: 'OECD' | 'COUNTRY' | 'PILLAR2' | 'QUALITY' | 'CUSTOM';
          jurisdiction: string | null;
          name: string;
          description: string;
          validation_logic: string | null;
          is_active: boolean;
          effective_from: string | null;
          effective_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          category: string;
          severity?: 'critical' | 'error' | 'warning' | 'info';
          source: 'OECD' | 'COUNTRY' | 'PILLAR2' | 'QUALITY' | 'CUSTOM';
          jurisdiction?: string | null;
          name: string;
          description: string;
          validation_logic?: string | null;
          is_active?: boolean;
          effective_from?: string | null;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rule_id?: string;
          category?: string;
          severity?: 'critical' | 'error' | 'warning' | 'info';
          source?: 'OECD' | 'COUNTRY' | 'PILLAR2' | 'QUALITY' | 'CUSTOM';
          jurisdiction?: string | null;
          name?: string;
          description?: string;
          validation_logic?: string | null;
          is_active?: boolean;
          effective_from?: string | null;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          default_country: string;
          default_fiscal_year_format: string;
          email_notifications: boolean;
          language: string;
          theme: 'light' | 'dark' | 'system';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          default_country?: string;
          default_fiscal_year_format?: string;
          email_notifications?: boolean;
          language?: string;
          theme?: 'light' | 'dark' | 'system';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          default_country?: string;
          default_fiscal_year_format?: string;
          email_notifications?: boolean;
          language?: string;
          theme?: 'light' | 'dark' | 'system';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      docrefid_registry: {
        Row: {
          id: string;
          doc_ref_id: string;
          report_id: string | null;
          user_id: string | null;
          message_ref_id: string | null;
          issuing_jurisdiction: string;
          reporting_period: string | null;
          doc_type_indic: string | null;
          is_superseded: boolean;
          superseded_by: string | null;
          xpath: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doc_ref_id: string;
          report_id?: string | null;
          user_id?: string | null;
          message_ref_id?: string | null;
          issuing_jurisdiction: string;
          reporting_period?: string | null;
          doc_type_indic?: string | null;
          is_superseded?: boolean;
          superseded_by?: string | null;
          xpath?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doc_ref_id?: string;
          report_id?: string | null;
          user_id?: string | null;
          message_ref_id?: string | null;
          issuing_jurisdiction?: string;
          reporting_period?: string | null;
          doc_type_indic?: string | null;
          is_superseded?: boolean;
          superseded_by?: string | null;
          xpath?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'docrefid_registry_report_id_fkey';
            columns: ['report_id'];
            referencedRelation: 'validation_reports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'docrefid_registry_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_validation_summary: {
        Args: {
          p_report_id: string;
        };
        Returns: ValidationSummaryJson;
      };
      get_user_validation_stats: {
        Args: {
          p_user_id: string;
        };
        Returns: UserValidationStats;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// =============================================================================
// ADDITIONAL TYPES
// =============================================================================

/**
 * Validation summary stored as JSON
 */
export interface ValidationSummaryJson {
  critical: number;
  error: number;
  warning: number;
  info: number;
  passed?: number;
  total: number;
}

/**
 * User validation statistics
 */
export interface UserValidationStats {
  total_reports: number;
  valid_reports: number;
  invalid_reports: number;
  pending_reports: number;
  last_validation: string | null;
}

// =============================================================================
// TABLE ROW TYPES (CONVENIENCE EXPORTS)
// =============================================================================

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type ValidationReport = Database['public']['Tables']['validation_reports']['Row'];
export type ValidationReportInsert = Database['public']['Tables']['validation_reports']['Insert'];
export type ValidationReportUpdate = Database['public']['Tables']['validation_reports']['Update'];

export type ValidationResultRow = Database['public']['Tables']['validation_results']['Row'];
export type ValidationResultInsert = Database['public']['Tables']['validation_results']['Insert'];
export type ValidationResultUpdate = Database['public']['Tables']['validation_results']['Update'];

export type ValidationRule = Database['public']['Tables']['validation_rules']['Row'];
export type ValidationRuleInsert = Database['public']['Tables']['validation_rules']['Insert'];
export type ValidationRuleUpdate = Database['public']['Tables']['validation_rules']['Update'];

export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

export type DocRefIdRegistry = Database['public']['Tables']['docrefid_registry']['Row'];
export type DocRefIdRegistryInsert = Database['public']['Tables']['docrefid_registry']['Insert'];
export type DocRefIdRegistryUpdate = Database['public']['Tables']['docrefid_registry']['Update'];

// =============================================================================
// QUERY RESULT TYPES
// =============================================================================

/**
 * Validation report with results count
 */
export interface ValidationReportWithCounts extends ValidationReport {
  results_count?: number;
  critical_count?: number;
  error_count?: number;
  warning_count?: number;
  info_count?: number;
}

/**
 * Validation report with full results
 */
export interface ValidationReportWithResults extends ValidationReport {
  validation_results: ValidationResultRow[];
}

/**
 * User profile with statistics
 */
export interface ProfileWithStats extends Profile {
  stats?: UserValidationStats;
}

