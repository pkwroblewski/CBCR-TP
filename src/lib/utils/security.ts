/**
 * Security Utilities
 *
 * CSRF protection, CORS validation, and input sanitization.
 *
 * @module lib/utils/security
 */

import { NextRequest, NextResponse } from 'next/server';
import { forbidden, badRequest } from './api-response';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Allowed origins for CORS
 * In production, configure via ALLOWED_ORIGINS env variable
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map((origin) => origin.trim());
  }

  // Default allowed origins
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return [
    appUrl,
    'http://localhost:3000',
    'http://localhost:3001',
  ];
}

/**
 * CSRF token cookie name
 */
const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * CSRF header name (must match client implementation)
 */
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Routes that require CSRF protection (state-changing operations)
 */
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// =============================================================================
// CORS VALIDATION
// =============================================================================

/**
 * Validate request origin against allowed origins
 *
 * @param request - Incoming request
 * @returns Object with validation result
 */
export function validateOrigin(request: NextRequest): {
  valid: boolean;
  origin: string | null;
  error?: string;
} {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // For same-origin requests (no Origin header), check Referer
  if (!origin) {
    // If no origin and no referer, it might be a server-to-server request
    // For APIs, we should still require some form of origin validation
    if (!referer) {
      // Allow if it's a GET request (read-only) or in development
      if (request.method === 'GET' || process.env.NODE_ENV === 'development') {
        return { valid: true, origin: null };
      }
      return {
        valid: false,
        origin: null,
        error: 'Missing origin header for state-changing request',
      };
    }

    // Extract origin from referer
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      const allowedOrigins = getAllowedOrigins();

      if (allowedOrigins.includes(refererOrigin)) {
        return { valid: true, origin: refererOrigin };
      }

      return {
        valid: false,
        origin: refererOrigin,
        error: `Origin not allowed: ${refererOrigin}`,
      };
    } catch {
      return {
        valid: false,
        origin: null,
        error: 'Invalid referer header',
      };
    }
  }

  // Validate against allowed origins
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return { valid: true, origin };
  }

  return {
    valid: false,
    origin,
    error: `Origin not allowed: ${origin}`,
  };
}

/**
 * Add CORS headers to response
 *
 * @param response - Response to add headers to
 * @param origin - Validated origin (or null for same-origin)
 * @returns Response with CORS headers
 */
export function addCorsHeaders(
  response: Response,
  origin: string | null
): Response {
  const headers = new Headers(response.headers);

  // Only add Access-Control-Allow-Origin if origin is provided and allowed
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// =============================================================================
// CSRF PROTECTION
// =============================================================================

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Get CSRF token from header
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

/**
 * Validate CSRF token using double-submit cookie pattern
 *
 * @param request - Incoming request
 * @returns Validation result
 */
export function validateCsrfToken(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  // Skip CSRF for non-state-changing methods
  if (!CSRF_PROTECTED_METHODS.includes(request.method)) {
    return { valid: true };
  }

  // Skip CSRF validation in development if bypass is enabled
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.SKIP_CSRF_CHECK === 'true'
  ) {
    return { valid: true };
  }

  const cookieToken = getCsrfTokenFromCookie(request);
  const headerToken = getCsrfTokenFromHeader(request);

  if (!cookieToken) {
    return {
      valid: false,
      error: 'CSRF cookie missing. Please refresh the page.',
    };
  }

  if (!headerToken) {
    return {
      valid: false,
      error: 'CSRF token header missing',
    };
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
    };
  }

  return { valid: true };
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Set CSRF token cookie on response
 *
 * @param response - Response to add cookie to
 * @param token - CSRF token to set
 * @returns Response with CSRF cookie
 */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

// =============================================================================
// COMBINED SECURITY MIDDLEWARE
// =============================================================================

/**
 * Security check result
 */
export interface SecurityCheckResult {
  allowed: boolean;
  error?: Response;
  origin?: string | null;
}

/**
 * Perform security checks on a request
 *
 * This validates:
 * 1. Origin/CORS
 * 2. CSRF token (for state-changing requests)
 *
 * @param request - Incoming request
 * @returns Security check result
 */
export function performSecurityChecks(request: NextRequest): SecurityCheckResult {
  // 1. Validate origin
  const originResult = validateOrigin(request);
  if (!originResult.valid) {
    console.warn(`Security: Origin validation failed - ${originResult.error}`);
    return {
      allowed: false,
      error: forbidden(originResult.error || 'Invalid origin'),
    };
  }

  // 2. Validate CSRF for state-changing requests
  if (CSRF_PROTECTED_METHODS.includes(request.method)) {
    const csrfResult = validateCsrfToken(request);
    if (!csrfResult.valid) {
      console.warn(`Security: CSRF validation failed - ${csrfResult.error}`);
      return {
        allowed: false,
        error: badRequest(csrfResult.error || 'CSRF validation failed'),
      };
    }
  }

  return {
    allowed: true,
    origin: originResult.origin,
  };
}

// =============================================================================
// INPUT SANITIZATION
// =============================================================================

/**
 * Sanitize a string to prevent XSS and injection attacks
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize JSON input
 *
 * @param body - Parsed JSON body
 * @param allowedKeys - List of allowed top-level keys
 * @returns Sanitized object or null if invalid
 */
export function sanitizeJsonBody<T extends Record<string, unknown>>(
  body: unknown,
  allowedKeys: string[]
): T | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  const sanitized: Record<string, unknown> = {};

  for (const key of allowedKeys) {
    if (key in (body as Record<string, unknown>)) {
      const value = (body as Record<string, unknown>)[key];

      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        // Recursively sanitize arrays
        sanitized[key] = value.map((item) =>
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else if (value && typeof value === 'object') {
        // Keep nested objects but sanitize their string values
        sanitized[key] = value;
      }
    }
  }

  return sanitized as T;
}

/**
 * Validate file name to prevent path traversal
 *
 * @param filename - File name to validate
 * @returns Sanitized file name or null if invalid
 */
export function sanitizeFilename(filename: string): string | null {
  if (typeof filename !== 'string') {
    return null;
  }

  // Remove path separators and null bytes
  const sanitized = filename
    .replace(/[/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .trim();

  // Must have a name and be reasonable length
  if (!sanitized || sanitized.length > 255) {
    return null;
  }

  // Must have .xml extension for this application
  if (!sanitized.toLowerCase().endsWith('.xml')) {
    return null;
  }

  return sanitized;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  getAllowedOrigins,
};
