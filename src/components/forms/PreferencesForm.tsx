'use client';

/**
 * Preferences Form
 *
 * Form for managing user preferences stored in Convex.
 *
 * @component
 */

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, Sliders } from 'lucide-react';

// =============================================================================
// CONSTANTS
// =============================================================================

const JURISDICTIONS = [
  { code: 'LU', name: 'Luxembourg' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'IE', name: 'Ireland' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function PreferencesForm() {
  const preferences = useQuery(api.userPreferences.get);
  const updatePreferences = useMutation(api.userPreferences.save);
  const { addToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    defaultJurisdiction: 'LU',
    enablePillar2: false,
    emailNotifications: false,
    theme: 'dark' as 'dark' | 'light' | 'system',
  });

  // Initialize form with existing preferences
  useEffect(() => {
    if (preferences) {
      setFormData({
        defaultJurisdiction: preferences.defaultJurisdiction || 'LU',
        enablePillar2: preferences.enablePillar2 || false,
        emailNotifications: preferences.emailNotifications || false,
        theme: preferences.theme || 'dark',
      });
    }
  }, [preferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updatePreferences(formData);
      addToast('success', 'Your preferences have been updated successfully.');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (preferences === undefined) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Sliders className="h-5 w-5" />
          Validation Preferences
        </CardTitle>
        <CardDescription className="text-slate-400">
          Configure default settings for CbCR validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Default Jurisdiction */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Default Jurisdiction
            </label>
            <Select
              value={formData.defaultJurisdiction}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, defaultJurisdiction: value }))
              }
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="Select jurisdiction" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {JURISDICTIONS.map((j) => (
                  <SelectItem
                    key={j.code}
                    value={j.code}
                    className="text-slate-100 focus:bg-slate-700"
                  >
                    {j.code} - {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Country-specific validation rules will be applied based on this selection
            </p>
          </div>

          {/* Pillar 2 Analysis */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="enablePillar2"
              checked={formData.enablePillar2}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, enablePillar2: checked === true }))
              }
              className="mt-1 border-slate-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <div className="space-y-1">
              <label
                htmlFor="enablePillar2"
                className="text-sm font-medium text-slate-200 cursor-pointer"
              >
                Enable Pillar 2 Analysis
              </label>
              <p className="text-xs text-slate-500">
                Include GloBE Safe Harbour eligibility checks in validation reports
              </p>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="emailNotifications"
              checked={formData.emailNotifications}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, emailNotifications: checked === true }))
              }
              className="mt-1 border-slate-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <div className="space-y-1">
              <label
                htmlFor="emailNotifications"
                className="text-sm font-medium text-slate-200 cursor-pointer"
              >
                Email Notifications
              </label>
              <p className="text-xs text-slate-500">
                Receive email alerts for validation report completion
              </p>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Theme</label>
            <Select
              value={formData.theme}
              onValueChange={(value: 'dark' | 'light' | 'system') =>
                setFormData((prev) => ({ ...prev, theme: value }))
              }
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="dark" className="text-slate-100 focus:bg-slate-700">
                  Dark
                </SelectItem>
                <SelectItem value="light" className="text-slate-100 focus:bg-slate-700">
                  Light
                </SelectItem>
                <SelectItem value="system" className="text-slate-100 focus:bg-slate-700">
                  System
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
