import Link from 'next/link';

/**
 * Resources Layout
 *
 * Public layout for the Knowledge Base / Resources section.
 * Dark theme matching the main application.
 *
 * @module app/resources/layout
 */

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-900/30 group-hover:shadow-blue-800/40 transition-shadow">
                PW
              </div>
              <span className="font-semibold text-slate-100 text-lg">
                CbCR Analyzer
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/resources"
                className="text-sm font-medium text-slate-100 hover:text-blue-400 transition-colors"
              >
                Resources Hub
              </Link>
              <Link
                href="/resources/validation-rules"
                className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
              >
                Validation Rules
              </Link>
              <Link
                href="/resources/countries"
                className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
              >
                Countries
              </Link>
              <Link
                href="/resources/glossary"
                className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
              >
                Glossary
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors shadow-lg shadow-blue-900/30"
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
      <footer className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Resources */}
            <div>
              <h3 className="font-semibold text-slate-100 mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/resources/validation-rules" className="hover:text-slate-100 transition-colors">
                    Validation Rules
                  </Link>
                </li>
                <li>
                  <Link href="/resources/oecd-errors" className="hover:text-slate-100 transition-colors">
                    OECD Common Errors
                  </Link>
                </li>
                <li>
                  <Link href="/resources/countries" className="hover:text-slate-100 transition-colors">
                    Country Compliance
                  </Link>
                </li>
                <li>
                  <Link href="/resources/pillar2" className="hover:text-slate-100 transition-colors">
                    Pillar 2 Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Reference */}
            <div>
              <h3 className="font-semibold text-slate-100 mb-4">Reference</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/resources/glossary" className="hover:text-slate-100 transition-colors">
                    Glossary
                  </Link>
                </li>
                <li>
                  <Link href="/resources/external" className="hover:text-slate-100 transition-colors">
                    External Resources
                  </Link>
                </li>
              </ul>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-slate-100 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/" className="hover:text-slate-100 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="hover:text-slate-100 transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="hover:text-slate-100 transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-slate-100 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/privacy" className="hover:text-slate-100 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-slate-100 transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} CbCR Analyzer. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              Reference materials provided for informational purposes. Always verify with official sources.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
