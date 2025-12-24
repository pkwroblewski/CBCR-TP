'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { FileUploadZone } from '@/components/upload';
import {
  FileCheck2,
  Settings2,
  Globe,
  Calendar,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * Validate Page
 *
 * File upload and validation configuration page.
 */
export default function ValidatePage() {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('LU');
  const [fiscalYear, setFiscalYear] = useState('2023');
  const [includePillar2, setIncludePillar2] = useState(true);

  const countries = [
    { code: 'LU', name: 'Luxembourg' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'CH', name: 'Switzerland' },
  ];

  const fiscalYears = ['2024', '2023', '2022', '2021', '2020'];

  /**
   * Handle validation complete
   */
  const handleValidationComplete = useCallback(
    (reportId: string) => {
      if (reportId) {
        router.push(`/reports/${reportId}`);
      }
    },
    [router]
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[{ label: 'Validate', icon: <FileCheck2 className="h-4 w-4" /> }]}
      />

      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--brand-primary)] flex items-center gap-2">
          <FileCheck2 className="h-7 w-7" aria-hidden="true" />
          Validate CbC Report
        </h1>
        <p className="text-slate-600 mt-1">
          Upload your CbC XML file to validate against OECD standards and country-specific rules.
        </p>
      </div>

      {/* File upload zone */}
      <FileUploadZone onValidationComplete={handleValidationComplete} />

      {/* Validation options */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowOptions(!showOptions)}
        >
          <CardTitle className="text-lg font-semibold text-[var(--brand-primary)] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Validation Options
            </span>
            {showOptions ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </CardTitle>
        </CardHeader>

        {showOptions && (
          <CardContent className="space-y-6">
            <Separator className="-mt-2" />

            {/* Country selection */}
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4" />
                Country-Specific Rules
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {countries.map((country) => (
                  <Button
                    key={country.code}
                    variant={selectedCountry === country.code ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCountry(country.code)}
                    className={
                      selectedCountry === country.code
                        ? 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]'
                        : ''
                    }
                  >
                    {country.code} - {country.name}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Select the jurisdiction to apply specific validation rules (TIN format, deadlines, etc.)
              </p>
            </div>

            <Separator />

            {/* Fiscal year */}
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Fiscal Year
              </label>
              <div className="flex flex-wrap gap-2">
                {fiscalYears.map((year) => (
                  <Button
                    key={year}
                    variant={fiscalYear === year ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiscalYear(year)}
                    className={
                      fiscalYear === year
                        ? 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]'
                        : ''
                    }
                  >
                    {year}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Select the fiscal year for deadline and threshold calculations.
              </p>
            </div>

            <Separator />

            {/* Pillar 2 option */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-slate-600 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Include Pillar 2 Analysis
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Check GloBE readiness and Transitional Safe Harbour eligibility.
                  </p>
                </div>
              </div>
              <Button
                variant={includePillar2 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIncludePillar2(!includePillar2)}
                className={
                  includePillar2
                    ? 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]'
                    : ''
                }
              >
                {includePillar2 ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Information panel */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-900 mb-2">
            What gets validated?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              XML structure and well-formedness
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              OECD CbC-Schema v2.0 compliance
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Business rules (MessageRefId, DocRefId, TIN format)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Country-specific requirements
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Data quality and consistency checks
            </li>
            {includePillar2 && (
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Pillar 2 Safe Harbour eligibility
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

