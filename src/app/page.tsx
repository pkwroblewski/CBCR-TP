'use client';

import Link from 'next/link';
import { 
  Upload, 
  Zap, 
  FileText, 
  ArrowRight, 
  Shield, 
  Clock, 
  CheckCircle2,
  Globe2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@/components/auth-wrapper';

/**
 * Landing Page
 *
 * Premium dark theme with blue accents.
 * Sets the visual DNA for the entire application.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Ambient glow effects */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed top-1/3 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50" />
        <div className="relative max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-sm tracking-tight shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow overflow-hidden">
              <span className="relative z-10 text-white">PW</span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <span className="text-lg font-semibold text-slate-100 tracking-tight hidden sm:block">
              CbCR Analyzer
            </span>
          </Link>

          {/* Navigation links */}
          <div className="flex items-center gap-2">
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/validate"
                className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110 transition-all"
              >
                Validate
              </Link>
              <div className="ml-3 pl-3 border-l border-slate-700/50">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: { avatarBox: 'w-9 h-9 ring-2 ring-blue-500/30' },
                  }}
                />
              </div>
            </SignedIn>
            
            <SignedOut>
              <Link
                href="/how-it-works"
                className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
              >
                How It Works
              </Link>
              <Link
                href="/resources"
                className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
              >
                Resources
              </Link>
              <Link
                href="/sign-in"
                className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-110 transition-all"
              >
                Get started
              </Link>
            </SignedOut>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              OECD 2024 Compliant
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in delay-100">
            <span className="text-slate-100">Validate your </span>
            <span className="text-gradient">CbC Reports</span>
            <br />
            <span className="text-slate-100">with confidence</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in delay-150">
            Professional-grade XML validation against OECD standards. 
            Get instant results with actionable insights.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in delay-200">
            <SignedIn>
              <Link
                href="/validate"
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:brightness-110 transition-all"
              >
                Start Validating
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </SignedIn>
            
            <SignedOut>
              <Link
                href="/sign-up"
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:brightness-110 transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/sign-in"
                className="flex items-center gap-2 px-8 py-4 text-slate-400 hover:text-slate-200 text-lg font-medium transition-colors"
              >
                Sign in
                <ChevronRight className="w-4 h-4" />
              </Link>
            </SignedOut>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-slate-800/50 animate-fade-in delay-300">
            {[
              { icon: Shield, label: 'Enterprise-grade security' },
              { icon: Clock, label: 'Results in seconds' },
              { icon: Globe2, label: '150+ validation rules' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-slate-500">
                <item.icon className="w-4 h-4 text-blue-500/70" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              <span className="text-gradient">Three steps</span>
              <span className="text-slate-100"> to compliance</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Streamlined workflow designed for tax professionals
            </p>
          </div>

          {/* Steps grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: Upload,
                title: 'Upload',
                description: 'Drop your CbCR XML file into our secure validation engine',
                color: 'blue',
              },
              {
                step: '02',
                icon: Zap,
                title: 'Validate',
                description: '150+ rules checked instantly against OECD CbC-Schema v2.0',
                color: 'indigo',
              },
              {
                step: '03',
                icon: FileText,
                title: 'Report',
                description: 'Get detailed compliance reports with actionable insights',
                color: 'cyan',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Step number */}
                <div className="absolute top-6 right-6 text-5xl font-bold text-slate-800/50 group-hover:text-blue-500/20 transition-colors">
                  {item.step}
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center shadow-lg ${
                  item.color === 'blue' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25' 
                    : item.color === 'indigo'
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/25'
                    : 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-cyan-500/25'
                } group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-100 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="text-slate-100">Comprehensive </span>
                <span className="text-gradient">validation coverage</span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Our validation engine covers all aspects of CbC reporting compliance, 
                from XML schema validation to business rule verification and country-specific requirements.
              </p>
              
              <div className="pt-4">
                <SignedIn>
                  <Link
                    href="/validate"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Start validating now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Get started for free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </SignedOut>
              </div>
            </div>

            {/* Right - Feature list */}
            <div className="space-y-4">
              {[
                'OECD CbC-Schema v2.0 compliance',
                'BEPS Action 13 business rules',
                'Luxembourg-specific TIN validation',
                'Pillar 2 Safe Harbour eligibility',
                'Data quality and consistency checks',
                'DocRefId uniqueness validation',
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-blue-500/20 transition-colors group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-slate-300 font-medium group-hover:text-slate-100 transition-colors">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '150+', label: 'Validation Rules' },
              { value: '< 2s', label: 'Average Time' },
              { value: '99.9%', label: 'Accuracy Rate' },
              { value: '24/7', label: 'Availability' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-500 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-blue-500/10 via-slate-900/50 to-indigo-500/10 border border-blue-500/20 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-blue-500/20 rounded-full blur-[100px]" />
            
            <div className="relative text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
                Ready to validate?
              </h2>
              <p className="text-lg text-slate-400 max-w-lg mx-auto">
                Join tax professionals who trust our platform for CbC report validation.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <SignedIn>
                  <Link
                    href="/validate"
                    className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:brightness-110 transition-all"
                  >
                    Validate Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </SignedIn>
                
                <SignedOut>
                  <Link
                    href="/sign-up"
                    className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:brightness-110 transition-all"
                  >
                    Create Free Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </SignedOut>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
              PW
            </div>
            <span className="text-sm text-slate-500">
              © {new Date().getFullYear()} PW Tax. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-8 text-sm text-slate-500">
            <SignedIn>
              <Link href="/dashboard" className="hover:text-slate-300 transition-colors">
                Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="hover:text-slate-300 transition-colors">
                Sign in
              </Link>
            </SignedOut>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
