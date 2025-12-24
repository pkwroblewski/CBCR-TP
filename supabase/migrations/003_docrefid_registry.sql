-- ============================================================================
-- CbCR Review Application - DocRefId Registry Table
-- ============================================================================
-- This migration creates a global registry for DocRefIds to ensure uniqueness
-- across all submissions per OECD CbCR requirements.
--
-- OECD Requirement: DocRefId must be globally unique across all CbCR
-- submissions from a jurisdiction for the lifetime of the CbC reporting.
-- ============================================================================

-- ============================================================================
-- DOCREFID_REGISTRY TABLE
-- ============================================================================
-- Stores all DocRefIds from validated submissions for uniqueness checking

CREATE TABLE IF NOT EXISTS public.docrefid_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- The DocRefId value (must be globally unique)
    doc_ref_id TEXT NOT NULL UNIQUE,

    -- Reference to the validation report where this was first seen
    report_id UUID REFERENCES public.validation_reports(id) ON DELETE SET NULL,

    -- User who submitted this DocRefId
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- MessageRefId from the containing message
    message_ref_id TEXT,

    -- Jurisdiction that issued this DocRefId
    issuing_jurisdiction TEXT NOT NULL,

    -- The reporting period (fiscal year end date)
    reporting_period TEXT,

    -- Document type indicator (OECD1, OECD2, etc.)
    doc_type_indic TEXT,

    -- Whether this DocRefId has been superseded by a correction
    is_superseded BOOLEAN NOT NULL DEFAULT false,

    -- If superseded, reference to the correcting DocRefId
    superseded_by TEXT,

    -- XPath location in the original document
    xpath TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast DocRefId lookups
CREATE INDEX IF NOT EXISTS idx_docrefid_registry_doc_ref_id
    ON public.docrefid_registry(doc_ref_id);

-- Index for jurisdiction lookups
CREATE INDEX IF NOT EXISTS idx_docrefid_registry_jurisdiction
    ON public.docrefid_registry(issuing_jurisdiction);

-- Index for report lookups
CREATE INDEX IF NOT EXISTS idx_docrefid_registry_report_id
    ON public.docrefid_registry(report_id);

-- Index for finding non-superseded DocRefIds
CREATE INDEX IF NOT EXISTS idx_docrefid_registry_active
    ON public.docrefid_registry(doc_ref_id)
    WHERE is_superseded = false;

-- Trigger for updated_at
CREATE TRIGGER update_docrefid_registry_updated_at
    BEFORE UPDATE ON public.docrefid_registry
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.docrefid_registry ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view DocRefIds (needed for validation)
CREATE POLICY "Authenticated users can view docrefids"
    ON public.docrefid_registry
    FOR SELECT
    TO authenticated
    USING (true);

-- Users can only insert DocRefIds for their own submissions
CREATE POLICY "Users can insert own docrefids"
    ON public.docrefid_registry
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Users can update their own DocRefIds (for corrections)
CREATE POLICY "Users can update own docrefids"
    ON public.docrefid_registry
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if a DocRefId exists and get its details
CREATE OR REPLACE FUNCTION public.check_docrefid_exists(
    p_doc_ref_id TEXT
)
RETURNS TABLE (
    exists_flag BOOLEAN,
    issuing_jurisdiction TEXT,
    reporting_period TEXT,
    is_superseded BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        true as exists_flag,
        dr.issuing_jurisdiction,
        dr.reporting_period,
        dr.is_superseded,
        dr.created_at
    FROM public.docrefid_registry dr
    WHERE dr.doc_ref_id = p_doc_ref_id
    LIMIT 1;

    -- If no row found, return a single row with exists_flag = false
    IF NOT FOUND THEN
        RETURN QUERY SELECT
            false as exists_flag,
            NULL::TEXT as issuing_jurisdiction,
            NULL::TEXT as reporting_period,
            NULL::BOOLEAN as is_superseded,
            NULL::TIMESTAMPTZ as created_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register a new DocRefId
CREATE OR REPLACE FUNCTION public.register_docrefid(
    p_doc_ref_id TEXT,
    p_report_id UUID,
    p_user_id UUID,
    p_message_ref_id TEXT,
    p_issuing_jurisdiction TEXT,
    p_reporting_period TEXT,
    p_doc_type_indic TEXT,
    p_xpath TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.docrefid_registry (
        doc_ref_id,
        report_id,
        user_id,
        message_ref_id,
        issuing_jurisdiction,
        reporting_period,
        doc_type_indic,
        xpath
    ) VALUES (
        p_doc_ref_id,
        p_report_id,
        p_user_id,
        p_message_ref_id,
        p_issuing_jurisdiction,
        p_reporting_period,
        p_doc_type_indic,
        p_xpath
    )
    ON CONFLICT (doc_ref_id) DO NOTHING;

    -- Return true if a row was inserted, false if it already existed
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark a DocRefId as superseded
CREATE OR REPLACE FUNCTION public.supersede_docrefid(
    p_original_doc_ref_id TEXT,
    p_correcting_doc_ref_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.docrefid_registry
    SET
        is_superseded = true,
        superseded_by = p_correcting_doc_ref_id,
        updated_at = NOW()
    WHERE doc_ref_id = p_original_doc_ref_id
      AND is_superseded = false;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.docrefid_registry IS
    'Global registry of DocRefIds for uniqueness validation per OECD requirements';
COMMENT ON COLUMN public.docrefid_registry.doc_ref_id IS
    'The DocRefId value - must be globally unique per OECD CbC XML User Guide';
COMMENT ON COLUMN public.docrefid_registry.is_superseded IS
    'True if this DocRefId was superseded by a correction (OECD2/OECD3)';
COMMENT ON COLUMN public.docrefid_registry.superseded_by IS
    'DocRefId of the correction that superseded this record';
