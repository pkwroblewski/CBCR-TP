/**
 * Supabase Module
 *
 * Central export point for all Supabase-related functionality.
 *
 * @module lib/supabase
 */

// =============================================================================
// CLIENT EXPORTS (Browser-safe)
// =============================================================================

export {
  createBrowserSupabaseClient,
} from './client';

// =============================================================================
// SERVER EXPORTS (Server-only)
// Note: These should only be imported in server components or API routes
// =============================================================================

export {
  createServerSupabaseClient,
  createServiceRoleClient,
  getUser,
  getSession,
  isAuthenticated,
  isAdmin,
} from './server';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  Database,
  ValidationSummaryJson,
  UserValidationStats,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  ValidationReport,
  ValidationReportInsert,
  ValidationReportUpdate,
  ValidationResultRow,
  ValidationResultInsert,
  ValidationResultUpdate,
  ValidationRule,
  ValidationRuleInsert,
  ValidationRuleUpdate,
  ValidationReportWithCounts,
  ValidationReportWithResults,
  ProfileWithStats,
} from './database.types';

// =============================================================================
// QUERY EXPORTS
// =============================================================================

export {
  // Types
  type QueryResult,
  type PaginationOptions,
  type ReportFilterOptions,
  // Report queries
  saveValidationReport,
  getReportById,
  getReportWithResults,
  getUserReports,
  getReportResults,
  updateReport,
  deleteReport,
  findReportByHash,
  // Rule queries
  getValidationRules,
  // Profile queries
  getCurrentProfile,
  updateProfile,
  getUserStats,
} from './queries';

// =============================================================================
// AUTH EXPORTS
// =============================================================================

export {
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  updateProfile as updateAuthProfile,
  onAuthStateChange,
  isValidEmail,
  isStrongPassword,
  getAuthErrorMessage,
  type AuthResult,
  type SignUpResult,
  type SignInResult,
  type SignUpData,
} from './auth';
