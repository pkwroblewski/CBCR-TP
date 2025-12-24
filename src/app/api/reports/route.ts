import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  successResponse,
  unauthorized,
  badRequest,
  handleError,
} from '@/lib/utils/api-response';
import {
  reportRateLimiter,
  checkRateLimit,
} from '@/lib/utils/rate-limit';
import {
  validateOrigin,
  addCorsHeaders,
} from '@/lib/utils/security';

// =============================================================================
// GET /api/reports
// =============================================================================

/**
 * List user's validation reports
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 10, max: 100)
 * - status: Filter by status ('completed', 'failed', 'pending')
 * - startDate: Filter by date range start (ISO string)
 * - endDate: Filter by date range end (ISO string)
 * - sortBy: Sort field ('created_at', 'filename', 'status')
 * - sortOrder: Sort direction ('asc', 'desc')
 */
/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const originResult = validateOrigin(request);
  return addCorsHeaders(
    new Response(null, { status: 204 }),
    originResult.origin ?? null
  );
}

export async function GET(request: NextRequest) {
  try {
    // Validate origin for CORS
    const originResult = validateOrigin(request);

    // Check rate limit
    const rateLimitError = checkRateLimit(reportRateLimiter, request);
    if (rateLimitError) return rateLimitError;

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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate sort parameters
    const validSortFields = ['created_at', 'filename', 'status', 'fiscal_year'];
    const validSortOrders = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy)) {
      return badRequest(`Invalid sortBy. Valid options: ${validSortFields.join(', ')}`);
    }

    if (!validSortOrders.includes(sortOrder)) {
      return badRequest('Invalid sortOrder. Valid options: asc, desc');
    }

    // Build query
    let query = supabase
      .from('validation_reports')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data: reports, error, count } = await query;

    if (error) {
      console.error('Failed to fetch reports:', error);
      throw error;
    }

    // Format response
    const formattedReports = (reports || []).map((report) => ({
      id: report.id,
      filename: report.filename,
      uploadedAt: report.created_at,
      status: report.status,
      fiscalYear: report.fiscal_year,
      upeJurisdiction: report.upe_jurisdiction,
      isValid: report.summary_json?.critical === 0,
      summary: {
        critical: report.summary_json?.critical || 0,
        errors: report.summary_json?.errors || 0,
        warnings: report.summary_json?.warnings || 0,
        info: report.summary_json?.info || 0,
      },
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return addCorsHeaders(
      successResponse(formattedReports, {
        meta: {
          page,
          pageSize,
          total,
          totalPages,
        },
      }),
      originResult.origin ?? null
    );
  } catch (error) {
    return handleError(error);
  }
}

