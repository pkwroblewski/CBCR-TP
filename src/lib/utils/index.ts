/**
 * Utilities Module
 *
 * Central export point for all utility functions.
 *
 * @module lib/utils
 */

// Rate limiting
export {
  RateLimiter,
  validationRateLimiter,
  reportRateLimiter,
  pdfRateLimiter,
  authRateLimiter,
  getClientId,
  createRateLimitHeaders,
  checkRateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limit';

// API responses
export {
  successResponse,
  errorResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  methodNotAllowed,
  conflict,
  payloadTooLarge,
  unsupportedMediaType,
  validationError,
  rateLimitExceeded,
  internalError,
  serviceUnavailable,
  handleError,
  ERROR_CODES,
  type ApiError,
  type ApiResponse,
  type ErrorCode,
} from './api-response';

// PDF generation
export {
  generatePdfReport,
  createMinimalReport,
  formatDbResults,
  calculateSummary,
  groupResultsByCategory,
  countByCategory,
  type PdfGenerationOptions,
  type PdfGenerationResult,
} from './generate-pdf';

