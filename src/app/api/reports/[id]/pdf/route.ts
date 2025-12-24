import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  unauthorized,
  notFound,
  handleError,
} from '@/lib/utils/api-response';
import {
  pdfRateLimiter,
  checkRateLimit,
} from '@/lib/utils/rate-limit';
import {
  generatePdfReport,
  createMinimalReport,
  formatDbResults,
} from '@/lib/utils/generate-pdf';
import type { ValidationCategory } from '@/types/validation';

// =============================================================================
// GET /api/reports/[id]/pdf
// =============================================================================

/**
 * Generate and download PDF validation report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit
    const rateLimitError = checkRateLimit(pdfRateLimiter, request);
    if (rateLimitError) return rateLimitError;

    const { id } = await params;

    // Get user session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    // Get report (RLS filters by user_id)
    const { data: report, error: reportError } = await supabase
      .from('validation_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (reportError || !report) {
      return notFound('Report not found');
    }

    // Get results
    const { data: results } = await supabase
      .from('validation_results')
      .select('*')
      .eq('report_id', id)
      .order('created_at', { ascending: true });

    // Format results
    const formattedResults = formatDbResults(results || []);

    // Calculate by category
    const byCategory: Record<string, number> = {};
    for (const result of formattedResults) {
      byCategory[result.category] = (byCategory[result.category] || 0) + 1;
    }

    // Create report object
    const validationReport = createMinimalReport({
      id: report.id,
      filename: report.filename,
      uploadedAt: report.created_at,
      completedAt: report.updated_at,
      status: report.status,
      isValid: report.summary_json?.critical === 0,
      fiscalYear: report.fiscal_year,
      upeJurisdiction: report.upe_jurisdiction,
      summary: report.summary_json || {
        critical: 0,
        errors: 0,
        warnings: 0,
        info: 0,
        passed: 0,
        total: 0,
      },
      byCategory: byCategory as Record<ValidationCategory, number>,
      results: formattedResults,
    });

    // Generate PDF
    const { buffer, filename } = await generatePdfReport(validationReport);

    // Convert Buffer to Uint8Array for Response
    const uint8Array = new Uint8Array(buffer);

    // Return PDF as downloadable file
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return handleError(error);
  }
}
