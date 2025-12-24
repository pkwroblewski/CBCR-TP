'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

/**
 * Forgot Password Page
 *
 * Password reset request form.
 */
export default function ForgotPasswordPage() {
  const { resetPassword, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();

      const success = await resetPassword(email);
      if (success) {
        setSubmitted(true);
      }
    },
    [email, resetPassword, clearError]
  );

  // Show success message after submission
  if (submitted) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a365d] mb-2">
            Check your email
          </h2>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            We&apos;ve sent a password reset link to <strong>{email}</strong>. 
            Click the link to reset your password.
          </p>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Link>
            </Button>
            <p className="text-xs text-slate-500">
              Didn&apos;t receive the email?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setSubmitted(false)}
              >
                Try again
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-[#1a365d]">
          Reset Password
        </CardTitle>
        <p className="text-slate-600 text-sm mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full bg-[#1a365d] hover:bg-[#2d4a7c]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send reset link
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Back to login link */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-slate-600 hover:text-[#1a365d] inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

