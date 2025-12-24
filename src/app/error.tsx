'use client';

/**
 * Global Error Boundary
 *
 * Catches and displays errors with recovery options.
 *
 * @page /error
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, RefreshCcw, Bug } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription className="text-base">
            We encountered an unexpected error. Don&apos;t worry, your data is safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Details (Dev Only) */}
          {isDev && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Bug className="h-4 w-4" />
                <span className="font-medium">Debug Information</span>
              </div>
              <p className="font-mono text-xs break-all text-destructive">
                {error.message || 'Unknown error'}
              </p>
              {error.digest && (
                <p className="font-mono text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => reset()}
              className="flex-1"
              size="lg"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              If this problem persists, please{' '}
              <a
                href="mailto:support@cbcr-review.com"
                className="text-primary hover:underline"
              >
                contact support
              </a>
              .
            </p>
          </div>

          {/* Error Reference (Production) */}
          {!isDev && error.digest && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Reference: <code className="font-mono">{error.digest}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
