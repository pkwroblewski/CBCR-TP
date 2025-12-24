import { FileCheck2 } from 'lucide-react';
import { ResourcesBreadcrumb } from '@/components/resources/ResourcesBreadcrumb';
import { RulesTable } from '@/components/resources/RulesTable';
import { ALL_VALIDATION_RULES } from '@/constants/validation-rules';
import { getRuleStatistics } from '@/lib/resources-utils';

/**
 * Validation Rules Page
 *
 * Comprehensive reference of all CbCR validation rules.
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
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <ResourcesBreadcrumb items={[{ label: 'Validation Rules' }]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <FileCheck2 className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Validation Rules
              </h1>
              <p className="text-muted-foreground">
                {stats.total} rules across {stats.byCategory.length} categories
              </p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Complete reference library of CbCR validation rules. Each rule includes
            OECD error code mappings where applicable, XPath references for XML
            validation, and remediation suggestions to help resolve issues.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Rules</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.bySeverity.find((s) => s.severity === 'critical')?.count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.bySeverity.find((s) => s.severity === 'error')?.count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.withOecdCode}
            </div>
            <div className="text-sm text-muted-foreground">OECD Mapped</div>
          </div>
        </div>

        {/* Rules Table */}
        <RulesTable rules={ALL_VALIDATION_RULES} />
      </div>
    </div>
  );
}
