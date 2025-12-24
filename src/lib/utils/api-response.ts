/**
 * API Response Utilities
 *
 * Consistent response formatting for API routes.
 *
 * @module lib/utils/api-response
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Standard API error
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Custom errors
  XML_PARSE_ERROR: 'XML_PARSE_ERROR',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Create a success response
 *
 * @param data - Response data
 * @param meta - Optional metadata (pagination, etc.)
 * @param status - HTTP status code (default: 200)
 * @param headers - Optional headers
 */
export function successResponse<T>(
  data: T,
  options?: {
    meta?: ApiResponse['meta'];
    status?: number;
    headers?: HeadersInit;
  }
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };

  if (options?.meta) {
    body.meta = options.meta;
  }

  return Response.json(body, {
    status: options?.status || 200,
    headers: options?.headers,
  });
}

/**
 * Create an error response
 *
 * @param code - Error code
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Optional error details
 * @param headers - Optional headers
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
  headers?: HeadersInit
): Response {
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message: process.env.NODE_ENV === 'production' && status >= 500
        ? 'An unexpected error occurred'
        : message,
      ...(details && process.env.NODE_ENV !== 'production' ? { details } : {}),
    },
  };

  return Response.json(body, { status, headers });
}

// =============================================================================
// COMMON ERROR RESPONSES
// =============================================================================

/**
 * 400 Bad Request
 */
export function badRequest(message = 'Bad request', details?: Record<string, unknown>): Response {
  return errorResponse(ERROR_CODES.BAD_REQUEST, message, 400, details);
}

/**
 * 401 Unauthorized
 */
export function unauthorized(message = 'Authentication required'): Response {
  return errorResponse(ERROR_CODES.UNAUTHORIZED, message, 401);
}

/**
 * 403 Forbidden
 */
export function forbidden(message = 'Access denied'): Response {
  return errorResponse(ERROR_CODES.FORBIDDEN, message, 403);
}

/**
 * 404 Not Found
 */
export function notFound(message = 'Resource not found'): Response {
  return errorResponse(ERROR_CODES.NOT_FOUND, message, 404);
}

/**
 * 405 Method Not Allowed
 */
export function methodNotAllowed(allowed: string[]): Response {
  return errorResponse(
    ERROR_CODES.METHOD_NOT_ALLOWED,
    `Method not allowed. Allowed: ${allowed.join(', ')}`,
    405,
    undefined,
    { Allow: allowed.join(', ') }
  );
}

/**
 * 409 Conflict
 */
export function conflict(message = 'Resource already exists'): Response {
  return errorResponse(ERROR_CODES.CONFLICT, message, 409);
}

/**
 * 413 Payload Too Large
 */
export function payloadTooLarge(maxSize: string): Response {
  return errorResponse(
    ERROR_CODES.PAYLOAD_TOO_LARGE,
    `File too large. Maximum size: ${maxSize}`,
    413
  );
}

/**
 * 415 Unsupported Media Type
 */
export function unsupportedMediaType(message = 'Unsupported file type'): Response {
  return errorResponse(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE, message, 415);
}

/**
 * 422 Validation Error
 */
export function validationError(
  message: string,
  details?: Record<string, unknown>
): Response {
  return errorResponse(ERROR_CODES.VALIDATION_ERROR, message, 422, details);
}

/**
 * 429 Rate Limit Exceeded
 */
export function rateLimitExceeded(retryAfter: number): Response {
  return errorResponse(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    'Too many requests. Please try again later.',
    429,
    { retryAfter },
    { 'Retry-After': String(retryAfter) }
  );
}

/**
 * 500 Internal Server Error
 */
export function internalError(
  message = 'An unexpected error occurred',
  details?: Record<string, unknown>
): Response {
  return errorResponse(ERROR_CODES.INTERNAL_ERROR, message, 500, details);
}

/**
 * 503 Service Unavailable
 */
export function serviceUnavailable(message = 'Service temporarily unavailable'): Response {
  return errorResponse(ERROR_CODES.SERVICE_UNAVAILABLE, message, 503);
}

// =============================================================================
// ERROR HANDLER
// =============================================================================

/**
 * Handle errors and return appropriate response
 *
 * @param error - Error object
 * @returns API error response
 */
export function handleError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('XML')) {
      return errorResponse(
        ERROR_CODES.XML_PARSE_ERROR,
        error.message,
        400
      );
    }

    // Database errors
    if (error.message.includes('database') || error.message.includes('PGRST')) {
      return errorResponse(
        ERROR_CODES.DATABASE_ERROR,
        'Database operation failed',
        500,
        process.env.NODE_ENV !== 'production'
          ? { originalError: error.message }
          : undefined
      );
    }

    // Generic error with message
    return internalError(
      process.env.NODE_ENV !== 'production'
        ? error.message
        : 'An unexpected error occurred'
    );
  }

  // Unknown error type
  return internalError();
}

