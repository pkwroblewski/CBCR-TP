/**
 * Audit Log API Routes
 *
 * Provides endpoints for logging and querying audit events.
 *
 * POST /api/audit - Log an audit event
 * GET /api/audit - Query audit logs (admin only)
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  successResponse,
  badRequest,
  unauthorized,
  forbidden,
  handleError,
} from '@/lib/utils/api-response';
import {
  AuditLogService,
  extractRequestContext,
  type AuditEventCategory,
  type AuditStatus,
  type AuditSeverity,
} from '@/lib/services/audit-service';

// =============================================================================
// POST /api/audit - Log an audit event
// =============================================================================

interface LogAuditRequest {
  eventType: string;
  eventCategory: AuditEventCategory;
  action: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  status?: AuditStatus;
  severity?: AuditSeverity;
  message?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    // Extract request context for audit logging
    const requestContext = extractRequestContext(request.headers);

    // Get user session (optional for some event types)
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

    // Parse request body
    const body = await request.json() as LogAuditRequest;

    // Validate required fields
    if (!body.eventType || !body.eventCategory || !body.action) {
      return badRequest('eventType, eventCategory, and action are required');
    }

    // Validate event category
    const validCategories: AuditEventCategory[] = [
      'authentication',
      'authorization',
      'validation',
      'file_operation',
      'data_access',
      'admin_action',
      'security_event',
      'system',
    ];

    if (!validCategories.includes(body.eventCategory)) {
      return badRequest(`Invalid eventCategory. Must be one of: ${validCategories.join(', ')}`);
    }

    // Security: Only allow certain event types from unauthenticated users
    const publicEventTypes = ['login_success', 'login_failure', 'logout', 'password_reset_request'];
    if (!user && !publicEventTypes.includes(body.eventType)) {
      // Allow authentication events without a user
      if (body.eventCategory !== 'authentication') {
        return unauthorized('Authentication required');
      }
    }

    // Log the event
    const logId = await AuditLogService.log({
      eventType: body.eventType,
      eventCategory: body.eventCategory,
      action: body.action,
      userId: user?.id,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      resourceName: body.resourceName,
      status: body.status || 'success',
      severity: body.severity || 'info',
      message: body.message,
      metadata: body.metadata,
      ...requestContext,
    });

    if (!logId) {
      return badRequest('Failed to log audit event');
    }

    return successResponse({ logId });
  } catch (error) {
    return handleError(error);
  }
}

// =============================================================================
// GET /api/audit - Query audit logs (admin only)
// =============================================================================

export async function GET(request: NextRequest) {
  try {
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
      return unauthorized('Authentication required');
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return forbidden('Admin access required');
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const options = {
      userId: searchParams.get('userId') || undefined,
      eventCategory: searchParams.get('eventCategory') as AuditEventCategory | undefined,
      eventType: searchParams.get('eventType') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
      resourceId: searchParams.get('resourceId') || undefined,
      status: searchParams.get('status') as AuditStatus | undefined,
      severity: searchParams.get('severity') as AuditSeverity | undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await AuditLogService.query(options);

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
