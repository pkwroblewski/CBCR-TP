import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileCheck2,
  FolderOpen,
  TrendingUp,
  Calendar,
  ArrowRight,
  Upload,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Clock,
  Sparkles,
  Shield,
  BarChart3,
  Target,
} from 'lucide-react';

/**
 * Dashboard Page
 *
 * Premium dashboard view with stats, recent validations, and quick actions.
 */
export default function DashboardPage() {
  // TODO: Fetch from Supabase
  const stats = {
    totalReports: 24,
    thisMonth: 8,
    passRate: 87.5,
  };

  // TODO: Fetch from Supabase
  const recentValidations = [
    {
      id: '1',
      filename: 'CbCR_2023_Q4_Final.xml',
      date: '2024-01-15',
      status: 'passed',
      score: 95,
    },
    {
      id: '2',
      filename: 'CbCR_2023_Amendment.xml',
      date: '2024-01-12',
      status: 'failed',
      score: 62,
    },
    {
      id: '3',
      filename: 'CbCR_2022_Correction.xml',
      date: '2024-01-10',
      status: 'passed',
      score: 100,
    },
    {
      id: '4',
      filename: 'CbCR_Test_File.xml',
      date: '2024-01-08',
      status: 'passed',
      score: 88,
    },
    {
      id: '5',
      filename: 'CbCR_2023_Q3.xml',
      date: '2024-01-05',
      status: 'failed',
      score: 45,
    },
  ];

  const tips = [
    {
      title: 'Upload your first CbC Report',
      description: 'Start by uploading an XML file to validate against OECD standards.',
      action: '/validate',
      actionLabel: 'Validate Now',
      icon: Upload,
      gradient: 'from-accent to-cyan-500',
    },
    {
      title: 'Understand validation results',
      description: 'Learn about critical, error, warning, and info severity levels.',
      action: '/help/validation',
      actionLabel: 'Learn More',
      icon: Shield,
      gradient: 'from-emerald-500 to-emerald-400',
    },
    {
      title: 'Pillar 2 Safe Harbour',
      description: 'Check if your CbC data qualifies for Transitional Safe Harbour.',
      action: '/pillar2',
      actionLabel: 'Explore',
      icon: Target,
      gradient: 'from-primary to-primary/80',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s an overview of your CbC report validations.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 rounded-xl"
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
            value: stats.totalReports,
            icon: FolderOpen,
            gradient: 'from-accent to-cyan-500',
            delay: '0ms',
          },
          {
            label: 'This Month',
            value: stats.thisMonth,
            icon: Calendar,
            gradient: 'from-emerald-500 to-emerald-400',
            delay: '100ms',
          },
          {
            label: 'Pass Rate',
            value: `${stats.passRate}%`,
            icon: TrendingUp,
            gradient: 'from-amber-500 to-amber-400',
            delay: '200ms',
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="group relative overflow-hidden glass border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
            style={{ animationDelay: stat.delay }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity" />
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-primary mt-1">{stat.value}</p>
                </div>
                <div className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent validations */}
      <Card className="glass border-white/20 shadow-xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Recent Validations
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="hover:bg-accent/10 rounded-xl">
            <Link href="/reports" className="text-muted-foreground hover:text-foreground">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {recentValidations.map((validation, index) => (
              <Link
                key={validation.id}
                href={`/reports/${validation.id}`}
                className="flex items-center justify-between p-4 hover:bg-accent/5 transition-all duration-200 group"
                style={{ animationDelay: `${400 + index * 50}ms` }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                    validation.status === 'passed'
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-gradient-to-br from-red-500 to-red-400 shadow-lg shadow-red-500/20'
                  } group-hover:scale-110 transition-transform duration-300`}>
                    {validation.status === 'passed' ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <XCircle className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                      {validation.filename}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {validation.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    className={`font-bold text-xs px-3 py-1 rounded-full shadow-sm ${
                      validation.status === 'passed'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-red-100 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    {validation.score}%
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips section */}
      <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <h2 className="text-lg font-bold text-primary mb-5 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100">
            <Lightbulb className="h-5 w-5 text-amber-500" />
          </div>
          Getting Started
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tips.map((tip, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden glass border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${600 + index * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-6 pb-6 relative">
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${tip.gradient} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <tip.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{tip.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{tip.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-xl border-border/50 hover:bg-accent/10 hover:border-accent/30 transition-all"
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
