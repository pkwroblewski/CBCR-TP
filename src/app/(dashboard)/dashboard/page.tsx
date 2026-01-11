import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileCheck2,
  FolderOpen,
  TrendingUp,
  Calendar,
  ArrowRight,
  Upload,
  Lightbulb,
  Shield,
  BarChart3,
  Target,
  FileX,
  Sparkles,
} from 'lucide-react';

/**
 * Dashboard Page
 *
 * Premium dashboard with blue-themed design.
 * Shows stats, recent validations, and quick actions.
 */
export default function DashboardPage() {
  const hasValidations = false;

  const tips = [
    {
      title: 'Upload your first CbC Report',
      description: 'Start by uploading an XML file to validate against OECD standards.',
      action: '/validate',
      actionLabel: 'Validate Now',
      icon: Upload,
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      title: 'Understand validation results',
      description: 'Learn about critical, error, warning, and info severity levels.',
      action: '/help/validation',
      actionLabel: 'Learn More',
      icon: Shield,
      gradient: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      title: 'Pillar 2 Safe Harbour',
      description: 'Check if your CbC data qualifies for Transitional Safe Harbour.',
      action: '/pillar2',
      actionLabel: 'Explore',
      icon: Target,
      gradient: 'from-indigo-500 to-indigo-600',
      shadow: 'shadow-indigo-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Welcome back
          </h1>
          <p className="text-slate-400 mt-1">
            Here&apos;s an overview of your CbC report validations.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:brightness-110 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 rounded-xl text-white border-0"
        >
          <Link href="/validate">
            <Upload className="mr-2 h-5 w-5" />
            New Validation
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            label: 'Total Reports',
            value: hasValidations ? '0' : '—',
            icon: FolderOpen,
            gradient: 'from-blue-500 to-blue-600',
            shadow: 'shadow-blue-500/20',
          },
          {
            label: 'This Month',
            value: hasValidations ? '0' : '—',
            icon: Calendar,
            gradient: 'from-emerald-500 to-emerald-600',
            shadow: 'shadow-emerald-500/20',
          },
          {
            label: 'Pass Rate',
            value: hasValidations ? '0%' : '—',
            icon: TrendingUp,
            gradient: 'from-indigo-500 to-indigo-600',
            shadow: 'shadow-indigo-500/20',
          },
        ].map((stat, index) => (
          <Card
            key={stat.label}
            className="group relative overflow-hidden bg-slate-900/50 border-slate-800/50 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 pb-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-100 mt-1">{stat.value}</p>
                </div>
                <div className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent validations */}
      <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50">
          <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Recent Validations
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl">
            <Link href="/reports">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/50 mb-5">
              <FileX className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              No validations yet
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              Upload your first CbCR XML file to see validation results and history appear here.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:brightness-110 text-white shadow-lg shadow-blue-500/20 rounded-xl border-0"
            >
              <Link href="/validate">
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Report
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips section */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/15">
            <Lightbulb className="h-5 w-5 text-blue-400" />
          </div>
          Getting Started
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tips.map((tip, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden bg-slate-900/50 border-slate-800/50 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-6 pb-6 relative">
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${tip.gradient} shadow-lg ${tip.shadow} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <tip.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-100 mb-2">{tip.title}</h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{tip.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-xl border-slate-700 hover:bg-slate-800 hover:border-blue-500/30 text-slate-300 hover:text-slate-100 transition-all"
                >
                  <Link href={tip.action}>
                    {tip.actionLabel}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
