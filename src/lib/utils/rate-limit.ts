/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for API routes.
 * For production, consider using Redis or a distributed rate limiter.
 *
 * @module lib/utils/rate-limit
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Total limit */
  limit: number;
  /** When the rate limit resets (Unix timestamp) */
  resetAt: number;
  /** Retry after in seconds (only if not allowed) */
  retryAfter?: number;
}

/**
 * Rate limit entry for tracking
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// =============================================================================
// RATE LIMITER CLASS
// =============================================================================

/**
 * In-memory rate limiter
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter({ limit: 10, windowMs: 60000 });
 *
 * export async function POST(request: NextRequest) {
 *   const ip = request.headers.get('x-forwarded-for') || 'unknown';
 *   const result = limiter.check(ip);
 *
 *   if (!result.allowed) {
 *     return Response.json(
 *       { error: 'Too many requests' },
 *       {
 *         status: 429,
 *         headers: {
 *           'Retry-After': String(result.retryAfter),
 *           'X-RateLimit-Limit': String(result.limit),
 *           'X-RateLimit-Remaining': String(result.remaining),
 *         },
 *       }
 *     );
 *   }
 *
 *   // Process request...
 * }
 * ```
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Cleanup expired entries every minute
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000);
    }
  }

  /**
   * Check if a request is allowed
   *
   * @param key - Unique identifier (IP address, user ID, etc.)
   * @returns Rate limit result
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    // If no entry or entry has expired, create new one
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + this.config.windowMs;
      this.store.set(key, { count: 1, resetAt });

      return {
        allowed: true,
        remaining: this.config.limit - 1,
        limit: this.config.limit,
        resetAt,
      };
    }

    // Increment count
    entry.count++;

    // Check if over limit
    if (entry.count > this.config.limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        limit: this.config.limit,
        resetAt: entry.resetAt,
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: this.config.limit - entry.count,
      limit: this.config.limit,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

/**
 * Default rate limiters for common use cases
 */

/** Validation endpoint: 10 requests per minute */
export const validationRateLimiter = new RateLimiter({
  limit: 10,
  windowMs: 60 * 1000,
});

/** Report endpoints: 30 requests per minute */
export const reportRateLimiter = new RateLimiter({
  limit: 30,
  windowMs: 60 * 1000,
});

/** PDF generation: 5 requests per minute */
export const pdfRateLimiter = new RateLimiter({
  limit: 5,
  windowMs: 60 * 1000,
});

/** Auth endpoints: 5 requests per minute */
export const authRateLimiter = new RateLimiter({
  limit: 5,
  windowMs: 60 * 1000,
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get client identifier from request
 *
 * @param request - NextRequest object
 * @returns Client identifier (IP or 'unknown')
 */
export function getClientId(request: Request): string {
  const headers = request.headers;

  // Try various headers for the real IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Create rate limit headers for response
 *
 * @param result - Rate limit result
 * @returns Headers object
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: HeadersInit = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Check rate limit and return error response if exceeded
 *
 * @param limiter - Rate limiter instance
 * @param request - Request object
 * @returns Error response if rate limited, null otherwise
 */
export function checkRateLimit(
  limiter: RateLimiter,
  request: Request
): Response | null {
  const clientId = getClientId(request);
  const result = limiter.check(clientId);

  if (!result.allowed) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: result.retryAfter,
        },
      },
      {
        status: 429,
        headers: createRateLimitHeaders(result),
      }
    );
  }

  return null;
}

