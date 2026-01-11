'use client';

/**
 * Settings Page
 *
 * Settings page with tabs for Profile (Clerk), Preferences (Convex), and Security (Clerk).
 *
 * @page /settings
 */

// Disable static generation - uses Convex hooks
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { UserProfile } from '@/components/auth-wrapper';
import { dark } from '@clerk/themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PreferencesForm } from '@/components/forms';
import {
  Settings,
  User,
  Sliders,
  Shield,
  Sparkles,
} from 'lucide-react';
import { AiUsageStats } from '@/components/ai';

// =============================================================================
// COMPONENT
// =============================================================================

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[{ label: 'Settings', icon: <Settings className="h-4 w-4" /> }]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-100">
          <Settings className="h-8 w-8" aria-hidden="true" />
          Settings
        </h1>
        <p className="text-slate-400 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator className="bg-slate-800" />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px] bg-slate-800/50">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
          >
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger
            value="ai-usage"
            className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Usage</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab - Clerk UserProfile */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Profile Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Manage your profile information and account details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="clerk-profile-container">
                <UserProfile
                  appearance={{
                    baseTheme: dark,
                    elements: {
                      rootBox: 'w-full',
                      card: 'bg-transparent shadow-none border-0',
                      navbar: 'hidden',
                      pageScrollBox: 'p-0',
                      page: 'gap-4',
                    },
                  }}
                  routing="hash"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab - Convex */}
        <TabsContent value="preferences" className="space-y-6">
          <PreferencesForm />

          {/* Preferences Info Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100">About Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-400 space-y-2">
                <p>
                  Your preferences are saved to your account and will be used
                  as defaults when starting new validations. These settings help
                  streamline your workflow by pre-populating common options.
                </p>
                <p>
                  <strong className="text-slate-300">Note:</strong> Preferences sync across all devices
                  when you&apos;re logged in.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Usage Tab */}
        <TabsContent value="ai-usage" className="space-y-6">
          <AiUsageStats
            usage={undefined} // TODO: Connect to Convex query when deployed
            isLoading={false}
          />

          {/* AI Info Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100">About AI Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-400 space-y-2">
                <p>
                  AI-powered features use Claude (Anthropic) to generate plain-language
                  explanations of validation findings and executive summaries for your reports.
                </p>
                <p>
                  <strong className="text-slate-300">Pricing:</strong> Usage is billed based on
                  tokens processed. Input tokens cost ~$3/million, output tokens ~$15/million.
                </p>
                <p>
                  <strong className="text-slate-300">Privacy:</strong> Your CbCR data is only
                  sent to generate explanations and is not stored by the AI provider.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab - Clerk UserProfile Security Section */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Security Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Manage your password, two-factor authentication, and connected accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="clerk-profile-container">
                <UserProfile
                  appearance={{
                    baseTheme: dark,
                    elements: {
                      rootBox: 'w-full',
                      card: 'bg-transparent shadow-none border-0',
                      navbar: 'hidden',
                      pageScrollBox: 'p-0',
                      page: 'gap-4',
                    },
                  }}
                  routing="hash"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Separator className="bg-slate-800" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-slate-500">
        <p>
          Need help? Visit our{' '}
          <a href="/resources" className="text-emerald-400 hover:underline">
            Resources
          </a>{' '}
          or contact support.
        </p>
      </div>
    </div>
  );
}
