import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import {
  successResponse,
  badRequest,
  unauthorized,
  payloadTooLarge,
  unsupportedMediaType,
  handleError,
} from '@/lib/utils/api-response';
import {
  validationRateLimiter,
  checkRateLimit,
} from '@/lib/utils/rate-limit';
import {
  performSecurityChecks,
  addCorsHeaders,
  sanitizeFilename,
} from '@/lib/utils/security';
import { parseXmlString, validateXmlWellformedness } from '@/lib/parsers/xml-parser';
import { extractReportMetadata } from '@/lib/parsers/xml-transformer';
import { ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { ValidationResult, ValidationSummary, ValidationReport } from '@/types/validation';
import { AuditLogService, extractRequestContext } from '@/lib/services/audit-service';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// =============================================================================
// POST /api/validate
// =============================================================================

/**
 * Validate a CbC XML file
 *
 * Accepts either:
 * - multipart/form-data with 'file' field
 * - application/json with 'content' and 'filename' fields
 */
/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const securityResult = performSecurityChecks(request);
  return addCorsHeaders(
    new Response(null, { status: 204 }),
    securityResult.origin ?? null
  );
}

export async function POST(request: NextRequest) {
  // Extract request context for audit logging
  const requestContext = extractRequestContext(request.headers);

  try {
    // Security checks (CSRF + Origin validation)
    const securityResult = performSecurityChecks(request);
    if (!securityResult.allowed) {
      // Log security event for blocked request
      await AuditLogService.logSecurityEvent({
        eventType: 'suspicious_activity',
        description: 'Request blocked by security checks (CSRF/Origin validation)',
        severity: 'warning',
        details: { origin: securityResult.origin },
        ...requestContext,
      });
      return addCorsHeaders(securityResult.error!, securityResult.origin ?? null);
    }

    // Check rate limit
    const rateLimitError = checkRateLimit(validationRateLimiter, request);
    if (rateLimitError) {
      // Log rate limit exceeded
      await AuditLogService.logSecurityEvent({
        eventType: 'rate_limit_exceeded',
        description: 'Validation rate limit exceeded',
        severity: 'warning',
        ...requestContext,
      });
      return rateLimitError;
    }

    // Get user session (optional - allow anonymous validation)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Parse request body
    let xmlContent: string;
    let filename: string;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return badRequest('No file provided');
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return payloadTooLarge('10MB');
      }

      // Check file type
      if (!file.name.endsWith('.xml')) {
        return unsupportedMediaType('Only XML files are accepted');
      }

      // Sanitize filename to prevent path traversal
      const sanitizedName = sanitizeFilename(file.name);
      if (!sanitizedName) {
        // Log file rejection
        await AuditLogService.logFileOperation({
          operation: 'rejected',
          fileName: file.name,
          fileSize: file.size,
          reason: 'Invalid filename (path traversal attempt)',
          ...requestContext,
        });
        return addCorsHeaders(
          badRequest('Invalid filename'),
          securityResult.origin ?? null
        );
      }
      filename = sanitizedName;
      xmlContent = await file.text();
    } else if (contentType.includes('application/json')) {
      // Handle JSON body
      const body = await request.json();

      if (!body.content) {
        return badRequest('No XML content provided');
      }

      xmlContent = body.content;
      // Sanitize filename from JSON body
      const jsonFilename = body.filename || 'uploaded.xml';
      const sanitizedJsonName = sanitizeFilename(jsonFilename);
      filename = sanitizedJsonName || 'uploaded.xml';

      // Check content size
      if (xmlContent.length > MAX_FILE_SIZE) {
        return payloadTooLarge('10MB');
      }
    } else {
      return unsupportedMediaType('Expected multipart/form-data or application/json');
    }

    // Start validation
    const startTime = Date.now();
    const reportId = uuidv4();
    const results: ValidationResult[] = [];

    // Log validation started
    await AuditLogService.logValidation({
      userId: user?.id,
      reportId,
      fileName: filename,
      status: 'started',
      metadata: { fileSize: xmlContent.length },
      ...requestContext,
    });

    // Step 1: XML Well-formedness
    const wellformedResults = validateXmlWellformedness(xmlContent);
    results.push(...wellformedResults);

    // Check for critical XML errors
    const hasCriticalXmlError = wellformedResults.some(
      (r) => r.severity === ValidationSeverity.CRITICAL
    );

    let metadata: Record<string, unknown> = {};

    if (!hasCriticalXmlError) {
      // Step 2: Parse XML
      const parseResult = parseXmlString(xmlContent);

      if (!parseResult.success) {
        results.push({
          ruleId: 'XML-PARSE',
          category: ValidationCategory.XML_WELLFORMEDNESS,
          severity: ValidationSeverity.CRITICAL,
          message: parseResult.error.message,
        });
      } else {
        // parseResult.data is already a ParsedCbcReport
        const cbcReport = parseResult.data;
        metadata = extractReportMetadata(cbcReport);

        // Step 4: Run validation rules
        // TODO: Integrate full validation engine
        // For now, add some basic checks
        const messageSpec = cbcReport.message?.messageSpec;

        // Check MessageRefId
        if (messageSpec?.messageRefId) {
          const msgRefId = messageSpec.messageRefId;
          if (msgRefId.length > 100) {
            results.push({
              ruleId: 'MSG-004',
              category: ValidationCategory.BUSINESS_RULES,
              severity: ValidationSeverity.ERROR,
              message: 'MessageRefId exceeds maximum length of 100 characters',
              xpath: '/CBC_OECD/MessageSpec/MessageRefId',
              details: { length: msgRefId.length },
            });
          }
        } else {
          results.push({
            ruleId: 'MSG-001',
            category: ValidationCategory.BUSINESS_RULES,
            severity: ValidationSeverity.CRITICAL,
            message: 'MessageRefId is required',
            xpath: '/CBC_OECD/MessageSpec/MessageRefId',
          });
        }

        // Check reporting period
        if (!messageSpec?.reportingPeriod) {
          results.push({
            ruleId: 'MSG-005',
            category: ValidationCategory.BUSINESS_RULES,
            severity: ValidationSeverity.ERROR,
            message: 'ReportingPeriod is required',
            xpath: '/CBC_OECD/MessageSpec/ReportingPeriod',
          });
        }
      }
    }

    // Calculate summary
    const summary: ValidationSummary = {
      critical: results.filter((r) => r.severity === ValidationSeverity.CRITICAL).length,
      errors: results.filter((r) => r.severity === ValidationSeverity.ERROR).length,
      warnings: results.filter((r) => r.severity === ValidationSeverity.WARNING).length,
      info: results.filter((r) => r.severity === ValidationSeverity.INFO).length,
      passed: 0, // TODO: Calculate from total rules
      total: results.length,
    };

    // Calculate by category
    const byCategory: Record<string, number> = {};
    for (const result of results) {
      byCategory[result.category] = (byCategory[result.category] || 0) + 1;
    }

    const durationMs = Date.now() - startTime;
    const isValid = summary.critical === 0;

    // Create report object
    const report: ValidationReport = {
      id: reportId,
      filename,
      uploadedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed',
      isValid,
      fiscalYear: metadata.fiscalYear as string | undefined,
      upeJurisdiction: metadata.upeJurisdiction as string | undefined,
      upeName: metadata.upeName as string | undefined,
      messageRefId: metadata.messageRefId as string | undefined,
      jurisdictionCount: metadata.jurisdictionCount as number | undefined,
      entityCount: metadata.entityCount as number | undefined,
      durationMs,
      summary,
      byCategory: byCategory as Record<ValidationCategory, number>,
      results,
      userId: user?.id,
    };

    // Save to database if user is authenticated
    if (user) {
      try {
        const { error: insertError } = await supabase
          .from('validation_reports')
          .insert({
            id: reportId,
            user_id: user.id,
            filename,
            fiscal_year: report.fiscalYear,
            upe_jurisdiction: report.upeJurisdiction,
            status: 'completed',
            summary_json: summary,
          });

        if (insertError) {
          console.error('Failed to save report:', insertError);
        } else {
          // Save individual results
          const resultInserts = results.slice(0, 1000).map((result) => ({
            report_id: reportId,
            rule_id: result.ruleId,
            category: result.category,
            severity: result.severity,
            message: result.message,
            xpath: result.xpath,
            details_json: result.details,
          }));

          if (resultInserts.length > 0) {
            const { error: resultsError } = await supabase
              .from('validation_results')
              .insert(resultInserts);

            if (resultsError) {
              console.error('Failed to save results:', resultsError);
            }
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    // Log validation completed
    await AuditLogService.logValidation({
      userId: user?.id,
      reportId,
      fileName: filename,
      status: isValid ? 'completed' : 'failed',
      errorCount: summary.critical + summary.errors,
      warningCount: summary.warnings,
      durationMs,
      metadata: {
        fiscalYear: report.fiscalYear,
        upeJurisdiction: report.upeJurisdiction,
        jurisdictionCount: report.jurisdictionCount,
        entityCount: report.entityCount,
      },
      ...requestContext,
    });

    return addCorsHeaders(
      successResponse({
        reportId,
        isValid,
        summary,
        byCategory,
        results,
        metadata: {
          filename,
          fiscalYear: report.fiscalYear,
          upeJurisdiction: report.upeJurisdiction,
          upeName: report.upeName,
          jurisdictionCount: report.jurisdictionCount,
          entityCount: report.entityCount,
        },
        durationMs,
      }),
      securityResult.origin ?? null
    );
  } catch (error) {
    // Log validation error
    await AuditLogService.logValidation({
      reportId: uuidv4(),
      fileName: 'unknown',
      status: 'error',
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      ...requestContext,
    });
    return handleError(error);
  }
}

