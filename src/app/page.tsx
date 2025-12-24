import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileCheck2,
  Globe,
  Shield,
  Upload,
  Zap,
  Download,
  CheckCircle2,
  Lock,
  Calendar,
  BookOpen,
  ArrowRight,
  Sparkles,
  Building2,
  ChevronRight,
  Play,
  BarChart3,
  FileText,
  Clock,
  Award,
} from 'lucide-react';

/**
 * Landing Page
 *
 * Modern, premium marketing page for PW-(CbCR) Analyzer application.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-sm tracking-tight">PW</span>
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-primary text-lg leading-tight tracking-tight">
                  CbCR Analyzer
                </span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                  by PW Tax
                </span>
              </div>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Resources', href: '/resources' },
                { label: 'About', href: '#about' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50/80" />

        {/* Animated pulsating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Orange orb - top right - pulsating */}
          <div
            className="absolute top-[-5%] right-[5%] w-[500px] h-[500px] rounded-full animate-orb-1"
            style={{
              background: 'radial-gradient(circle, rgba(232, 93, 4, 0.2) 0%, rgba(232, 93, 4, 0.08) 40%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />

          {/* Teal orb - bottom left - pulsating */}
          <div
            className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full animate-orb-2"
            style={{
              background: 'radial-gradient(circle, rgba(8, 145, 178, 0.18) 0%, rgba(8, 145, 178, 0.06) 40%, transparent 70%)',
              filter: 'blur(70px)',
            }}
          />

          {/* Orange secondary orb - left center - floating */}
          <div
            className="absolute top-[35%] left-[10%] w-[350px] h-[350px] rounded-full animate-orb-3"
            style={{
              background: 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 60%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Teal secondary orb - top center - floating */}
          <div
            className="absolute top-[15%] left-[45%] w-[300px] h-[300px] rounded-full animate-orb-float"
            style={{
              background: 'radial-gradient(circle, rgba(8, 145, 178, 0.12) 0%, transparent 60%)',
              filter: 'blur(35px)',
            }}
          />

          {/* Orange accent orb - bottom right - pulsating */}
          <div
            className="absolute bottom-[15%] right-[15%] w-[250px] h-[250px] rounded-full animate-orb-1"
            style={{
              background: 'radial-gradient(circle, rgba(232, 93, 4, 0.12) 0%, transparent 60%)',
              filter: 'blur(30px)',
              animationDelay: '2s',
            }}
          />
        </div>

        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-full animate-fade-in-down shadow-lg shadow-orange-500/5">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Updated for 2024 OECD Requirements
                </span>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-[1.1] tracking-tight stagger-item animate-fade-in-up">
                  Validate Your
                  <br />
                  <span className="text-gradient">
                    CbC Reports
                  </span>
                  <br />
                  <span className="text-primary">Instantly</span>
                </h1>
              </div>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed stagger-item animate-fade-in-up delay-100">
                Professional-grade validation against OECD standards, country-specific rules,
                and Pillar 2 compliance. Trusted by tax professionals worldwide.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 stagger-item animate-fade-in-up delay-200">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 text-base px-8 h-12 rounded-xl transition-all hover:-translate-y-0.5"
                >
                  <Link href="/validate">
                    <Play className="mr-2 h-5 w-5" />
                    Start Free Validation
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-base h-12 rounded-xl border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-700 transition-all hover:-translate-y-0.5"
                >
                  <Link href="#how-it-works">
                    See How It Works
                  </Link>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 stagger-item animate-fade-in-up delay-300">
                {[
                  { icon: CheckCircle2, label: 'No registration required', color: 'text-emerald-500' },
                  { icon: Lock, label: '100% Secure', color: 'text-orange-500' },
                  { icon: Clock, label: 'Results in seconds', color: 'text-orange-500' },
                ].map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <badge.icon className={`h-4 w-4 ${badge.color}`} />
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero card */}
            <div className="hidden lg:block relative stagger-item animate-fade-in-right delay-300">
              <div className="relative">
                {/* Main card */}
                <div className="glass border border-white/30 rounded-2xl shadow-2xl p-6 hover-lift">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <FileCheck2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-lg">Validation Complete</div>
                      <div className="text-sm text-muted-foreground">CbCR_2023_Final.xml</div>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground font-medium">Compliance Score</span>
                      <span className="font-bold text-emerald-600">95%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full w-[95%] bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                        style={{ animation: 'slideRight 1s ease-out' }}
                      />
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: '0', label: 'Critical', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
                      { value: '2', label: 'Errors', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
                      { value: '5', label: 'Warnings', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
                      { value: '8', label: 'Info', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' },
                    ].map((stat) => (
                      <div key={stat.label} className={`p-3 ${stat.bg} rounded-xl border ${stat.border} text-center transition-transform hover:scale-105`}>
                        <div className={`text-xl font-bold ${stat.text}`}>{stat.value}</div>
                        <div className={`text-xs font-medium ${stat.text}`}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-orange-500/30 animate-float-slow">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    OECD Compliant
                  </span>
                </div>
                <div className="absolute -bottom-4 -left-4 glass border border-white/30 shadow-xl px-4 py-2 rounded-full text-sm font-semibold text-foreground animate-float delay-200">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-500" />
                    Pillar 2 Ready
                  </span>
                </div>

                {/* Decorative elements */}
                <div className="absolute -z-10 -top-8 -right-8 w-32 h-32 bg-orange-500/15 rounded-full blur-2xl animate-orb-1" />
                <div className="absolute -z-10 -bottom-8 -left-8 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl animate-orb-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-y border-border relative overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full animate-orb-float opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(232, 93, 4, 0.08) 0%, transparent 60%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute top-1/2 right-1/4 w-[250px] h-[250px] rounded-full animate-orb-3 opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(8, 145, 178, 0.08) 0%, transparent 60%)',
              filter: 'blur(40px)',
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '150+', label: 'Validation Rules', icon: FileCheck2, color: 'from-orange-500 to-orange-600' },
              { value: '15', label: 'Countries Supported', icon: Globe, color: 'from-cyan-500 to-teal-600' },
              { value: '99.9%', label: 'Accuracy Rate', icon: Award, color: 'from-orange-500 to-amber-500' },
              { value: '<3s', label: 'Average Validation Time', icon: Zap, color: 'from-cyan-500 to-cyan-600' },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={`text-center stagger-item animate-fade-in-up delay-${(index + 1) * 100}`}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} text-white mb-4 shadow-lg`}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 bg-background relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full animate-orb-1 opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(232, 93, 4, 0.1) 0%, transparent 60%)',
              filter: 'blur(50px)',
            }}
          />
          <div
            className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] rounded-full animate-orb-2 opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(8, 145, 178, 0.1) 0%, transparent 60%)',
              filter: 'blur(45px)',
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-600 text-sm font-semibold rounded-full mb-4 border border-orange-200">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-6 tracking-tight">
              Comprehensive Validation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Everything you need to ensure your CbC reports meet all regulatory requirements,
              with precision and confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: FileCheck2,
                title: 'OECD Compliance',
                description: 'Validate against BEPS Action 13 rules and OECD CbC-Schema v2.0. Catch formatting errors, missing fields, and business rule violations.',
                color: 'from-orange-500 to-orange-600',
                bgLight: 'bg-orange-500/5',
              },
              {
                icon: Globe,
                title: 'Country-Specific Rules',
                description: 'Luxembourg-specific validation included. TIN format checks, deadline verification, and local regulatory requirements.',
                color: 'from-cyan-500 to-teal-600',
                bgLight: 'bg-cyan-500/5',
              },
              {
                icon: Shield,
                title: 'Pillar 2 Ready',
                description: 'Check Safe Harbour eligibility for the Transitional CbCR Safe Harbour. Analyze De Minimis, ETR, and Routine Profits tests.',
                color: 'from-orange-500 to-amber-500',
                bgLight: 'bg-orange-500/5',
              },
            ].map((feature, index) => (
              <Card
                key={feature.title}
                className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${feature.bgLight} stagger-item animate-fade-in-up delay-${(index + 1) * 100}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to bottom right, var(--accent), transparent)` }} />
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[10%] left-[20%] w-[450px] h-[450px] rounded-full animate-orb-2 opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(232, 93, 4, 0.12) 0%, transparent 60%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute bottom-[20%] right-[15%] w-[350px] h-[350px] rounded-full animate-orb-1 opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(8, 145, 178, 0.1) 0%, transparent 60%)',
              filter: 'blur(50px)',
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-orange-500/10 to-orange-400/10 text-orange-600 text-sm font-semibold rounded-full mb-4 border border-orange-200">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-6 tracking-tight">
              Three Simple Steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Validate your CbC reports in seconds with our streamlined process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                icon: Upload,
                title: 'Upload Your File',
                description: 'Drag and drop your CbCR XML file or click to browse. Supports OECD CbC-Schema v2.0 format.',
                color: 'from-cyan-500 to-teal-600',
              },
              {
                step: '02',
                icon: Zap,
                title: 'Instant Validation',
                description: 'Your file is validated against 150+ rules covering XML structure, schema compliance, and business logic.',
                color: 'from-orange-500 to-orange-600',
              },
              {
                step: '03',
                icon: Download,
                title: 'Download Report',
                description: 'Get a detailed compliance report with actionable insights. Export as PDF or JSON for your records.',
                color: 'from-orange-500 to-amber-500',
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className={`relative text-center stagger-item animate-fade-in-up delay-${(index + 1) * 100}`}
              >
                {/* Connector line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-20 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-border via-accent/30 to-border" />
                )}

                {/* Step number */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground font-bold text-lg mb-6">
                  {item.step}
                </div>

                {/* Icon */}
                <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-xl`}>
                  <item.icon className="h-10 w-10 text-white" />
                </div>

                <h3 className="text-xl font-bold text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 text-base px-8 h-12 rounded-xl transition-all hover:-translate-y-0.5"
            >
              <Link href="/validate">
                Try It Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="about" className="py-24 md:py-32 bg-background relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[30%] right-[5%] w-[400px] h-[400px] rounded-full animate-orb-3 opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(232, 93, 4, 0.1) 0%, transparent 60%)',
              filter: 'blur(55px)',
            }}
          />
          <div
            className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] rounded-full animate-orb-float opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(8, 145, 178, 0.1) 0%, transparent 60%)',
              filter: 'blur(45px)',
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-600 text-sm font-semibold rounded-full mb-4 border border-orange-200">
              Trust & Expertise
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-6 tracking-tight">
              Built for Compliance Teams
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Trusted by tax professionals who demand accurate, up-to-date validation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Official OECD Guidelines',
                description: 'Built on the official OECD CbC XML Schema User Guide and BEPS Action 13 implementation guidance.',
                color: 'bg-orange-500/10 text-orange-600',
              },
              {
                icon: Calendar,
                title: 'Updated for 2024',
                description: 'Includes the latest OECD updates including May 2024 dividend exclusion guidance and Pillar 2 safe harbour rules.',
                color: 'bg-cyan-500/10 text-cyan-600',
              },
              {
                icon: Lock,
                title: '100% Secure',
                description: 'Files are processed in-memory and never stored on our servers. Your sensitive data stays private.',
                color: 'bg-orange-500/10 text-orange-600',
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className={`group flex items-start gap-4 p-6 bg-card rounded-2xl border border-border hover:border-accent/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 stagger-item animate-fade-in-up delay-${(index + 1) * 100}`}
              >
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-2 text-lg">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-slate-800 rounded-3xl p-10 md:p-16 text-center shadow-2xl">
            {/* Background decoration with animated orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/25 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-orb-1" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/15 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-orb-2" />
              <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-cyan-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl animate-orb-float" />
            </div>

            <div className="relative">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
                Ready to validate your
                <br />
                <span className="text-accent-foreground/90">CbC Report?</span>
              </h2>
              <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
                Join compliance teams who trust PW-(CbCR) Analyzer for accurate,
                instant validation of their Country-by-Country Reports.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base h-12 px-8 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all hover:-translate-y-0.5"
                >
                  <Link href="/register">
                    Create Free Account
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-white/30 text-white hover:bg-orange-500/20 hover:border-orange-400/50 text-base h-12 px-8 rounded-xl transition-all hover:-translate-y-0.5"
                >
                  <Link href="/validate">
                    Validate Without Account
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white/60 py-16 relative overflow-hidden">
        {/* Subtle animated orbs */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div
            className="absolute top-0 right-[20%] w-[300px] h-[300px] rounded-full animate-orb-float"
            style={{
              background: 'radial-gradient(circle, rgba(232, 93, 4, 0.15) 0%, transparent 60%)',
              filter: 'blur(50px)',
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-500/30">
                  PW
                </div>
                <span className="font-semibold text-white text-lg">
                  CbCR Analyzer
                </span>
              </Link>
              <p className="text-sm max-w-sm leading-relaxed">
                Professional validation tool for Country-by-Country Reports.
                Ensure OECD compliance and avoid costly filing errors.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                {['Validate', 'Features', 'How It Works', 'Resources'].map((item) => (
                  <li key={item}>
                    <Link href={`/${item.toLowerCase().replace(/ /g, '-')}`} className="hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                {['About', 'Privacy Policy', 'Terms of Service', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link href={`/${item.toLowerCase().replace(/ /g, '-')}`} className="hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} PW-(CbCR) Analyzer. All rights reserved.</p>
            <div className="flex items-center gap-2 text-white/80">
              <Building2 className="h-4 w-4" />
              <span>OECD BEPS Action 13 Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
