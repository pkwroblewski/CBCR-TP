-- ============================================================================
-- CbCR Review Application - Initial Database Schema
-- ============================================================================
-- This migration creates the core tables for the CbCR validation application.
-- 
-- Tables:
-- - profiles: Extended user profiles
-- - validation_reports: CbCR validation report metadata
-- - validation_results: Individual validation findings
-- - validation_rules: Configurable validation rules
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Extends auth.users with additional profile information

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VALIDATION_REPORTS TABLE
-- ============================================================================
-- Stores metadata for each CbCR validation report

CREATE TABLE IF NOT EXISTS public.validation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size INTEGER,
    file_hash TEXT, -- SHA-256 hash for deduplication
    fiscal_year TEXT,
    upe_jurisdiction TEXT,
    upe_name TEXT,
    message_ref_id TEXT,
    jurisdiction_count INTEGER DEFAULT 0,
    entity_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    is_valid BOOLEAN,
    summary_json JSONB, -- ValidationSummary object
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_validation_reports_user_id ON public.validation_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_validation_reports_status ON public.validation_reports(status);
CREATE INDEX IF NOT EXISTS idx_validation_reports_fiscal_year ON public.validation_reports(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_validation_reports_created_at ON public.validation_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_validation_reports_file_hash ON public.validation_reports(file_hash);

-- Trigger for updated_at
CREATE TRIGGER update_validation_reports_updated_at
    BEFORE UPDATE ON public.validation_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VALIDATION_RESULTS TABLE
-- ============================================================================
-- Stores individual validation findings for each report

CREATE TABLE IF NOT EXISTS public.validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.validation_reports(id) ON DELETE CASCADE,
    rule_id TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'error', 'warning', 'info')),
    message TEXT NOT NULL,
    xpath TEXT,
    suggestion TEXT,
    reference TEXT,
    oecd_error_code TEXT,
    details_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for result queries
CREATE INDEX IF NOT EXISTS idx_validation_results_report_id ON public.validation_results(report_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_severity ON public.validation_results(severity);
CREATE INDEX IF NOT EXISTS idx_validation_results_category ON public.validation_results(category);
CREATE INDEX IF NOT EXISTS idx_validation_results_rule_id ON public.validation_results(rule_id);

-- ============================================================================
-- VALIDATION_RULES TABLE
-- ============================================================================
-- Configurable validation rules for admin management

CREATE TABLE IF NOT EXISTS public.validation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('critical', 'error', 'warning', 'info')),
    source TEXT NOT NULL CHECK (source IN ('OECD', 'COUNTRY', 'PILLAR2', 'QUALITY', 'CUSTOM')),
    jurisdiction TEXT, -- NULL for global rules, country code for country-specific
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    validation_logic TEXT, -- Description or pseudo-code of validation logic
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for rule lookups
CREATE INDEX IF NOT EXISTS idx_validation_rules_rule_id ON public.validation_rules(rule_id);
CREATE INDEX IF NOT EXISTS idx_validation_rules_category ON public.validation_rules(category);
CREATE INDEX IF NOT EXISTS idx_validation_rules_source ON public.validation_rules(source);
CREATE INDEX IF NOT EXISTS idx_validation_rules_jurisdiction ON public.validation_rules(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_validation_rules_is_active ON public.validation_rules(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_validation_rules_updated_at
    BEFORE UPDATE ON public.validation_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PROFILES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES - VALIDATION_REPORTS
-- ============================================================================

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
    ON public.validation_reports
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports"
    ON public.validation_reports
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own reports
CREATE POLICY "Users can update own reports"
    ON public.validation_reports
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own reports
CREATE POLICY "Users can delete own reports"
    ON public.validation_reports
    FOR DELETE
    USING (user_id = auth.uid());

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
    ON public.validation_reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES - VALIDATION_RESULTS
-- ============================================================================

-- Users can view results for their own reports
CREATE POLICY "Users can view own report results"
    ON public.validation_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.validation_reports
            WHERE id = validation_results.report_id
            AND user_id = auth.uid()
        )
    );

-- Users can insert results for their own reports
CREATE POLICY "Users can insert own report results"
    ON public.validation_results
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.validation_reports
            WHERE id = validation_results.report_id
            AND user_id = auth.uid()
        )
    );

-- Users can delete results for their own reports
CREATE POLICY "Users can delete own report results"
    ON public.validation_results
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.validation_reports
            WHERE id = validation_results.report_id
            AND user_id = auth.uid()
        )
    );

-- Admins can view all results
CREATE POLICY "Admins can view all results"
    ON public.validation_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES - VALIDATION_RULES
-- ============================================================================

-- All authenticated users can read validation rules
CREATE POLICY "Authenticated users can read rules"
    ON public.validation_rules
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only admins can modify rules
CREATE POLICY "Admins can insert rules"
    ON public.validation_rules
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update rules"
    ON public.validation_rules
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete rules"
    ON public.validation_rules
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to get validation summary statistics
CREATE OR REPLACE FUNCTION public.get_validation_summary(p_report_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'critical', COUNT(*) FILTER (WHERE severity = 'critical'),
        'error', COUNT(*) FILTER (WHERE severity = 'error'),
        'warning', COUNT(*) FILTER (WHERE severity = 'warning'),
        'info', COUNT(*) FILTER (WHERE severity = 'info'),
        'total', COUNT(*)
    )
    INTO result
    FROM public.validation_results
    WHERE report_id = p_report_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's validation statistics
CREATE OR REPLACE FUNCTION public.get_user_validation_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_reports', COUNT(*),
        'valid_reports', COUNT(*) FILTER (WHERE is_valid = true),
        'invalid_reports', COUNT(*) FILTER (WHERE is_valid = false),
        'pending_reports', COUNT(*) FILTER (WHERE status = 'pending'),
        'last_validation', MAX(created_at)
    )
    INTO result
    FROM public.validation_reports
    WHERE user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA - DEFAULT VALIDATION RULES
-- ============================================================================

-- Insert default OECD validation rules
INSERT INTO public.validation_rules (rule_id, category, severity, source, name, description, is_active) VALUES
-- MessageSpec Rules
('MSG-001', 'BUSINESS_RULES', 'error', 'OECD', 'MessageRefId Format', 'MessageRefId must be unique and follow proper format', true),
('MSG-002', 'BUSINESS_RULES', 'error', 'OECD', 'MessageRefId Country Prefix', 'MessageRefId should start with sending country code', true),
('MSG-003', 'BUSINESS_RULES', 'warning', 'OECD', 'MessageRefId Year', 'MessageRefId should contain reporting year', true),
('MSG-004', 'BUSINESS_RULES', 'error', 'OECD', 'MessageRefId Length', 'MessageRefId must not exceed 100 characters', true),
('MSG-005', 'BUSINESS_RULES', 'warning', 'OECD', 'MessageRefId Case', 'MessageRefId comparisons are case-insensitive', true),
('MSG-006', 'BUSINESS_RULES', 'error', 'OECD', 'MessageRefId Characters', 'MessageRefId must contain only valid characters', true),

-- DocSpec Rules
('DOC-001', 'BUSINESS_RULES', 'error', 'OECD', 'DocRefId Uniqueness', 'DocRefId must be globally unique', true),
('DOC-002', 'BUSINESS_RULES', 'error', 'OECD', 'DocTypeIndic Valid', 'DocTypeIndic must be valid OECD code', true),
('DOC-003', 'BUSINESS_RULES', 'error', 'OECD', 'CorrDocRefId Required', 'CorrDocRefId required for corrections/deletions', true),
('DOC-004', 'BUSINESS_RULES', 'error', 'OECD', 'DocTypeIndic Consistency', 'DocTypeIndic must be consistent with MessageTypeIndic', true),

-- TIN Rules
('TIN-001', 'BUSINESS_RULES', 'error', 'OECD', 'TIN issuedBy Required', 'TIN must have issuedBy attribute', true),
('TIN-002', 'BUSINESS_RULES', 'error', 'OECD', 'NOTIN Handling', 'NOTIN requires explanation in OtherEntityInfo', true),
('TIN-003', 'BUSINESS_RULES', 'warning', 'OECD', 'TIN Format', 'TIN should not have repeated characters', true),

-- Summary Rules
('SUM-001', 'DATA_QUALITY', 'warning', 'OECD', 'No Decimals', 'Monetary amounts should be whole numbers', true),
('SUM-002', 'DATA_QUALITY', 'warning', 'OECD', 'Currency Consistency', 'Same currency should be used throughout', true),

-- Luxembourg-specific Rules
('LU-TIN-001', 'COUNTRY_RULES', 'error', 'COUNTRY', 'LU Matricule Format', 'Luxembourg Matricule National must be 11-13 digits', true),
('LU-TIN-002', 'COUNTRY_RULES', 'warning', 'COUNTRY', 'LU TIN issuedBy', 'Luxembourg entities should have TIN with issuedBy=LU', true),
('LU-DL-001', 'COUNTRY_RULES', 'info', 'COUNTRY', 'LU Notification Deadline', 'Check notification deadline compliance', true),
('LU-DL-002', 'COUNTRY_RULES', 'warning', 'COUNTRY', 'LU Filing Deadline', 'Check filing deadline compliance', true),

-- Pillar 2 Rules
('P2-SH-001', 'PILLAR2_READINESS', 'info', 'PILLAR2', 'Safe Harbour De Minimis', 'Check de minimis safe harbour eligibility', true),
('P2-SH-002', 'PILLAR2_READINESS', 'info', 'PILLAR2', 'Safe Harbour ETR', 'Check simplified ETR safe harbour eligibility', true),
('P2-JUR-001', 'PILLAR2_READINESS', 'info', 'PILLAR2', 'Qualified Rules Check', 'Check if jurisdiction has qualified GloBE rules', true)

ON CONFLICT (rule_id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE public.validation_reports IS 'CbCR validation report metadata and summary';
COMMENT ON TABLE public.validation_results IS 'Individual validation findings per report';
COMMENT ON TABLE public.validation_rules IS 'Configurable validation rules';

COMMENT ON COLUMN public.validation_reports.file_hash IS 'SHA-256 hash for file deduplication';
COMMENT ON COLUMN public.validation_reports.summary_json IS 'ValidationSummary object with counts by severity';
COMMENT ON COLUMN public.validation_results.details_json IS 'Additional structured details for the validation result';
COMMENT ON COLUMN public.validation_rules.validation_logic IS 'Description or pseudo-code of the validation logic';

