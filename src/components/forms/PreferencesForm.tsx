'use client';

/**
 * Preferences Form Component
 *
 * Form for managing user preferences and settings.
 *
 * @module components/forms/PreferencesForm
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Loader2, 
  Settings, 
  Globe, 
  Calendar, 
  Bell, 
  Languages,
  Save,
  Check 
} from 'lucide-react';
import type { Preferences } from '@/hooks/useProfile';

// =============================================================================
// CONSTANTS
// =============================================================================

const COUNTRIES = [
  { code: 'LU', name: 'Luxembourg' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'IE', name: 'Ireland' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
];

const FISCAL_YEAR_FORMATS = [
  { value: 'calendar', label: 'Calendar Year (Jan - Dec)' },
  { value: 'fiscal_mar', label: 'Fiscal Year (Apr - Mar)' },
  { value: 'fiscal_jun', label: 'Fiscal Year (Jul - Jun)' },
  { value: 'fiscal_sep', label: 'Fiscal Year (Oct - Sep)' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
];

// =============================================================================
// PROPS
// =============================================================================

interface PreferencesFormProps {
  preferences: Preferences;
  isLoading: boolean;
  isUpdating: boolean;
  onSubmit: (data: Partial<Preferences>) => Promise<{ success: boolean; error?: string }>;
}

// =============================================================================
// INNER FORM COMPONENT (uses key for resetting)
// =============================================================================

function PreferencesFormInner({ 
  preferences, 
  isUpdating, 
  onSubmit 
}: Omit<PreferencesFormProps, 'isLoading'>) {
  const initialData = useMemo(() => ({ ...preferences }), [preferences]);
  
  const [formData, setFormData] = useState<Preferences>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleChange = (field: keyof Preferences, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setShowSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await onSubmit(formData);

    if (response.success) {
      setIsDirty(false);
      setShowSuccess(true);
      toast.success('Preferences updated successfully');
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      toast.error(response.error || 'Failed to update preferences');
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Preferences
        </CardTitle>
        <CardDescription>
          Customize your validation and notification settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Default Country */}
          <div className="space-y-2">
            <label htmlFor="defaultCountry" className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Default Country for Validation
            </label>
            <select
              id="defaultCountry"
              value={formData.defaultCountry}
              onChange={(e) => handleChange('defaultCountry', e.target.value)}
              disabled={isUpdating}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              This will be pre-selected when you start a new validation.
            </p>
          </div>

          {/* Fiscal Year Format */}
          <div className="space-y-2">
            <label htmlFor="fiscalYearFormat" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Default Fiscal Year Format
            </label>
            <select
              id="fiscalYearFormat"
              value={formData.defaultFiscalYearFormat}
              onChange={(e) => handleChange('defaultFiscalYearFormat', e.target.value)}
              disabled={isUpdating}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {FISCAL_YEAR_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="emailNotifications" className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Email Notifications
              </label>
              <p className="text-xs text-muted-foreground">
                Receive email updates about your validation reports.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="emailNotifications"
                type="checkbox"
                checked={formData.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                disabled={isUpdating}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <Separator />

          {/* Language */}
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              Language
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Coming Soon</span>
            </label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => handleChange('language', e.target.value)}
              disabled={true}
              className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Additional languages will be available in a future update.
            </p>
          </div>

          <Separator />

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isDirty ? (
                <span className="text-amber-600">You have unsaved changes</span>
              ) : showSuccess ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Preferences saved
                </span>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={isUpdating || !isDirty}
              className="min-w-[140px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PreferencesForm({ preferences, isLoading, isUpdating, onSubmit }: PreferencesFormProps) {
  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Use a key based on preferences to reset form when they change externally
  const preferencesKey = JSON.stringify(preferences);

  return (
    <PreferencesFormInner
      key={preferencesKey}
      preferences={preferences}
      isUpdating={isUpdating}
      onSubmit={onSubmit}
    />
  );
}
