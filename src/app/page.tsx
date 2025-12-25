import Link from 'next/link';
import { Upload, Zap, FileText, ArrowRight, Check, Shield, Clock } from 'lucide-react';

/**
 * Landing Page
 *
 * Warm, sophisticated design inspired by Claude Code's aesthetic.
 * Brownish-charcoal background with muted terracotta accents.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1c1917] text-stone-100 selection:bg-amber-600/30">
      {/* Warm ambient gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-amber-900/[0.08] via-transparent to-stone-900/20 pointer-events-none" />

      {/* Subtle noise texture overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1c1917]/80 backdrop-blur-xl border-b border-stone-700/30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-sm font-bold tracking-tight shadow-lg shadow-amber-900/30 group-hover:shadow-amber-800/40 transition-shadow">
              PW
            </div>
            <span className="text-base font-semibold text-stone-200 tracking-tight">
              CbCR Analyzer
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-base text-stone-400 hover:text-stone-200 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-base px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-amber-900/30"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-6 pt-20 pb-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-900/30 border border-amber-700/40">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-medium text-amber-400 tracking-wide">
                OECD 2024 Compliant
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Validate your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">
                CbC Reports
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-stone-400 max-w-2xl mx-auto leading-relaxed">
              Upload your XML file and get instant validation against OECD standards.
            </p>

            {/* CTA */}
            <div className="pt-6">
              <Link
                href="/register"
                className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-lg font-semibold rounded-xl shadow-xl shadow-amber-900/40 hover:shadow-2xl hover:shadow-amber-800/50 transition-all duration-300 hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 pt-6 text-base text-stone-500">
              <span className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-amber-600" />
                Secure & Private
              </span>
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Results in seconds
              </span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                How it works
              </h2>
              <p className="text-lg text-stone-400">
                Three steps to compliance validation
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  icon: Upload,
                  title: 'Upload',
                  description: 'Drop your CbCR XML file into our secure validator',
                  gradient: 'from-amber-900/60 to-amber-950/40',
                  borderColor: 'border-amber-700/50',
                  iconBg: 'bg-amber-600',
                },
                {
                  step: '02',
                  icon: Zap,
                  title: 'Validate',
                  description: '150+ rules checked instantly against OECD standards',
                  gradient: 'from-orange-900/50 to-stone-900/40',
                  borderColor: 'border-orange-700/40',
                  iconBg: 'bg-orange-600',
                },
                {
                  step: '03',
                  icon: FileText,
                  title: 'Report',
                  description: 'Download your detailed compliance report as PDF',
                  gradient: 'from-stone-800/70 to-stone-900/50',
                  borderColor: 'border-stone-600/40',
                  iconBg: 'bg-stone-600',
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className={`relative group p-6 rounded-2xl bg-gradient-to-br ${item.gradient} border ${item.borderColor} hover:border-amber-600/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/20`}
                >
                  {/* Step connector */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-amber-700/60 to-transparent z-10" />
                  )}

                  <div className="space-y-4">
                    {/* Icon with colored background */}
                    <div className={`w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Step number */}
                    <div className="text-sm font-bold text-amber-500 tracking-widest">
                      STEP {item.step}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold tracking-tight text-stone-100">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base text-stone-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What we validate */}
        <section className="py-20 px-6 bg-gradient-to-b from-transparent via-stone-900/30 to-transparent">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-5">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  What we validate
                </h2>
                <p className="text-lg text-stone-400 leading-relaxed">
                  Comprehensive checks against international tax reporting standards ensure your CbC reports meet all compliance requirements.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  'OECD CbC-Schema v2.0 compliance',
                  'BEPS Action 13 business rules',
                  'Country-specific TIN formats',
                  'Pillar 2 Safe Harbour eligibility',
                  'Data quality and consistency',
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-4 p-4 rounded-xl bg-stone-800/40 border border-stone-700/30 hover:border-amber-700/40 hover:bg-stone-800/60 transition-all"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-base text-stone-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to validate?
            </h2>
            <p className="text-lg text-stone-400">
              Create your free account and start validating your CbC reports today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-lg font-semibold rounded-xl shadow-xl shadow-amber-900/40 hover:shadow-2xl hover:shadow-amber-800/50 transition-all duration-300 hover:-translate-y-0.5"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 text-stone-400 hover:text-stone-200 text-lg font-medium transition-colors"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/60 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-[10px] font-bold">
              PW
            </div>
            <span className="text-sm text-stone-500">
              © {new Date().getFullYear()} PW Tax
            </span>
          </div>

          <div className="flex items-center gap-8 text-sm text-stone-500">
            <Link href="/login" className="hover:text-stone-300 transition-colors">
              Sign in
            </Link>
            <Link href="/privacy" className="hover:text-stone-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
