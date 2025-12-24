-- ============================================================================
-- CbCR Review Application - Audit Logging Schema
-- ============================================================================
-- This migration creates the audit logging tables for comprehensive tracking
-- of all CbCR operations for compliance and security purposes.
--
-- Tables:
-- - audit_logs: Main audit log table for all events
-- - audit_log_details: Additional structured details for audit entries
-- ============================================================================

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
-- Stores all auditable events in the CbCR application

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event identification
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL CHECK (event_category IN (
        'authentication',     -- Login, logout, password changes
        'authorization',      -- Access control, permission checks
        'validation',         -- CbCR validation operations
        'file_operation',     -- File uploads, downloads, deletions
        'data_access',        -- Report viewing, data export
        'admin_action',       -- Administrative operations
        'security_event',     -- Security-related events (XXE attempts, etc.)
        'system'              -- System events
    )),

    -- Actor information
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,

    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    session_id TEXT,

    -- Resource information
    resource_type TEXT,      -- 'validation_report', 'profile', 'file', etc.
    resource_id TEXT,        -- ID of the affected resource
    resource_name TEXT,      -- Human-readable name (filename, etc.)

    -- Event details
    action TEXT NOT NULL,    -- Specific action performed
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'error', 'blocked')),
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),

    -- Additional context
    message TEXT,            -- Human-readable description
    error_code TEXT,         -- Error code if applicable
    error_message TEXT,      -- Error message if applicable

    -- Structured metadata
    metadata JSONB DEFAULT '{}',

    -- Change tracking (for update/delete operations)
    old_values JSONB,
    new_values JSONB,

    -- Timing
    duration_ms INTEGER,     -- Operation duration in milliseconds
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_category ON public.audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON public.audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON public.audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON public.audit_logs(ip_address);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
    ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_created
    ON public.audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_security_events
    ON public.audit_logs(created_at DESC)
    WHERE event_category = 'security_event' OR severity IN ('warning', 'error', 'critical');

-- ============================================================================
-- AUDIT_LOG_RETENTION TABLE
-- ============================================================================
-- Configuration for audit log retention policies

CREATE TABLE IF NOT EXISTS public.audit_log_retention (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_category TEXT NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL DEFAULT 365,
    compress_after_days INTEGER DEFAULT 90,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_audit_log_retention_updated_at
    BEFORE UPDATE ON public.audit_log_retention
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default retention policies
INSERT INTO public.audit_log_retention (event_category, retention_days, compress_after_days) VALUES
    ('authentication', 365, 90),
    ('authorization', 365, 90),
    ('validation', 730, 180),      -- 2 years for validation logs
    ('file_operation', 730, 180),
    ('data_access', 365, 90),
    ('admin_action', 1825, 365),   -- 5 years for admin actions
    ('security_event', 1825, 365), -- 5 years for security events
    ('system', 180, 30)
ON CONFLICT (event_category) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log_retention ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- System can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Only admins can manage retention policies
CREATE POLICY "Admins can manage retention"
    ON public.audit_log_retention
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- AUDIT LOG FUNCTIONS
-- ============================================================================

-- Function to log an audit event
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_event_type TEXT,
    p_event_category TEXT,
    p_action TEXT,
    p_user_id UUID DEFAULT NULL,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_resource_name TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'success',
    p_severity TEXT DEFAULT 'info',
    p_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_user_email TEXT;
    v_user_role TEXT;
BEGIN
    -- Get user email and role if user_id provided
    IF p_user_id IS NOT NULL THEN
        SELECT email, role INTO v_user_email, v_user_role
        FROM public.profiles
        WHERE id = p_user_id;
    END IF;

    INSERT INTO public.audit_logs (
        event_type,
        event_category,
        action,
        user_id,
        user_email,
        user_role,
        resource_type,
        resource_id,
        resource_name,
        status,
        severity,
        message,
        metadata,
        ip_address,
        user_agent,
        duration_ms
    ) VALUES (
        p_event_type,
        p_event_category,
        p_action,
        p_user_id,
        v_user_email,
        v_user_role,
        p_resource_type,
        p_resource_id,
        p_resource_name,
        p_status,
        p_severity,
        p_message,
        p_metadata,
        p_ip_address,
        p_user_agent,
        p_duration_ms
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit logs for a resource
CREATE OR REPLACE FUNCTION public.get_resource_audit_logs(
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_limit INTEGER DEFAULT 100
)
RETURNS SETOF public.audit_logs AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.audit_logs
    WHERE resource_type = p_resource_type
      AND resource_id = p_resource_id
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity audit logs
CREATE OR REPLACE FUNCTION public.get_user_audit_logs(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS SETOF public.audit_logs AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.audit_logs
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security events
CREATE OR REPLACE FUNCTION public.get_security_events(
    p_since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    p_limit INTEGER DEFAULT 1000
)
RETURNS SETOF public.audit_logs AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.audit_logs
    WHERE (event_category = 'security_event'
           OR severity IN ('warning', 'error', 'critical'))
      AND created_at >= p_since
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old audit logs based on retention policy
CREATE OR REPLACE FUNCTION public.cleanup_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER := 0;
    v_retention RECORD;
BEGIN
    FOR v_retention IN
        SELECT event_category, retention_days
        FROM public.audit_log_retention
        WHERE is_active = true
    LOOP
        DELETE FROM public.audit_logs
        WHERE event_category = v_retention.event_category
          AND created_at < NOW() - (v_retention.retention_days || ' days')::INTERVAL;

        GET DIAGNOSTICS v_deleted = ROW_COUNT;
    END LOOP;

    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOG VIEWS
-- ============================================================================

-- View for recent security events
CREATE OR REPLACE VIEW public.recent_security_events AS
SELECT
    id,
    event_type,
    action,
    user_email,
    ip_address,
    status,
    severity,
    message,
    created_at
FROM public.audit_logs
WHERE event_category = 'security_event'
   OR severity IN ('error', 'critical')
ORDER BY created_at DESC
LIMIT 100;

-- View for validation activity summary
CREATE OR REPLACE VIEW public.validation_activity_summary AS
SELECT
    DATE_TRUNC('day', created_at) AS date,
    COUNT(*) AS total_validations,
    COUNT(*) FILTER (WHERE status = 'success') AS successful,
    COUNT(*) FILTER (WHERE status = 'failure') AS failed,
    COUNT(DISTINCT user_id) AS unique_users
FROM public.audit_logs
WHERE event_category = 'validation'
  AND action = 'validate_report'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit log for all CbCR operations';
COMMENT ON TABLE public.audit_log_retention IS 'Retention policies for audit log categories';

COMMENT ON COLUMN public.audit_logs.event_type IS 'Specific event type (e.g., validation_started, login_success)';
COMMENT ON COLUMN public.audit_logs.event_category IS 'High-level category for grouping events';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional structured data specific to the event';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous values for update operations';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New values for create/update operations';
