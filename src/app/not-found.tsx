/**
 * Custom 404 Page
 *
 * Displays when a page is not found with helpful navigation.
 *
 * @page /404
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileQuestion, 
  Home, 
  ArrowLeft, 
  FileCheck, 
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        {/* Main Card */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <FileQuestion className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">Page Not Found</CardTitle>
            <CardDescription className="text-lg">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>

            {/* Helpful Links */}
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Here are some helpful links:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Link
                  href="/validate"
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-muted transition-colors"
                >
                  <FileCheck className="h-6 w-6 text-primary mb-2" />
                  <span className="text-sm font-medium">Validate</span>
                </Link>
                <Link
                  href="/reports"
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-muted transition-colors"
                >
                  <BarChart3 className="h-6 w-6 text-primary mb-2" />
                  <span className="text-sm font-medium">Reports</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-muted transition-colors"
                >
                  <Settings className="h-6 w-6 text-primary mb-2" />
                  <span className="text-sm font-medium">Settings</span>
                </Link>
                <Link
                  href="/help"
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-muted transition-colors"
                >
                  <HelpCircle className="h-6 w-6 text-primary mb-2" />
                  <span className="text-sm font-medium">Help</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need assistance?{' '}
            <a
              href="mailto:support@cbcr-review.com"
              className="text-primary hover:underline"
            >
              Contact our support team
            </a>
          </p>
        </div>

        {/* Decorative 404 */}
        <div className="text-center">
          <span className="text-[150px] font-bold leading-none text-muted/20 select-none">
            404
          </span>
        </div>
      </div>
    </div>
  );
}
