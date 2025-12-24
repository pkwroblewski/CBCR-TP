/**
 * CSRF Token Client Utilities
 *
 * Utilities for reading and including CSRF tokens in API requests.
 *
 * @module lib/utils/csrf
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Get CSRF token from cookie
 *
 * @returns CSRF token or null if not found
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return value;
    }
  }

  return null;
}

/**
 * Create headers with CSRF token
 *
 * @param additionalHeaders - Additional headers to include
 * @returns Headers object with CSRF token
 */
export function createCsrfHeaders(
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    ...additionalHeaders,
  };

  if (csrfToken) {
    headers[CSRF_HEADER_NAME] = csrfToken;
  }

  return headers;
}

/**
 * Fetch wrapper that automatically includes CSRF token
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCsrfToken();
  const headers = new Headers(options.headers);

  if (csrfToken) {
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important for cookie handling
  });
}

/**
 * Post JSON with CSRF protection
 *
 * @param url - URL to post to
 * @param data - JSON data to send
 * @returns Fetch response
 */
export async function postWithCsrf<T>(
  url: string,
  data: T
): Promise<Response> {
  return csrfFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Post FormData with CSRF protection
 *
 * @param url - URL to post to
 * @param formData - FormData to send
 * @returns Fetch response
 */
export async function postFormDataWithCsrf(
  url: string,
  formData: FormData
): Promise<Response> {
  return csrfFetch(url, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type - browser will set it with boundary for multipart
  });
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
