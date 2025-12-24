import { Globe2 } from 'lucide-react';
import { ResourcesBreadcrumb } from '@/components/resources/ResourcesBreadcrumb';
import { CountryTable, type SerializableCountry } from '@/components/resources/CountryTable';
import { getAllCountries, getCountryStatistics } from '@/lib/resources-utils';

/**
 * Country Compliance Page
 *
 * Reference guide for country-specific CbCR compliance information.
 *
 * @module app/resources/countries/page
 */

export const metadata = {
  title: 'Country Compliance | PW-(CbCR) Analyzer Resources',
  description:
    'TIN validation patterns, filing deadlines, and CbCR participation status for 195 jurisdictions worldwide.',
};

export default function CountriesPage() {
  const rawCountries = getAllCountries();
  const stats = getCountryStatistics();

  // Serialize countries for client component (convert RegExp to string)
  const countries: SerializableCountry[] = rawCountries.map((c) => ({
    code: c.code,
    name: c.name,
    cbcrParticipant: c.cbcrParticipant,
    pillar2Implemented: c.pillar2Implemented,
    tinFormat: c.tinFormat,
    tinPatternSource: c.tinPattern?.source,
    filingDeadlineMonths: c.filingDeadlineMonths,
    currencyCode: c.currencyCode,
  }));

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <ResourcesBreadcrumb items={[{ label: 'Country Compliance' }]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Globe2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Country Compliance
              </h1>
              <p className="text-muted-foreground">
                {stats.total} jurisdictions with compliance information
              </p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Comprehensive guide to country-specific CbCR requirements. Includes TIN
            (Tax Identification Number) validation patterns, filing deadlines, CbCR
            participation status, and Pillar 2 implementation information.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Countries</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {stats.cbcrParticipants}
            </div>
            <div className="text-sm text-muted-foreground">CbCR Participants</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.pillar2Implemented}
            </div>
            <div className="text-sm text-muted-foreground">Pillar 2 Active</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-violet-600">
              {stats.withTinPattern}
            </div>
            <div className="text-sm text-muted-foreground">TIN Patterns</div>
          </div>
        </div>

        {/* Country Table */}
        <CountryTable countries={countries} />
      </div>
    </div>
  );
}
