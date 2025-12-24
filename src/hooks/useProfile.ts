'use client';

/**
 * useProfile Hook
 *
 * Custom hook for managing user profile data and settings.
 *
 * @module hooks/useProfile
 */

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  companyName: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateData {
  fullName?: string;
  companyName?: string;
}

export interface Preferences {
  defaultCountry: string;
  defaultFiscalYearFormat: string;
  emailNotifications: boolean;
  language: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UseProfileReturn {
  // State
  user: User | null;
  profile: Profile | null;
  preferences: Preferences;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  // Actions
  refreshProfile: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
  updatePreferences: (data: Partial<Preferences>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: ChangePasswordData) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_PREFERENCES: Preferences = {
  defaultCountry: 'LU',
  defaultFiscalYearFormat: 'calendar',
  emailNotifications: true,
  language: 'en',
};

// =============================================================================
// HOOK
// =============================================================================

export function useProfile(): UseProfileReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  // ---------------------------------------------------------------------------
  // FETCH PROFILE
  // ---------------------------------------------------------------------------

  const refreshProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setUser(currentUser);

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Failed to load profile data');
        setIsLoading(false);
        return;
      }

      if (profileData) {
        setProfile({
          id: profileData.id,
          email: profileData.email || currentUser.email || '',
          fullName: profileData.full_name || '',
          companyName: profileData.company_name || null,
          role: profileData.role || 'user',
          createdAt: profileData.created_at,
          updatedAt: profileData.updated_at,
        });

        // Load preferences from database (secure server-side storage)
        const { data: prefsData } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (prefsData) {
          setPreferences({
            defaultCountry: prefsData.default_country || DEFAULT_PREFERENCES.defaultCountry,
            defaultFiscalYearFormat: prefsData.default_fiscal_year_format || DEFAULT_PREFERENCES.defaultFiscalYearFormat,
            emailNotifications: prefsData.email_notifications ?? DEFAULT_PREFERENCES.emailNotifications,
            language: prefsData.language || DEFAULT_PREFERENCES.language,
          });
        }
      }
    } catch (err) {
      console.error('Error in refreshProfile:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // ---------------------------------------------------------------------------
  // UPDATE PROFILE
  // ---------------------------------------------------------------------------

  const updateProfile = useCallback(async (data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setIsUpdating(true);
      setError(null);

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.fullName !== undefined) {
        updateData.full_name = data.fullName;
      }
      if (data.companyName !== undefined) {
        updateData.company_name = data.companyName;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return { success: false, error: 'Failed to update profile' };
      }

      // Refresh profile data
      await refreshProfile();

      return { success: true };
    } catch (err) {
      console.error('Error in updateProfile:', err);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsUpdating(false);
    }
  }, [user, supabase, refreshProfile]);

  // ---------------------------------------------------------------------------
  // UPDATE PREFERENCES
  // ---------------------------------------------------------------------------

  const updatePreferences = useCallback(async (data: Partial<Preferences>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setIsUpdating(true);

      const newPreferences = { ...preferences, ...data };

      // Store preferences securely in Supabase database
      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          default_country: newPreferences.defaultCountry,
          default_fiscal_year_format: newPreferences.defaultFiscalYearFormat,
          email_notifications: newPreferences.emailNotifications,
          language: newPreferences.language,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.error('Error saving preferences:', upsertError);
        return { success: false, error: 'Failed to save preferences' };
      }

      // Update local state after successful save
      setPreferences(newPreferences);

      return { success: true };
    } catch (err) {
      console.error('Error in updatePreferences:', err);
      return { success: false, error: 'Failed to update preferences' };
    } finally {
      setIsUpdating(false);
    }
  }, [user, preferences, supabase]);

  // ---------------------------------------------------------------------------
  // CHANGE PASSWORD
  // ---------------------------------------------------------------------------

  const changePassword = useCallback(async (data: ChangePasswordData): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setIsUpdating(true);
      setError(null);

      // First verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: data.currentPassword,
      });

      if (signInError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        console.error('Error updating password:', updateError);
        return { success: false, error: updateError.message || 'Failed to update password' };
      }

      return { success: true };
    } catch (err) {
      console.error('Error in changePassword:', err);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsUpdating(false);
    }
  }, [user, supabase]);

  // ---------------------------------------------------------------------------
  // CLEAR ERROR
  // ---------------------------------------------------------------------------

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    refreshProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        refreshProfile();
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProfile, supabase.auth]);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    user,
    profile,
    preferences,
    isLoading,
    isUpdating,
    error,
    refreshProfile,
    updateProfile,
    updatePreferences,
    changePassword,
    clearError,
  };
}

