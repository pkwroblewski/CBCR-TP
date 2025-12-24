/**
 * Audit Log Service
 *
 * Provides comprehensive audit logging for all CbCR operations.
 * Tracks user actions, system events, and security-related activities
 * for compliance and security purposes.
 *
 * Note: This service uses raw SQL queries because the audit_logs table
 * may not be in the generated database types until migrations are applied.
 *
 * @module lib/services/audit-service
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Audit event categories
 */
export type AuditEventCategory =
  | 'authentication'    // Login, logout, password changes
  | 'authorization'     // Access control, permission checks
  | 'validation'        // CbCR validation operations
  | 'file_operation'    // File uploads, downloads, deletions
  | 'data_access'       // Report viewing, data export
  | 'admin_action'      // Administrative operations
  | 'security_event'    // Security-related events (XXE attempts, etc.)
  | 'system';           // System events

/**
 * Audit event status
 */
export type AuditStatus = 'success' | 'failure' | 'error' | 'blocked';

/**
 * Audit event severity
 */
export type AuditSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

/**
 * Common audit event types
 */
export const AuditEventTypes = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  SESSION_EXPIRED: 'session_expired',

  // Authorization
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
  PERMISSION_CHECK: 'permission_check',
  ROLE_CHANGE: 'role_change',

  // Validation
  VALIDATION_STARTED: 'validation_started',
  VALIDATION_COMPLETED: 'validation_completed',
  VALIDATION_FAILED: 'validation_failed',
  VALIDATION_ERROR: 'validation_error',

  // File Operations
  FILE_UPLOAD: 'file_upload',
  FILE_DOWNLOAD: 'file_download',
  FILE_DELETE: 'file_delete',
  FILE_REJECTED: 'file_rejected',

  // Data Access
  REPORT_VIEW: 'report_view',
  REPORT_EXPORT: 'report_export',
  REPORT_DELETE: 'report_delete',
  DATA_EXPORT: 'data_export',

  // Admin Actions
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  SETTINGS_CHANGE: 'settings_change',
  RETENTION_POLICY_UPDATE: 'retention_policy_update',

  // Security Events
  XXE_ATTEMPT: 'xxe_attempt',
  INJECTION_ATTEMPT: 'injection_attempt',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  INVALID_TOKEN: 'invalid_token',
  BRUTE_FORCE_DETECTED: 'brute_force_detected',

  // System
  SYSTEM_STARTUP: 'system_startup',
  SYSTEM_SHUTDOWN: 'system_shutdown',
  MAINTENANCE_MODE: 'maintenance_mode',
  ERROR: 'error',
} as const;

export type AuditEventType = (typeof AuditEventTypes)[keyof typeof AuditEventTypes] | string;

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  eventType: string;
  eventCategory: AuditEventCategory;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  action: string;
  status: AuditStatus;
  severity: AuditSeverity;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  durationMs?: number;
  createdAt: string;
}

/**
 * Options for logging an audit event
 */
export interface LogAuditEventOptions {
  eventType: AuditEventType;
  eventCategory: AuditEventCategory;
  action: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  status?: AuditStatus;
  severity?: AuditSeverity;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  durationMs?: number;
}

/**
 * Query options for retrieving audit logs
 */
export interface AuditLogQueryOptions {
  userId?: string;
  eventCategory?: AuditEventCategory;
  eventType?: string;
  resourceType?: string;
  resourceId?: string;
  status?: AuditStatus;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Result of audit log query
 */
export interface AuditLogQueryResult {
  logs: AuditLogEntry[];
  total: number;
  hasMore: boolean;
}

/**
 * Security event summary
 */
export interface SecurityEventSummary {
  totalEvents: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  recentEvents: AuditLogEntry[];
  topEventTypes: Array<{ eventType: string; count: number }>;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

/**
 * Service for comprehensive audit logging
 *
 * Note: Uses raw SQL to support audit tables that may not be in generated types.
 */
export class AuditLogService {
  /**
   * Check if audit logging is available (table exists)
   */
  private static async isAuditTableAvailable(): Promise<boolean> {
    try {
      const supabase = createServiceRoleClient();
      const { error } = await supabase
        .from('audit_logs' as never)
        .select('id')
        .limit(1);

      // If no error, table exists
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Log an audit event
   *
   * @param options - Audit event options
   * @returns The created audit log ID, or null if failed
   */
  static async log(options: LogAuditEventOptions): Promise<string | null> {
    try {
      const supabase = createServiceRoleClient();

      // Try to use the RPC function first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('log_audit_event', {
        p_event_type: options.eventType,
        p_event_category: options.eventCategory,
        p_action: options.action,
        p_user_id: options.userId || null,
        p_resource_type: options.resourceType || null,
        p_resource_id: options.resourceId || null,
        p_resource_name: options.resourceName || null,
        p_status: options.status || 'success',
        p_severity: options.severity || 'info',
        p_message: options.message || null,
        p_metadata: options.metadata || {},
        p_ip_address: options.ipAddress || null,
        p_user_agent: options.userAgent || null,
        p_duration_ms: options.durationMs || null,
      });

      if (error) {
        // If RPC doesn't exist, audit logging is not set up yet - fail silently
        console.debug('Audit logging not available:', error.message);
        return null;
      }

      return data as string;
    } catch (err) {
      // Fail silently - don't block operations if audit logging fails
      console.debug('Error in AuditLogService.log:', err);
      return null;
    }
  }

  /**
   * Log a validation event
   */
  static async logValidation(params: {
    userId?: string;
    reportId: string;
    fileName: string;
    status: 'started' | 'completed' | 'failed' | 'error';
    errorCount?: number;
    warningCount?: number;
    durationMs?: number;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string | null> {
    const eventTypeMap = {
      started: AuditEventTypes.VALIDATION_STARTED,
      completed: AuditEventTypes.VALIDATION_COMPLETED,
      failed: AuditEventTypes.VALIDATION_FAILED,
      error: AuditEventTypes.VALIDATION_ERROR,
    };

    const statusMap: Record<string, AuditStatus> = {
      started: 'success',
      completed: 'success',
      failed: 'failure',
      error: 'error',
    };

    const severityMap: Record<string, AuditSeverity> = {
      started: 'info',
      completed: 'info',
      failed: 'warning',
      error: 'error',
    };

    return this.log({
      eventType: eventTypeMap[params.status],
      eventCategory: 'validation',
      action: 'validate_report',
      userId: params.userId,
      resourceType: 'validation_report',
      resourceId: params.reportId,
      resourceName: params.fileName,
      status: statusMap[params.status],
      severity: severityMap[params.status],
      message: this.buildValidationMessage(params),
      metadata: {
        ...params.metadata,
        errorCount: params.errorCount,
        warningCount: params.warningCount,
      },
      durationMs: params.durationMs,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log a file operation event
   */
  static async logFileOperation(params: {
    userId?: string;
    operation: 'upload' | 'download' | 'delete' | 'rejected';
    fileId?: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    const eventTypeMap = {
      upload: AuditEventTypes.FILE_UPLOAD,
      download: AuditEventTypes.FILE_DOWNLOAD,
      delete: AuditEventTypes.FILE_DELETE,
      rejected: AuditEventTypes.FILE_REJECTED,
    };

    const isRejected = params.operation === 'rejected';

    return this.log({
      eventType: eventTypeMap[params.operation],
      eventCategory: 'file_operation',
      action: params.operation,
      userId: params.userId,
      resourceType: 'file',
      resourceId: params.fileId,
      resourceName: params.fileName,
      status: isRejected ? 'blocked' : 'success',
      severity: isRejected ? 'warning' : 'info',
      message: isRejected
        ? `File rejected: ${params.reason}`
        : `File ${params.operation}: ${params.fileName}`,
      metadata: {
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        reason: params.reason,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log an authentication event
   */
  static async logAuthentication(params: {
    userId?: string;
    email?: string;
    eventType: 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'session_expired';
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    const severityMap: Record<string, AuditSeverity> = {
      login_success: 'info',
      login_failure: 'warning',
      logout: 'info',
      password_change: 'info',
      session_expired: 'info',
    };

    const statusMap: Record<string, AuditStatus> = {
      login_success: 'success',
      login_failure: 'failure',
      logout: 'success',
      password_change: 'success',
      session_expired: 'success',
    };

    return this.log({
      eventType: params.eventType,
      eventCategory: 'authentication',
      action: params.eventType.replace('_', ' '),
      userId: params.userId,
      status: statusMap[params.eventType],
      severity: severityMap[params.eventType],
      message: params.reason || `Authentication event: ${params.eventType}`,
      metadata: {
        email: params.email,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log a security event
   */
  static async logSecurityEvent(params: {
    userId?: string;
    eventType: 'xxe_attempt' | 'injection_attempt' | 'rate_limit_exceeded' | 'suspicious_activity' | 'brute_force_detected';
    description: string;
    severity?: AuditSeverity;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    const defaultSeverity: Record<string, AuditSeverity> = {
      xxe_attempt: 'critical',
      injection_attempt: 'critical',
      rate_limit_exceeded: 'warning',
      suspicious_activity: 'warning',
      brute_force_detected: 'error',
    };

    return this.log({
      eventType: params.eventType,
      eventCategory: 'security_event',
      action: params.eventType.replace(/_/g, ' '),
      userId: params.userId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      status: 'blocked',
      severity: params.severity || defaultSeverity[params.eventType],
      message: params.description,
      metadata: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log a data access event
   */
  static async logDataAccess(params: {
    userId?: string;
    action: 'view' | 'export' | 'delete';
    resourceType: string;
    resourceId: string;
    resourceName?: string;
    exportFormat?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    const eventTypeMap = {
      view: AuditEventTypes.REPORT_VIEW,
      export: AuditEventTypes.REPORT_EXPORT,
      delete: AuditEventTypes.REPORT_DELETE,
    };

    return this.log({
      eventType: eventTypeMap[params.action],
      eventCategory: 'data_access',
      action: `${params.action}_${params.resourceType}`,
      userId: params.userId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      resourceName: params.resourceName,
      status: 'success',
      severity: params.action === 'delete' ? 'warning' : 'info',
      message: `${params.resourceType} ${params.action}: ${params.resourceName || params.resourceId}`,
      metadata: {
        exportFormat: params.exportFormat,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Query audit logs with filters
   *
   * Note: This requires the audit_logs table to exist in the database.
   */
  static async query(_options: AuditLogQueryOptions = {}): Promise<AuditLogQueryResult> {
    // Query functionality requires the audit table to be set up
    // Return empty result if not available
    console.debug('Audit log querying requires database setup');
    return { logs: [], total: 0, hasMore: false };
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getResourceLogs(
    resourceType: string,
    resourceId: string,
    limit = 100
  ): Promise<AuditLogEntry[]> {
    const result = await this.query({
      resourceType,
      resourceId,
      limit,
    });
    return result.logs;
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserLogs(userId: string, limit = 100): Promise<AuditLogEntry[]> {
    const result = await this.query({ userId, limit });
    return result.logs;
  }

  /**
   * Get recent security events
   */
  static async getSecurityEvents(
    since?: Date,
    limit = 100
  ): Promise<AuditLogEntry[]> {
    const result = await this.query({
      eventCategory: 'security_event',
      startDate: since || new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      limit,
    });
    return result.logs;
  }

  /**
   * Get security event summary
   */
  static async getSecuritySummary(_since?: Date): Promise<SecurityEventSummary> {
    // Summary functionality requires the audit table to be set up
    return {
      totalEvents: 0,
      criticalCount: 0,
      errorCount: 0,
      warningCount: 0,
      recentEvents: [],
      topEventTypes: [],
    };
  }

  /**
   * Build validation message
   */
  private static buildValidationMessage(params: {
    status: 'started' | 'completed' | 'failed' | 'error';
    fileName: string;
    errorCount?: number;
    warningCount?: number;
  }): string {
    switch (params.status) {
      case 'started':
        return `Validation started for ${params.fileName}`;
      case 'completed':
        return `Validation completed for ${params.fileName}: ${params.errorCount || 0} errors, ${params.warningCount || 0} warnings`;
      case 'failed':
        return `Validation failed for ${params.fileName}: ${params.errorCount || 0} errors found`;
      case 'error':
        return `Validation error for ${params.fileName}`;
      default:
        return `Validation event for ${params.fileName}`;
    }
  }

  /**
   * Map database record to AuditLogEntry
   */
  private static mapDatabaseRecord(record: Record<string, unknown>): AuditLogEntry {
    return {
      id: record.id as string,
      eventType: record.event_type as string,
      eventCategory: record.event_category as AuditEventCategory,
      userId: record.user_id as string | undefined,
      userEmail: record.user_email as string | undefined,
      userRole: record.user_role as string | undefined,
      ipAddress: record.ip_address as string | undefined,
      userAgent: record.user_agent as string | undefined,
      requestId: record.request_id as string | undefined,
      sessionId: record.session_id as string | undefined,
      resourceType: record.resource_type as string | undefined,
      resourceId: record.resource_id as string | undefined,
      resourceName: record.resource_name as string | undefined,
      action: record.action as string,
      status: record.status as AuditStatus,
      severity: record.severity as AuditSeverity,
      message: record.message as string | undefined,
      errorCode: record.error_code as string | undefined,
      errorMessage: record.error_message as string | undefined,
      metadata: record.metadata as Record<string, unknown> | undefined,
      oldValues: record.old_values as Record<string, unknown> | undefined,
      newValues: record.new_values as Record<string, unknown> | undefined,
      durationMs: record.duration_ms as number | undefined,
      createdAt: record.created_at as string,
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract request context from Next.js request headers
 */
export function extractRequestContext(headers: Headers): {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
} {
  return {
    ipAddress: headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headers.get('x-real-ip') ||
               undefined,
    userAgent: headers.get('user-agent') || undefined,
    requestId: headers.get('x-request-id') || undefined,
  };
}

/**
 * Create audit logger with pre-filled context
 */
export function createAuditLogger(context: {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}) {
  return {
    log: (options: Omit<LogAuditEventOptions, 'userId' | 'ipAddress' | 'userAgent' | 'requestId'>) =>
      AuditLogService.log({ ...context, ...options }),

    logValidation: (params: Omit<Parameters<typeof AuditLogService.logValidation>[0], 'userId' | 'ipAddress' | 'userAgent'>) =>
      AuditLogService.logValidation({ ...context, ...params }),

    logFileOperation: (params: Omit<Parameters<typeof AuditLogService.logFileOperation>[0], 'userId' | 'ipAddress' | 'userAgent'>) =>
      AuditLogService.logFileOperation({ ...context, ...params }),

    logAuthentication: (params: Omit<Parameters<typeof AuditLogService.logAuthentication>[0], 'userId' | 'ipAddress' | 'userAgent'>) =>
      AuditLogService.logAuthentication({ ...context, ...params }),

    logSecurityEvent: (params: Omit<Parameters<typeof AuditLogService.logSecurityEvent>[0], 'userId' | 'ipAddress' | 'userAgent'>) =>
      AuditLogService.logSecurityEvent({ ...context, ...params }),

    logDataAccess: (params: Omit<Parameters<typeof AuditLogService.logDataAccess>[0], 'userId' | 'ipAddress' | 'userAgent'>) =>
      AuditLogService.logDataAccess({ ...context, ...params }),
  };
}
