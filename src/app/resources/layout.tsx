import Link from 'next/link';

/**
 * Resources Layout
 *
 * Public layout for the Knowledge Base / Resources section.
 * Includes header, footer, and shared styling.
 *
 * @module app/resources/layout
 */

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                PW
              </div>
              <span className="font-semibold text-primary text-lg">
                PW-(CbCR) Analyzer
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/resources"
                className="text-sm font-medium text-foreground hover:text-accent transition-colors"
              >
                Resources Hub
              </Link>
              <Link
                href="/resources/validation-rules"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Validation Rules
              </Link>
              <Link
                href="/resources/countries"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Countries
              </Link>
              <Link
                href="/resources/glossary"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Glossary
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Resources */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/resources/validation-rules" className="hover:text-foreground transition-colors">
                    Validation Rules
                  </Link>
                </li>
                <li>
                  <Link href="/resources/oecd-errors" className="hover:text-foreground transition-colors">
                    OECD Common Errors
                  </Link>
                </li>
                <li>
                  <Link href="/resources/countries" className="hover:text-foreground transition-colors">
                    Country Compliance
                  </Link>
                </li>
                <li>
                  <Link href="/resources/pillar2" className="hover:text-foreground transition-colors">
                    Pillar 2 Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Reference */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Reference</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/resources/glossary" className="hover:text-foreground transition-colors">
                    Glossary
                  </Link>
                </li>
                <li>
                  <Link href="/resources/external" className="hover:text-foreground transition-colors">
                    External Resources
                  </Link>
                </li>
              </ul>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PW-(CbCR) Analyzer. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Reference materials provided for informational purposes. Always verify with official sources.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
