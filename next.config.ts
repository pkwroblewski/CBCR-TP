import type { NextConfig } from "next";

/**
 * Security headers for production deployment
 * Based on OWASP recommendations and security best practices
 */
const securityHeaders = [
  {
    // Prevent clickjacking attacks
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Prevent MIME type sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Enable XSS filter in older browsers
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    // Control referrer information sent with requests
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Enforce HTTPS (enable only in production with valid SSL)
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    // Restrict browser features and APIs
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    // Content Security Policy - adjust as needed for your CDN/assets
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'", // Tailwind uses inline styles
      "img-src 'self' data: blob: https: https://img.clerk.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.clerk.accounts.dev https://*.convex.cloud wss://*.convex.cloud",
      "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "form-action 'self' https://*.clerk.accounts.dev",
      "base-uri 'self'",
      "object-src 'none'",
      "worker-src 'self' blob:",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  /**
   * Turbopack configuration
   * Explicitly set the root to prevent lockfile detection issues
   */
  turbopack: {
    root: __dirname,
  },

  /**
   * Redirects from old auth routes to new Clerk routes
   */
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/sign-in',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/sign-up',
        permanent: true,
      },
      {
        source: '/forgot-password',
        destination: '/sign-in',
        permanent: true,
      },
    ];
  },

  /**
   * Apply security headers to all routes
   */
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  /**
   * Powered by header removal for security through obscurity
   */
  poweredByHeader: false,
};

export default nextConfig;
