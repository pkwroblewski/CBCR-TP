'use client';

import { use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ValidationSummary,
  CategoryTabs,
  QuickActions,
} from '@/components/validation';
import { ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { ValidationResult, ValidationReport, ValidationSummary as ValidationSummaryType } from '@/types/validation';
import {
  ArrowLeft,
  FileCheck2,
  RefreshCw,
  Calendar,
  Globe,
  Building2,
  Hash,
  Clock,
} from 'lucide-react';

/**
 * Report Detail Page
 *
 * Full validation report view with results organized by category.
 */
export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // TODO: Fetch from Supabase
  const report: ValidationReport = {
    id,
    filename: 'CbCR_2023_Q4_Final.xml',
    uploadedAt: '2024-01-15T14:30:00Z',
    completedAt: '2024-01-15T14:30:45Z',
    status: 'completed',
    isValid: true,
    fiscalYear: '2023',
    upeJurisdiction: 'LU',
    upeName: 'Acme Holdings S.à r.l.',
    messageRefId: 'LU2024CBC0001234567890',
    jurisdictionCount: 12,
    entityCount: 45,
    durationMs: 4523,
    summary: {
      critical: 0,
      errors: 2,
      warnings: 8,
      info: 15,
      passed: 142,
      total: 167,
    },
    byCategory: {
      [ValidationCategory.XML_WELLFORMEDNESS]: 0,
      [ValidationCategory.SCHEMA_COMPLIANCE]: 1,
      [ValidationCategory.BUSINESS_RULES]: 3,
      [ValidationCategory.COUNTRY_RULES]: 2,
      [ValidationCategory.DATA_QUALITY]: 12,
      [ValidationCategory.PILLAR2_READINESS]: 7,
    },
    results: generateMockResults(),
  };

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a365d] flex items-center gap-2">
            <FileCheck2 className="h-7 w-7" />
            Validation Report
          </h1>
          <p className="text-slate-600 mt-1 truncate max-w-xl" title={report.filename}>
            {report.filename}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/validate?revalidate=${id}`}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-validate
            </Link>
          </Button>
        </div>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Fiscal Year
            </div>
            <p className="text-lg font-semibold text-[#1a365d]">
              {report.fiscalYear}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Globe className="h-4 w-4" />
              UPE Jurisdiction
            </div>
            <p className="text-lg font-semibold text-[#1a365d]">
              {report.upeJurisdiction}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Building2 className="h-4 w-4" />
              Entities
            </div>
            <p className="text-lg font-semibold text-[#1a365d]">
              {report.entityCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Hash className="h-4 w-4" />
              Jurisdictions
            </div>
            <p className="text-lg font-semibold text-[#1a365d]">
              {report.jurisdictionCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary and quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ValidationSummary
            summary={report.summary}
            isValid={report.isValid}
            metadata={{
              filename: report.filename,
              fiscalYear: report.fiscalYear,
              upeJurisdiction: report.upeJurisdiction,
              upeName: report.upeName,
              jurisdictionCount: report.jurisdictionCount,
              entityCount: report.entityCount,
            }}
            byCategory={report.byCategory as Record<string, number>}
            durationMs={report.durationMs}
          />
        </div>
        <div className="space-y-4">
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions
                report={report}
                onNewValidation={() => window.location.href = '/validate'}
                compact
              />
            </CardContent>
          </Card>

          {/* Report info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">MessageRefId</span>
                <code className="text-xs bg-slate-100 px-2 py-1 rounded truncate max-w-[180px]" title={report.messageRefId}>
                  {report.messageRefId}
                </code>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Uploaded</span>
                <span className="text-slate-700">{formatDate(report.uploadedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Completed</span>
                <span className="text-slate-700">{formatDate(report.completedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Duration</span>
                <span className="text-slate-700">
                  {report.durationMs ? `${(report.durationMs / 1000).toFixed(2)}s` : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results by category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#1a365d]">
            Validation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryTabs results={report.results} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Generate mock validation results for demo
 */
function generateMockResults(): ValidationResult[] {
  const results: ValidationResult[] = [
    {
      ruleId: 'MSG-001',
      category: ValidationCategory.BUSINESS_RULES,
      severity: ValidationSeverity.WARNING,
      message: 'MessageRefId format could be improved for better tracking',
      xpath: '/CBC_OECD/MessageSpec/MessageRefId',
      suggestion: 'Consider using format: JURISDICTION + YEAR + SEQUENCE',
      reference: 'OECD CbC XML Schema User Guide, Section 3.2',
    },
    {
      ruleId: 'DOC-003',
      category: ValidationCategory.SCHEMA_COMPLIANCE,
      severity: ValidationSeverity.ERROR,
      message: 'CorrDocRefId provided but DocTypeIndic is not OECD2 or OECD3',
      xpath: '/CBC_OECD/CbcBody/CbcReports[3]/DocSpec',
      suggestion: 'Remove CorrDocRefId or change DocTypeIndic to OECD2/OECD3',
      details: { docTypeIndic: 'OECD1', corrDocRefId: 'LU2023DOC001' },
    },
    {
      ruleId: 'TIN-002',
      category: ValidationCategory.COUNTRY_RULES,
      severity: ValidationSeverity.ERROR,
      message: 'TIN format does not match Luxembourg Matricule national pattern',
      xpath: '/CBC_OECD/CbcBody/CbcReports[5]/ConstEntities/ConstEntity[2]/TIN',
      suggestion: 'Luxembourg TIN should be 11-13 numeric digits',
      details: { providedTin: 'ABC123', expectedFormat: '11-13 digits' },
    },
    {
      ruleId: 'XFV-002',
      category: ValidationCategory.DATA_QUALITY,
      severity: ValidationSeverity.WARNING,
      message: 'Revenue is zero but Employees count is greater than zero',
      xpath: '/CBC_OECD/CbcBody/CbcReports[7]/Summary',
      suggestion: 'Verify if this entity had any revenue-generating activities',
      details: { revenue: 0, employees: 25 },
    },
    {
      ruleId: 'P2-SH-001',
      category: ValidationCategory.PILLAR2_READINESS,
      severity: ValidationSeverity.INFO,
      message: 'Jurisdiction qualifies for De Minimis Safe Harbour exclusion',
      xpath: '/CBC_OECD/CbcBody/CbcReports[2]',
      details: { jurisdiction: 'MT', revenue: 5000000, profit: 500000 },
    },
    {
      ruleId: 'SUM-003',
      category: ValidationCategory.DATA_QUALITY,
      severity: ValidationSeverity.WARNING,
      message: 'Large difference between TaxPaid and TaxAccrued',
      xpath: '/CBC_OECD/CbcBody/CbcReports[4]/Summary',
      suggestion: 'Verify timing differences or refunds are correctly reflected',
      details: { taxPaid: 1500000, taxAccrued: 3200000, difference: '113%' },
    },
  ];

  // Add more mock results for different categories
  for (let i = 0; i < 10; i++) {
    results.push({
      ruleId: `QUA-${String(i + 1).padStart(3, '0')}`,
      category: ValidationCategory.DATA_QUALITY,
      severity: i % 4 === 0 ? ValidationSeverity.WARNING : ValidationSeverity.INFO,
      message: `Data quality check ${i + 1}: Cross-reference validation passed with notes`,
      xpath: `/CBC_OECD/CbcBody/CbcReports[${i + 1}]/Summary`,
    });
  }

  return results;
}

