'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  FileSearch,
  CheckCircle2,
  FileText,
  Sparkles,
  Shield,
  Globe,
  Building2,
  ArrowRight,
  Zap,
  AlertTriangle,
  BookOpen,
  Users,
  Clock,
  Target,
  Layers,
  BadgeCheck,
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm">
                PW
              </div>
              <span className="font-semibold text-slate-100 text-lg">
                CbCR Analyzer
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-slate-300 hover:text-white">
                <Link href="/resources">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Resources
                </Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-500">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-6">
            <BookOpen className="h-4 w-4" />
            User Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
            How CbCR Analyzer Works
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            A comprehensive guide to validating your Country-by-Country Reports 
            before submission to tax authorities.
          </p>
        </div>
      </section>

      {/* What is CbCR Section */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-100 mb-6">
                What is Country-by-Country Reporting?
              </h2>
              <p className="text-slate-400 mb-4">
                <strong className="text-slate-200">Country-by-Country Reporting (CbCR)</strong> is a 
                requirement under the OECD&apos;s BEPS Action 13. Multinational enterprises (MNEs) with 
                consolidated group revenue of €750 million or more must file annual CbCR reports.
              </p>
              <p className="text-slate-400 mb-4">
                These reports provide tax authorities with a global picture of where MNEs earn 
                income, pay taxes, and conduct business activities.
              </p>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <Globe className="h-5 w-5 text-blue-400" />
                  <span>130+ Countries</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Building2 className="h-5 w-5 text-blue-400" />
                  <span>Large MNEs</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <span>Annual Filing</span>
                </div>
              </div>
            </div>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">CbCR Report Contains</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">Table 1: Revenue & Profit</p>
                      <p className="text-slate-500 text-sm">Revenue, profit/loss, taxes by jurisdiction</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">Table 2: Entity List</p>
                      <p className="text-slate-500 text-sm">All constituent entities per jurisdiction</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">Table 3: Additional Info</p>
                      <p className="text-slate-500 text-sm">Explanatory notes and context</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How Validation Works Section */}
      <section className="py-16 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              How Our Validation Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              CbCR Analyzer uses a multi-layer validation approach to catch errors 
              before you submit to tax authorities.
            </p>
          </div>

          {/* Validation Flow Diagram */}
          <div className="relative">
            {/* Connection lines - hidden on mobile, positioned at center of icons */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 z-0" />
            
            <div className="grid md:grid-cols-4 gap-6 relative z-10">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">1. Upload</h3>
                <p className="text-slate-400 text-sm">
                  Upload your CbCR XML file. We support OECD CbC-Schema v2.0 format.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-600/30">
                  <FileSearch className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">2. Analyze</h3>
                <p className="text-slate-400 text-sm">
                  70+ validation rules check your file for errors, warnings, and compliance issues.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-600/30">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">3. AI Insights</h3>
                <p className="text-slate-400 text-sm">
                  Optional AI explains findings in plain language and suggests fixes.
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/30">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">4. Report</h3>
                <p className="text-slate-400 text-sm">
                  Get a detailed report with all findings, severity levels, and recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Validation Categories Section */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              What We Check
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Our validation engine checks six categories of potential issues to ensure 
              your CbCR file is ready for submission.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category 1 */}
            <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Layers className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">XML Structure</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Validates that your file is well-formed XML with proper encoding and structure.
                </p>
                <ul className="text-slate-500 text-sm space-y-1">
                  <li>• UTF-8 encoding</li>
                  <li>• Valid XML syntax</li>
                  <li>• Proper nesting</li>
                </ul>
              </CardContent>
            </Card>

            {/* Category 2 */}
            <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <BadgeCheck className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Schema Compliance</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Checks compliance with OECD CbC-Schema v2.0 XSD requirements.
                </p>
                <ul className="text-slate-500 text-sm space-y-1">
                  <li>• Required elements</li>
                  <li>• Data types</li>
                  <li>• Field lengths</li>
                </ul>
              </CardContent>
            </Card>

            {/* Category 3 */}
            <Card className="bg-slate-900/50 border-slate-800 hover:border-orange-500/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Business Rules</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Enforces OECD business rules for CbCR submissions.
                </p>
                <ul className="text-slate-500 text-sm space-y-1">
                  <li>• DocRefId uniqueness</li>
                  <li>• MessageType indicators</li>
                  <li>• Correction handling</li>
                </ul>
              </CardContent>
            </Card>

            {/* Category 4 */}
            <Card className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Country Rules</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Validates jurisdiction-specific requirements like TIN formats.
                </p>
                <ul className="text-slate-500 text-sm space-y-1">
                  <li>• Luxembourg TIN format</li>
                  <li>• Filing deadlines</li>
                  <li>• Local requirements</li>
                </ul>
              </CardContent>
            </Card>

            {/* Category 5 */}
            <Card className="bg-slate-900/50 border-slate-800 hover:border-amber-500/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Data Quality</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Cross-checks data for consistency and reasonableness.
                </p>
                <ul className="text-slate-500 text-sm space-y-1">
                  <li>• Revenue totals</li>
                  <li>• Tax rate sanity</li>
                  <li>• Entity completeness</li>
                </ul>
              </CardContent>
            </Card>

            {/* Category 6 */}
            <Card className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Pillar 2 Readiness</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Assesses eligibility for GloBE safe harbour provisions.
                </p>
                <ul className="text-slate-500 text-sm space-y-1">
                  <li>• De minimis test</li>
                  <li>• Simplified ETR</li>
                  <li>• Routine profits</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Severity Levels Section */}
      <section className="py-16 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              Understanding Severity Levels
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Each finding is classified by severity to help you prioritize what needs immediate attention.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-slate-900/50 border-l-4 border-l-red-500 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 font-bold">!</span>
                  </div>
                  <h3 className="text-lg font-semibold text-red-400">Critical</h3>
                </div>
                <p className="text-slate-400 text-sm">
                  <strong className="text-slate-200">Will cause rejection.</strong> These must be 
                  fixed before submission or your file will be rejected by the tax authority.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-l-4 border-l-orange-500 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 font-bold">!</span>
                  </div>
                  <h3 className="text-lg font-semibold text-orange-400">Error</h3>
                </div>
                <p className="text-slate-400 text-sm">
                  <strong className="text-slate-200">May cause issues.</strong> These should be 
                  reviewed and corrected to avoid potential processing problems.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-l-4 border-l-amber-500 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <span className="text-amber-400 font-bold">?</span>
                  </div>
                  <h3 className="text-lg font-semibold text-amber-400">Warning</h3>
                </div>
                <p className="text-slate-400 text-sm">
                  <strong className="text-slate-200">Data quality concern.</strong> The file may 
                  be accepted but these items should be reviewed for accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-l-4 border-l-blue-500 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-bold">i</span>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-400">Info</h3>
                </div>
                <p className="text-slate-400 text-sm">
                  <strong className="text-slate-200">Best practice suggestion.</strong> Optional 
                  improvements that can enhance your report quality.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm mb-4">
                <Sparkles className="h-4 w-4" />
                AI-Powered
              </div>
              <h2 className="text-3xl font-bold text-slate-100 mb-6">
                AI Explanations & Insights
              </h2>
              <p className="text-slate-400 mb-4">
                Don&apos;t understand a technical error message? Our AI assistant translates 
                complex validation findings into plain language that anyone can understand.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <span className="text-slate-300">Plain-language explanations of each finding</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <span className="text-slate-300">Specific suggestions for how to fix issues</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <span className="text-slate-300">Executive summary of your overall compliance</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <span className="text-slate-300">Prioritized action list for remediation</span>
                </li>
              </ul>
            </div>
            <Card className="bg-gradient-to-br from-purple-500/10 via-slate-900/50 to-slate-900/50 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-purple-400 mb-4">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">AI Explanation Example</span>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-400 font-mono mb-2">DOC-003: DocRefId not unique</p>
                  <p className="text-xs text-slate-500">Technical error message</p>
                </div>
                <div className="text-slate-300 text-sm leading-relaxed">
                  <p className="mb-2">
                    <strong>What this means:</strong> The document reference ID &quot;ABC123&quot; has 
                    already been used in a previous submission. Each DocRefId must be globally unique.
                  </p>
                  <p className="mb-2">
                    <strong>Why it matters:</strong> Tax authorities use DocRefId to track and match 
                    records. Duplicates cause processing failures.
                  </p>
                  <p className="text-emerald-400">
                    <strong>How to fix:</strong> Generate a new unique identifier using the format 
                    &quot;[CountryCode].[Year].[Timestamp]&quot;.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              Security & Privacy
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Your CbCR data contains sensitive financial information. We take security seriously.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">No File Storage</h3>
                <p className="text-slate-400 text-sm">
                  Your XML files are processed in memory and never stored on our servers. 
                  Only validation results are saved.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Encrypted Transit</h3>
                <p className="text-slate-400 text-sm">
                  All data is transmitted over HTTPS with TLS encryption. 
                  Your files never travel unprotected.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Invite Only</h3>
                <p className="text-slate-400 text-sm">
                  Access is restricted to authorized users only. 
                  No public sign-ups ensures controlled access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Ready to Validate Your CbCR?
          </h2>
          <p className="text-slate-400 mb-8">
            Sign in to start validating your Country-by-Country Reports with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-500 px-8">
              <Link href="/sign-in">
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Link href="/resources">
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Resources
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                PW
              </div>
              <span className="text-slate-400">CbCR Analyzer</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/" className="hover:text-slate-300">Home</Link>
              <Link href="/resources" className="hover:text-slate-300">Resources</Link>
              <Link href="/sign-in" className="hover:text-slate-300">Sign In</Link>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} CbCR Analyzer
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
