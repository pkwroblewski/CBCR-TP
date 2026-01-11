import { FileCheck2 } from 'lucide-react';
import { ResourcesBreadcrumb } from '@/components/resources/ResourcesBreadcrumb';
import { RulesTable } from '@/components/resources/RulesTable';
import { ALL_VALIDATION_RULES } from '@/constants/validation-rules';
import { getRuleStatistics } from '@/lib/resources-utils';

/**
 * Validation Rules Page
 *
 * Comprehensive reference of all CbCR validation rules.
 * Dark theme with blue accents.
 *
 * @module app/resources/validation-rules/page
 */

export const metadata = {
  title: 'Validation Rules | PW-(CbCR) Analyzer Resources',
  description:
    'Complete library of 70+ CbCR validation rules with OECD error code mappings, XPath references, and remediation guidance.',
};

export default function ValidationRulesPage() {
  const stats = getRuleStatistics();

  return (
    <div className="min-h-screen bg-slate-950 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <ResourcesBreadcrumb items={[{ label: 'Validation Rules' }]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/20 flex items-center justify-center">
              <FileCheck2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
                Validation Rules
              </h1>
              <p className="text-slate-400">
                {stats.total} rules across {stats.byCategory.length} categories
              </p>
            </div>
          </div>
          <p className="text-slate-400 max-w-3xl">
            Complete reference library of CbCR validation rules. Each rule includes
            OECD error code mappings where applicable, XPath references for XML
            validation, and remediation suggestions to help resolve issues.
          </p>
        </div>

        {/* Stats - Severity breakdown (adds up to Total) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gradient">{stats.total}</div>
            <div className="text-sm text-slate-500">Total Rules</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {stats.bySeverity.find((s) => s.severity === 'critical')?.count || 0}
            </div>
            <div className="text-sm text-slate-500">Critical</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">
              {stats.bySeverity.find((s) => s.severity === 'error')?.count || 0}
            </div>
            <div className="text-sm text-slate-500">Error</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {stats.bySeverity.find((s) => s.severity === 'warning')?.count || 0}
            </div>
            <div className="text-sm text-slate-500">Warning</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {stats.bySeverity.find((s) => s.severity === 'info')?.count || 0}
            </div>
            <div className="text-sm text-slate-500">Info</div>
          </div>
        </div>
        
        {/* Additional stat - OECD Mapped (separate dimension) */}
        <div className="mb-8 text-sm text-slate-400 text-center">
          <span className="inline-flex items-center gap-2 bg-slate-900/50 border border-slate-800/50 rounded-lg px-4 py-2">
            <span className="text-blue-400 font-semibold">{stats.withOecdCode}</span> rules mapped to OECD error codes
          </span>
        </div>

        {/* Rules Table */}
        <RulesTable rules={ALL_VALIDATION_RULES} />
      </div>
    </div>
  );
}
