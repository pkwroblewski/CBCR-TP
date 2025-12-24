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
 * Displays overview statistics and links to all resource categories.
 *
 * @module app/resources/page
 */

export const metadata = {
  title: 'Resources & Knowledge Base | PW-(CbCR) Analyzer',
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
    color: 'text-violet-600',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  {
    id: 'oecd-errors',
    title: 'OECD Common Errors',
    description: 'Reference guide to the 28 common errors identified by the OECD, including severity levels and correction procedures.',
    href: '/resources/oecd-errors',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    id: 'countries',
    title: 'Country Compliance',
    description: 'TIN validation patterns, filing deadlines, and CbCR participation status for 195 jurisdictions worldwide.',
    href: '/resources/countries',
    icon: Globe2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: 'pillar2',
    title: 'Pillar 2 Guide',
    description: 'GloBE rules, safe harbours, IIR/UTPR mechanisms, and jurisdiction implementation status for global minimum tax.',
    href: '/resources/pillar2',
    icon: Scale,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    id: 'glossary',
    title: 'Glossary',
    description: 'Definitions for 45+ CbCR and Pillar 2 terms, from "Action 13" to "UTPR", with related concepts and references.',
    href: '/resources/glossary',
    icon: BookOpen,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    id: 'external',
    title: 'External Resources',
    description: 'Links to OECD documents, EU government portals, tax authority filing systems, and technical specifications.',
    href: '/resources/external',
    icon: ExternalLink,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
];

export default function ResourcesPage() {
  const stats = getResourcesHubStatistics();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <Database className="h-4 w-4" />
              Knowledge Base
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Resources & Reference Library
            </h1>
            <p className="text-lg text-muted-foreground">
              Your complete guide to CbCR validation, OECD requirements, country compliance,
              and Pillar 2 global minimum tax. Access the same reference materials used by
              our validation engine.
            </p>
          </div>

          {/* Statistics */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <div className="text-3xl font-bold text-primary">{stats.validationRules}+</div>
              <div className="text-sm text-muted-foreground">Validation Rules</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <div className="text-3xl font-bold text-primary">{stats.oecdErrors}</div>
              <div className="text-sm text-muted-foreground">OECD Error Codes</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <div className="text-3xl font-bold text-primary">{stats.countries}</div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <div className="text-3xl font-bold text-primary">{stats.glossaryTerms}+</div>
              <div className="text-sm text-muted-foreground">Glossary Terms</div>
            </div>
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
                  <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-accent/50 group-hover:-translate-y-1">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-4`}>
                        <Icon className={`h-6 w-6 ${section.color}`} />
                      </div>
                      <CardTitle className="flex items-center gap-2">
                        {section.title}
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" />
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
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
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Quick Access
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Jump directly to frequently accessed information
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/resources/validation-rules?category=schema"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-accent/50 hover:shadow-md transition-all"
            >
              <Shield className="h-5 w-5 text-violet-600" />
              <span className="font-medium">Schema Compliance Rules</span>
            </Link>
            <Link
              href="/resources/countries?filter=pillar2"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-accent/50 hover:shadow-md transition-all"
            >
              <Scale className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Pillar 2 Jurisdictions</span>
            </Link>
            <Link
              href="/resources/oecd-errors?severity=critical"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-accent/50 hover:shadow-md transition-all"
            >
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium">Critical Errors</span>
            </Link>
            <Link
              href="/resources/external?category=oecd"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border hover:border-accent/50 hover:shadow-md transition-all"
            >
              <FileText className="h-5 w-5 text-cyan-600" />
              <span className="font-medium">OECD Documents</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 sm:p-12 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Validate Your CbCR Files?
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Use our validation engine to check your CbCR XML files against all these rules
              automatically. Get instant feedback and detailed error reports.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
