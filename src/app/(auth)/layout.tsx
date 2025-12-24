import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Auth Layout
 *
 * Modern centered card layout for authentication pages with gradient mesh background.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen gradient-mesh flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-accent/15 rounded-full blur-[100px] animate-float-slow" />
        <div className="absolute top-[50%] right-[10%] w-80 h-80 bg-accent/10 rounded-full blur-[120px] animate-float delay-300" />
        <div className="absolute bottom-[10%] left-[30%] w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] animate-float-slow delay-500" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 px-4">
        <div className="max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} PW-(CbCR) Analyzer. All rights reserved.
        </p>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground/70">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
