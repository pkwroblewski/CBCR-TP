import Link from 'next/link';
import {
  FileCheck2,
  AlertTriangle,
  Globe2,
  Scale,
  BookOpen,
  ExternalLink,
  ArrowRight,
  Database,
  Shield,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getResourcesHubStatistics } from '@/lib/resources-utils';

/**
 * Resources Hub Page
 *
 * Main landing page for the Knowledge Base / Resources section.
 * Dark theme with blue accents.
 */

export const metadata = {
  title: 'Resources & Knowledge Base | CbCR Analyzer',
  description:
    'Complete reference library for CbCR validation, OECD guidelines, country compliance, and Pillar 2 information.',
};

// Resource section configuration
const RESOURCE_SECTIONS = [
  {
    id: 'validation-rules',
    title: 'Validation Rules',
    description: 'Comprehensive library of 70+ validation rules with OECD error code mappings, XPath references, and remediation guidance.',
    href: '/resources/validation-rules',
    icon: FileCheck2,
    gradient: 'from-violet-500 to-violet-600',
    shadow: 'shadow-violet-500/20',
  },
  {
    id: 'oecd-errors',
    title: 'OECD Common Errors',
    description: 'Reference guide to the 28 common errors identified by the OECD, including severity levels and correction procedures.',
    href: '/resources/oecd-errors',
    icon: AlertTriangle,
    gradient: 'from-orange-500 to-orange-600',
    shadow: 'shadow-orange-500/20',
  },
  {
    id: 'countries',
    title: 'Country Compliance',
    description: 'TIN validation patterns, filing deadlines, and CbCR participation status for 195 jurisdictions worldwide.',
    href: '/resources/countries',
    icon: Globe2,
    gradient: 'from-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-500/20',
  },
  {
    id: 'pillar2',
    title: 'Pillar 2 Guide',
    description: 'GloBE rules, safe harbours, IIR/UTPR mechanisms, and jurisdiction implementation status for global minimum tax.',
    href: '/resources/pillar2',
    icon: Scale,
    gradient: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/20',
  },
  {
    id: 'glossary',
    title: 'Glossary',
    description: 'Definitions for 45+ CbCR and Pillar 2 terms, from "Action 13" to "UTPR", with related concepts and references.',
    href: '/resources/glossary',
    icon: BookOpen,
    gradient: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/20',
  },
  {
    id: 'external',
    title: 'External Resources',
    description: 'Links to OECD documents, EU government portals, tax authority filing systems, and technical specifications.',
    href: '/resources/external',
    icon: ExternalLink,
    gradient: 'from-cyan-500 to-cyan-600',
    shadow: 'shadow-cyan-500/20',
  },
];

export default function ResourcesPage() {
  const stats = getResourcesHubStatistics();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <Database className="h-4 w-4" />
              Knowledge Base
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-6">
              Resources & Reference Library
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Your complete guide to CbCR validation, OECD requirements, country compliance,
              and Pillar 2 global minimum tax. Access the same reference materials used by
              our validation engine.
            </p>
          </div>

          {/* Statistics */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { value: `${stats.validationRules}+`, label: 'Validation Rules' },
              { value: stats.oecdErrors.toString(), label: 'OECD Error Codes' },
              { value: stats.countries.toString(), label: 'Countries' },
              { value: `${stats.glossaryTerms}+`, label: 'Glossary Terms' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gradient">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Sections Grid */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RESOURCE_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.id} href={section.href} className="group">
                  <Card className="h-full bg-slate-900/50 border-slate-800/50 hover:border-blue-500/30 transition-all duration-300 group-hover:-translate-y-1">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.gradient} shadow-lg ${section.shadow} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="flex items-center gap-2 text-slate-100">
                        {section.title}
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-slate-400">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-16 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">
              Quick Access
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Jump directly to frequently accessed information
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: '/resources/validation-rules?category=schema', icon: Shield, color: 'violet', label: 'Schema Compliance Rules' },
              { href: '/resources/countries?filter=pillar2', icon: Scale, color: 'blue', label: 'Pillar 2 Jurisdictions' },
              { href: '/resources/oecd-errors?severity=critical', icon: AlertTriangle, color: 'red', label: 'Critical Errors' },
              { href: '/resources/external?category=oecd', icon: FileText, color: 'cyan', label: 'OECD Documents' },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:border-blue-500/30 hover:bg-slate-800/50 transition-all group"
              >
                <item.icon className={`h-5 w-5 text-${item.color}-400`} />
                <span className="font-medium text-slate-300 group-hover:text-slate-100 transition-colors">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-500/10 via-slate-900/50 to-indigo-500/10 border border-blue-500/20 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-blue-500/20 rounded-full blur-[100px]" />
            
            <div className="relative text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">
                Ready to Validate Your CbCR Files?
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto mb-8">
                Use our validation engine to check your CbCR XML files against all these rules
                automatically. Get instant feedback and detailed error reports.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:brightness-110 transition-all"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl border border-slate-700 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
