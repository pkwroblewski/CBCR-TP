import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';
import {
  successResponse,
  badRequest,
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
import { createFullyConfiguredEngine, getXsdValidator } from '@/lib/validators';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Convex HTTP endpoint for saving reports
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.convex.cloud', '.convex.site');

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Extract DocRefIds from validation results to register them
 */
function extractDocRefIds(results: ValidationResult[], messageType: string): Array<{ docRefId: string; messageType: string }> {
  const docRefIds: Array<{ docRefId: string; messageType: string }> = [];
  
  // Look for DocRefId-related results
  for (const result of results) {
    if (result.details?.docRefId && typeof result.details.docRefId === 'string') {
      docRefIds.push({
        docRefId: result.details.docRefId,
        messageType,
      });
    }
  }
  
  return docRefIds;
}

/**
 * Persist validation report to Convex database
 */
async function persistToConvex(
  userId: string,
  filename: string,
  fileSize: number,
  report: ValidationReport,
  messageType: string = 'CBC701'
): Promise<string | null> {
  if (!CONVEX_SITE_URL || CONVEX_SITE_URL.includes('placeholder')) {
    console.log('[API] Convex not configured, skipping persistence');
    return null;
  }

  try {
    const docRefIds = extractDocRefIds(report.results, messageType);
    
    const response = await fetch(`${CONVEX_SITE_URL}/saveReport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        fileName: filename,
        fileSize,
        reportingPeriod: report.fiscalYear,
        reportingEntity: report.upeName,
        jurisdictionCount: report.jurisdictionCount,
        totalErrors: report.summary.critical + report.summary.errors,
        totalWarnings: report.summary.warnings,
        validationStatus: 'completed',
        validationResults: {
          id: report.id,
          isValid: report.isValid,
          summary: report.summary,
          byCategory: report.byCategory,
          results: report.results,
          metadata: {
            fiscalYear: report.fiscalYear,
            upeJurisdiction: report.upeJurisdiction,
            upeName: report.upeName,
            messageRefId: report.messageRefId,
            jurisdictionCount: report.jurisdictionCount,
            entityCount: report.entityCount,
          },
          durationMs: report.durationMs,
        },
        docRefIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[API] Failed to persist to Convex:', error);
      return null;
    }

    const result = await response.json();
    console.log('[API] Report persisted to Convex:', result.reportId);
    return result.reportId;
  } catch (error) {
    console.error('[API] Error persisting to Convex:', error);
    return null;
  }
}

// =============================================================================
// POST /api/validate
// =============================================================================

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

/**
 * Validate a CbC XML file
 *
 * Accepts either:
 * - multipart/form-data with 'file' field
 * - application/json with 'content' and 'filename' fields
 */
export async function POST(request: NextRequest) {
  try {
    // Security checks (Origin validation)
    const securityResult = performSecurityChecks(request);
    if (!securityResult.allowed) {
      return addCorsHeaders(securityResult.error!, securityResult.origin ?? null);
    }

    // Check rate limit
    const rateLimitError = checkRateLimit(validationRateLimiter, request);
    if (rateLimitError) {
      return rateLimitError;
    }

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

    // Step 1: XML Well-formedness
    const wellformedResults = validateXmlWellformedness(xmlContent);
    results.push(...wellformedResults);

    // Check for critical XML errors
    const hasCriticalXmlError = wellformedResults.some(
      (r) => r.severity === ValidationSeverity.CRITICAL
    );

    let metadata: Record<string, unknown> = {};

    if (!hasCriticalXmlError) {
      // Step 1.5: XSD Schema Validation
      try {
        const xsdValidator = getXsdValidator();
        const xsdResult = await xsdValidator.validate(xmlContent, 'strict');
        
        if (!xsdResult.valid) {
          // Convert XSD errors to ValidationResults
          const xsdValidationResults = xsdValidator.toValidationResults(xsdResult, 'strict');
          results.push(...xsdValidationResults);
          
          // Log XSD validation summary
          console.log(`XSD Validation: ${xsdResult.errors.length} errors found in ${xsdResult.processingTimeMs}ms`);
        } else {
          console.log(`XSD Validation: Passed in ${xsdResult.processingTimeMs}ms`);
        }
      } catch (xsdError) {
        // XSD validation failed but don't block - continue with other validations
        console.warn('XSD Validation error:', xsdError);
        results.push({
          ruleId: 'XSD-000',
          category: ValidationCategory.SCHEMA_COMPLIANCE,
          severity: ValidationSeverity.WARNING,
          message: 'XSD schema validation could not be performed',
          details: { error: xsdError instanceof Error ? xsdError.message : 'Unknown error' },
        });
      }

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

        // Step 3: Run full validation engine with all validators
        try {
          // Create validation engine with country-specific validators if provided
          // Default to Luxembourg (LU) for now
          const engine = createFullyConfiguredEngine('LU', true);

          // Run all validators
          const engineReport = await engine.validate(cbcReport, {
            country: 'LU',
            checkPillar2: true,
            strictMode: false,
          });

          // Add engine results to our results array
          if (engineReport.results) {
            results.push(...engineReport.results);
          }
        } catch (engineError) {
          console.error('Validation engine error:', engineError);
          // Add a warning if engine fails but continue with basic results
          results.push({
            ruleId: 'ENGINE-001',
            category: ValidationCategory.XML_WELLFORMEDNESS,
            severity: ValidationSeverity.WARNING,
            message: 'Full validation engine encountered an error. Basic validation completed.',
            details: { error: engineError instanceof Error ? engineError.message : 'Unknown error' },
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
      passed: 0,
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
    };

    // Persist to Convex if user is authenticated
    let convexReportId: string | null = null;
    let fileSize = 0;
    
    // Calculate file size (approximate from content length)
    fileSize = new Blob([xmlContent]).size;
    
    // Get user ID from Clerk
    try {
      const { userId } = await auth();
      if (userId) {
        const messageType = (metadata.messageTypeIndic as string) || 'CBC701';
        convexReportId = await persistToConvex(userId, filename, fileSize, report, messageType);
      } else {
        console.log('[API] No authenticated user, skipping persistence');
      }
    } catch (authError) {
      console.warn('[API] Auth error, skipping persistence:', authError);
    }

    // Use Convex ID if available, otherwise use local ID
    const finalReportId = convexReportId || reportId;

    return addCorsHeaders(
      successResponse({
        reportId: finalReportId,
        convexReportId,
        localReportId: reportId,
        isValid,
        summary,
        byCategory,
        results,
        metadata: {
          filename,
          fileSize,
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
    return handleError(error);
  }
}
