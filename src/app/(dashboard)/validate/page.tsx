'use client';

import { useState, useCallback } from 'react';

// Disable static generation for this page - it uses Convex hooks
export const dynamic = 'force-dynamic';
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
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-2">
          <FileCheck2 className="h-7 w-7 text-blue-400" aria-hidden="true" />
          Validate CbC Report
        </h1>
        <p className="text-slate-400 mt-1">
          Upload your CbC XML file to validate against OECD standards and country-specific rules.
        </p>
      </div>

      {/* File upload zone */}
      <FileUploadZone onValidationComplete={handleValidationComplete} />

      {/* Validation options */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader
          className="cursor-pointer hover:bg-slate-800/30 transition-colors rounded-t-lg"
          onClick={() => setShowOptions(!showOptions)}
        >
          <CardTitle className="text-lg font-semibold text-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-400" />
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
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-blue-400" />
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
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
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
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-400" />
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
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
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
                <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-slate-300">
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
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }
              >
                {includePillar2 ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Information panel */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-300 mb-3">
            What gets validated?
          </h3>
          <ul className="text-sm text-blue-200/80 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              XML structure and well-formedness
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              OECD CbC-Schema v2.0 compliance
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Business rules (MessageRefId, DocRefId, TIN format)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Country-specific requirements
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Data quality and consistency checks
            </li>
            {includePillar2 && (
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Pillar 2 Safe Harbour eligibility
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

