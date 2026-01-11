import { BookOpen } from 'lucide-react';
import { ResourcesBreadcrumb } from '@/components/resources/ResourcesBreadcrumb';
import { GlossaryAccordion } from '@/components/resources/GlossaryAccordion';
import { GLOSSARY_TERMS } from '@/constants/glossary';

/**
 * Glossary Page
 *
 * A-Z reference of CbCR and Pillar 2 terminology.
 * Dark theme with blue accents.
 *
 * @module app/resources/glossary/page
 */

export const metadata = {
  title: 'Glossary | PW-(CbCR) Analyzer Resources',
  description:
    'Definitions for 45+ CbCR and Pillar 2 terms, from Action 13 to UTPR, with related concepts and references.',
};

export default function GlossaryPage() {
  const categoryCount = {
    cbcr: GLOSSARY_TERMS.filter((t) => t.category === 'cbcr').length,
    pillar2: GLOSSARY_TERMS.filter((t) => t.category === 'pillar2').length,
    general: GLOSSARY_TERMS.filter((t) => t.category === 'general').length,
    technical: GLOSSARY_TERMS.filter((t) => t.category === 'technical').length,
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <ResourcesBreadcrumb items={[{ label: 'Glossary' }]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
                Glossary
              </h1>
              <p className="text-slate-400">
                {GLOSSARY_TERMS.length} terms and definitions
              </p>
            </div>
          </div>
          <p className="text-slate-400 max-w-3xl">
            Comprehensive glossary of CbCR, Pillar 2, and international tax terminology.
            Each term includes a clear definition, related concepts, and references to
            official documentation where applicable.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-violet-400">
              {categoryCount.cbcr}
            </div>
            <div className="text-sm text-slate-500">CbCR Terms</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {categoryCount.pillar2}
            </div>
            <div className="text-sm text-slate-500">Pillar 2 Terms</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {categoryCount.general}
            </div>
            <div className="text-sm text-slate-500">General Terms</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {categoryCount.technical}
            </div>
            <div className="text-sm text-slate-500">Technical Terms</div>
          </div>
        </div>

        {/* Glossary Accordion */}
        <GlossaryAccordion terms={GLOSSARY_TERMS} />
      </div>
    </div>
  );
}
