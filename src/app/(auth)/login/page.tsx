'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  FileCheck2,
} from 'lucide-react';

/**
 * Login Page
 *
 * Modern glassmorphism email and password authentication form.
 */
export default function LoginPage() {
  const router = useRouter();
  const { signIn, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();

      const success = await signIn(email, password);
      if (success) {
        router.push('/dashboard');
      }
    },
    [email, password, signIn, clearError, router]
  );

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Decorative pulsating background orbs */}
      <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl animate-orb-1" style={{ background: 'radial-gradient(circle, rgba(232, 93, 4, 0.25) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full blur-3xl animate-orb-2" style={{ background: 'radial-gradient(circle, rgba(8, 145, 178, 0.2) 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 -right-16 w-32 h-32 rounded-full blur-2xl animate-orb-float" style={{ background: 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 70%)' }} />

      {/* Main card with glassmorphism */}
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
            Welcome back
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Sign in to continue to your dashboard
          </p>
        </CardHeader>

        <CardContent className="pt-6 pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error display */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 p-4 bg-red-50/80 backdrop-blur border border-red-200/50 rounded-xl text-sm text-red-700 animate-fade-in"
              >
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-white/50 border-border/50 rounded-xl text-base transition-all focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 bg-white/50 border-border/50 rounded-xl text-base transition-all focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                  autoComplete="current-password"
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
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 transition-all hover:-translate-y-0.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <Separator className="bg-border/50" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              New here?
            </span>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              Create account
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Trust badges */}
      <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground animate-fade-in-up delay-300">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-500" />
          <span>Secure Login</span>
        </div>
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-orange-500" />
          <span>OECD Compliant</span>
        </div>
      </div>
    </div>
  );
}
