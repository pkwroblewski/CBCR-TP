'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth, isStrongPassword } from '@/hooks/useAuth';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  User,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

/**
 * Register Page
 *
 * User registration form with validation.
 */
export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isLoading, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Password strength checks
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const allChecksPass = Object.values(passwordChecks).every(Boolean) && passwordsMatch;

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();
      setLocalError(null);

      // Validate passwords match
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }

      // Validate password strength
      const strengthCheck = isStrongPassword(password);
      if (!strengthCheck.isValid) {
        setLocalError(strengthCheck.errors[0]);
        return;
      }

      // Validate terms acceptance
      if (!acceptTerms) {
        setLocalError('Please accept the terms and conditions');
        return;
      }

      const success = await signUp({
        email,
        password,
        fullName,
      });

      if (success) {
        setShowVerificationNotice(true);
      }
    },
    [email, password, confirmPassword, fullName, acceptTerms, signUp, clearError]
  );

  // Show verification notice after successful registration
  if (showVerificationNotice) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a365d] mb-2">
            Check your email
          </h2>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            We&apos;ve sent a verification link to <strong>{email}</strong>. 
            Click the link to verify your account.
          </p>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Back to login
            </Button>
            <p className="text-xs text-slate-500">
              Didn&apos;t receive the email?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => {
                  // TODO: Resend verification email
                  alert('Verification email resent!');
                }}
              >
                Resend
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Decorative pulsating background orbs */}
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl animate-orb-1" style={{ background: 'radial-gradient(circle, rgba(232, 93, 4, 0.25) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl animate-orb-2" style={{ background: 'radial-gradient(circle, rgba(8, 145, 178, 0.2) 0%, transparent 70%)' }} />
      <div className="absolute top-1/3 -left-12 w-28 h-28 rounded-full blur-2xl animate-orb-float" style={{ background: 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 70%)' }} />

      <Card className="relative glass-strong shadow-2xl border-white/20 backdrop-blur-xl animate-fade-in-up">
        <CardHeader className="text-center pb-2 pt-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-xl shadow-xl">
              PW
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full border-2 border-white animate-pulse shadow-lg shadow-orange-500/30" />
            </div>
          </div>

          <CardTitle className="text-2xl font-bold text-primary tracking-tight">
            Create Account
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Start validating your CbC reports today
          </p>
        </CardHeader>

        <CardContent className="pt-6 pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error display */}
            {(error || localError) && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 p-4 bg-red-50/80 backdrop-blur border border-red-200/50 rounded-xl text-sm text-red-700 animate-fade-in"
              >
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
                <span className="font-medium">{error || localError}</span>
              </div>
            )}

            {/* Full name field */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-semibold text-foreground">
                Full name
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-12 h-12 bg-white/50 border-border/50 rounded-xl text-base transition-all focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  required
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-white/50 border-border/50 rounded-xl text-base transition-all focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 bg-white/50 border-border/50 rounded-xl text-base transition-all focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

            {/* Password strength indicators */}
            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${passwordChecks.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {passwordChecks.length ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  8+ characters
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.uppercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {passwordChecks.uppercase ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  Uppercase letter
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.lowercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {passwordChecks.lowercase ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  Lowercase letter
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.number ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {passwordChecks.number ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  Number
                </div>
              </div>
            )}
          </div>

            {/* Confirm password field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                Confirm password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-12 h-12 bg-white/50 border-border/50 rounded-xl text-base transition-all focus:bg-white ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  }`}
                  required
                  autoComplete="new-password"
                />
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-600 font-medium">Passwords do not match</p>
              )}
            </div>

            {/* Terms acceptance */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-border text-orange-500 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
                required
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                I agree to the{' '}
                <Link href="/terms" className="text-orange-600 hover:text-orange-500 transition-colors font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-orange-600 hover:text-orange-500 transition-colors font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 transition-all hover:-translate-y-0.5"
              disabled={isLoading || !allChecksPass || !acceptTerms}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <Separator className="bg-border/50" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              Already registered?
            </span>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-orange-600 hover:text-orange-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

