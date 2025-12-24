'use client';

/**
 * Profile Form Component
 *
 * Reusable form for editing user profile information.
 *
 * @module components/forms/ProfileForm
 */

import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, User, Building2, Mail, Save, Check } from 'lucide-react';
import type { Profile, ProfileUpdateData } from '@/hooks/useProfile';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  companyName: z
    .string()
    .max(200, 'Company name must be less than 200 characters')
    .optional()
    .or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// =============================================================================
// PROPS
// =============================================================================

interface ProfileFormProps {
  profile: Profile | null;
  isLoading: boolean;
  isUpdating: boolean;
  onSubmit: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
}

// =============================================================================
// INNER FORM COMPONENT (uses key for resetting)
// =============================================================================

function ProfileFormInner({ 
  profile, 
  isUpdating, 
  onSubmit 
}: Omit<ProfileFormProps, 'isLoading'> & { profile: Profile }) {
  const initialData = useMemo(() => ({
    fullName: profile.fullName || '',
    companyName: profile.companyName || '',
  }), [profile.fullName, profile.companyName]);

  const [formData, setFormData] = useState<ProfileFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setShowSuccess(false);

    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    // Submit
    const response = await onSubmit({
      fullName: formData.fullName,
      companyName: formData.companyName || undefined,
    });

    if (response.success) {
      setIsDirty(false);
      setShowSuccess(true);
      toast.success('Profile updated successfully');
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      toast.error(response.error || 'Failed to update profile');
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your personal information and company details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Full Name
            </label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              className={errors.fullName ? 'border-red-500' : ''}
              disabled={isUpdating}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Company Name
              <span className="text-xs text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Enter your company name"
              className={errors.companyName ? 'border-red-500' : ''}
              disabled={isUpdating}
            />
            {errors.companyName && (
              <p className="text-sm text-red-500">{errors.companyName}</p>
            )}
          </div>

          <Separator />

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Address
              <span className="text-xs text-muted-foreground">(cannot be changed)</span>
            </label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Contact support if you need to change your email address.
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
                  Changes saved
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
                  Save Changes
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

export function ProfileForm({ profile, isLoading, isUpdating, onSubmit }: ProfileFormProps) {
  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  if (isLoading || !profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Use key to reset form when profile changes
  return (
    <ProfileFormInner
      key={profile.id}
      profile={profile}
      isUpdating={isUpdating}
      onSubmit={onSubmit}
    />
  );
}
