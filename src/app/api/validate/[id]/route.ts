import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  successResponse,
  unauthorized,
  notFound,
  handleError,
} from '@/lib/utils/api-response';
import {
  reportRateLimiter,
  checkRateLimit,
} from '@/lib/utils/rate-limit';

// =============================================================================
// GET /api/validate/[id]
// =============================================================================

/**
 * Get a validation report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit
    const rateLimitError = checkRateLimit(reportRateLimiter, request);
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

    // Get report (RLS will filter by user_id)
    const { data: report, error: reportError } = await supabase
      .from('validation_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (reportError || !report) {
      return notFound('Validation report not found');
    }

    // Get results
    const { data: results, error: resultsError } = await supabase
      .from('validation_results')
      .select('*')
      .eq('report_id', id)
      .order('created_at', { ascending: true });

    if (resultsError) {
      console.error('Failed to fetch results:', resultsError);
    }

    // Format response
    const formattedResults = (results || []).map((r) => ({
      ruleId: r.rule_id,
      category: r.category,
      severity: r.severity,
      message: r.message,
      xpath: r.xpath,
      details: r.details_json,
    }));

    return successResponse({
      id: report.id,
      filename: report.filename,
      uploadedAt: report.created_at,
      completedAt: report.updated_at,
      status: report.status,
      isValid: report.summary_json?.critical === 0,
      fiscalYear: report.fiscal_year,
      upeJurisdiction: report.upe_jurisdiction,
      summary: report.summary_json,
      results: formattedResults,
    });
  } catch (error) {
    return handleError(error);
  }
}

