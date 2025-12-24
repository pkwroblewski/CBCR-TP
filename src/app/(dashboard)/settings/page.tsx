'use client';

/**
 * Settings Page
 *
 * Main settings page with tabs for Profile, Preferences, and Security.
 *
 * @page /settings
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ProfileForm, PreferencesForm, SecurityForm } from '@/components/forms';
import { useProfile } from '@/hooks/useProfile';
import {
  Settings,
  User,
  Sliders,
  Shield,
  Loader2
} from 'lucide-react';

// =============================================================================
// COMPONENT
// =============================================================================

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const {
    user,
    profile,
    preferences,
    isLoading,
    isUpdating,
    updateProfile,
    updatePreferences,
    changePassword,
  } = useProfile();

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  if (isLoading && !profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences.
          </p>
        </div>
        <Separator />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[{ label: 'Settings', icon: <Settings className="h-4 w-4" /> }]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="h-8 w-8" aria-hidden="true" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <ProfileForm
            profile={profile}
            isLoading={isLoading}
            isUpdating={isUpdating}
            onSubmit={updateProfile}
          />

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
              <CardDescription>
                Your account details and membership information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <p className="font-medium capitalize">{profile?.role || 'User'}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {profile?.createdAt 
                      ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {profile?.updatedAt
                      ? new Date(profile.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm truncate">{profile?.id || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <PreferencesForm
            preferences={preferences}
            isLoading={isLoading}
            isUpdating={isUpdating}
            onSubmit={updatePreferences}
          />

          {/* Preferences Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm text-muted-foreground">
                <p>
                  Your preferences are saved locally on this device and will be used
                  as defaults when starting new validations. These settings help
                  streamline your workflow by pre-populating common options.
                </p>
                <p className="mt-2">
                  <strong>Note:</strong> Preferences are device-specific. If you use
                  multiple devices, you may need to configure preferences on each one.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <SecurityForm
            isLoading={isLoading}
            isUpdating={isUpdating}
            onChangePassword={changePassword}
            lastSignIn={user?.last_sign_in_at}
          />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Separator />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-muted-foreground">
        <p>
          Need help? Visit our{' '}
          <a href="/help" className="text-primary hover:underline">
            Help Center
          </a>{' '}
          or{' '}
          <a href="/contact" className="text-primary hover:underline">
            contact support
          </a>.
        </p>
        <p className="text-xs">
          Last saved:{' '}
          {profile?.updatedAt
            ? new Date(profile.updatedAt).toLocaleString()
            : 'Never'
          }
        </p>
      </div>
    </div>
  );
}

