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
// GET /api/reports/[id]
// =============================================================================

/**
 * Get a validation report by ID with all results
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

    // Get report with results (RLS filters by user_id)
    const { data: report, error: reportError } = await supabase
      .from('validation_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (reportError || !report) {
      return notFound('Report not found');
    }

    // Get all results for this report
    const { data: results, error: resultsError } = await supabase
      .from('validation_results')
      .select('*')
      .eq('report_id', id)
      .order('created_at', { ascending: true });

    if (resultsError) {
      console.error('Failed to fetch results:', resultsError);
    }

    // Format results
    const formattedResults = (results || []).map((r) => ({
      ruleId: r.rule_id,
      category: r.category,
      severity: r.severity,
      message: r.message,
      xpath: r.xpath,
      details: r.details_json,
    }));

    // Calculate by category
    const byCategory: Record<string, number> = {};
    for (const result of formattedResults) {
      byCategory[result.category] = (byCategory[result.category] || 0) + 1;
    }

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
      byCategory,
      results: formattedResults,
    });
  } catch (error) {
    return handleError(error);
  }
}

// =============================================================================
// DELETE /api/reports/[id]
// =============================================================================

/**
 * Delete a validation report
 */
export async function DELETE(
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

    // Delete report (RLS ensures user can only delete their own)
    // Results will be cascade deleted via foreign key
    const { error } = await supabase
      .from('validation_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete report:', error);
      return notFound('Report not found or already deleted');
    }

    return successResponse({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}

