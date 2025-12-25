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
} from 'lucide-react';

/**
 * Dashboard Page
 *
 * Premium dashboard view with stats, recent validations, and quick actions.
 * Shows placeholders until actual data is available.
 */
export default function DashboardPage() {
  // TODO: Fetch actual data from Supabase
  const hasValidations = false; // Will be true when user has validation history

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

      {/* Quick stats - with placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            label: 'Total Reports',
            value: hasValidations ? '0' : '—',
            icon: FolderOpen,
            gradient: 'from-accent to-cyan-500',
            delay: '0ms',
          },
          {
            label: 'This Month',
            value: hasValidations ? '0' : '—',
            icon: Calendar,
            gradient: 'from-emerald-500 to-emerald-400',
            delay: '100ms',
          },
          {
            label: 'Pass Rate',
            value: hasValidations ? '0%' : '—',
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

      {/* Recent validations - empty state */}
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
          {/* Empty state placeholder */}
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-200 to-stone-300 mb-5">
              <FileX className="h-8 w-8 text-stone-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No validations yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Upload your first CbCR XML file to see validation results and history appear here.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-accent to-cyan-500 hover:from-accent/90 hover:to-cyan-500/90 text-white shadow-lg shadow-accent/20 rounded-xl"
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
