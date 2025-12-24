-- ============================================================================
-- CbCR Review Application - User Preferences Table
-- ============================================================================
-- This migration adds secure server-side storage for user preferences,
-- replacing insecure localStorage usage.
--
-- Security: Preferences are stored server-side with RLS protection
-- ============================================================================

-- ============================================================================
-- USER_PREFERENCES TABLE
-- ============================================================================
-- Stores user preferences securely in the database instead of localStorage

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    default_country TEXT NOT NULL DEFAULT 'LU',
    default_fiscal_year_format TEXT NOT NULL DEFAULT 'calendar',
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    language TEXT NOT NULL DEFAULT 'en',
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
    ON public.user_preferences
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- FUNCTION: Upsert User Preferences
-- ============================================================================
-- Convenience function for upserting preferences

CREATE OR REPLACE FUNCTION public.upsert_user_preferences(
    p_user_id UUID,
    p_default_country TEXT DEFAULT NULL,
    p_default_fiscal_year_format TEXT DEFAULT NULL,
    p_email_notifications BOOLEAN DEFAULT NULL,
    p_language TEXT DEFAULT NULL,
    p_theme TEXT DEFAULT NULL
)
RETURNS public.user_preferences AS $$
DECLARE
    result public.user_preferences;
BEGIN
    INSERT INTO public.user_preferences (user_id, default_country, default_fiscal_year_format, email_notifications, language, theme)
    VALUES (
        p_user_id,
        COALESCE(p_default_country, 'LU'),
        COALESCE(p_default_fiscal_year_format, 'calendar'),
        COALESCE(p_email_notifications, true),
        COALESCE(p_language, 'en'),
        COALESCE(p_theme, 'system')
    )
    ON CONFLICT (user_id) DO UPDATE SET
        default_country = COALESCE(p_default_country, user_preferences.default_country),
        default_fiscal_year_format = COALESCE(p_default_fiscal_year_format, user_preferences.default_fiscal_year_format),
        email_notifications = COALESCE(p_email_notifications, user_preferences.email_notifications),
        language = COALESCE(p_language, user_preferences.language),
        theme = COALESCE(p_theme, user_preferences.theme),
        updated_at = NOW()
    RETURNING * INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_preferences IS 'Secure server-side storage for user preferences';
COMMENT ON COLUMN public.user_preferences.default_country IS 'Default jurisdiction for validation (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN public.user_preferences.default_fiscal_year_format IS 'Preferred fiscal year format: calendar, fiscal';
COMMENT ON COLUMN public.user_preferences.theme IS 'UI theme preference: light, dark, system';
