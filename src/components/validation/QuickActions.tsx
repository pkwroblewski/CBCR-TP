'use client';

/**
 * Quick Actions Component
 *
 * Action buttons for validation results: download PDF, download JSON,
 * share report, and start new validation.
 *
 * @module components/validation/QuickActions
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ValidationReport } from '@/types/validation';
import {
  FileDown,
  FileJson,
  FileText,
  Share2,
  Plus,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Mail,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface QuickActionsProps {
  /** Validation report data */
  report: ValidationReport;
  /** Callback for new validation */
  onNewValidation?: () => void;
  /** Compact mode (smaller buttons) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Quick action buttons for validation results
 */
export function QuickActions({
  report,
  onNewValidation,
  compact = false,
  className,
}: QuickActionsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);

  /**
   * Download PDF report
   */
  const downloadPdf = useCallback(async () => {
    setDownloadingPdf(true);
    try {
      const response = await fetch(`/api/reports/${report.id}/pdf`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cbcr-validation-${report.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
    } finally {
      setDownloadingPdf(false);
    }
  }, [report.id]);

  /**
   * Download JSON results
   */
  const downloadJson = useCallback(async () => {
    setDownloadingJson(true);
    try {
      const data = {
        id: report.id,
        filename: report.filename,
        validatedAt: report.completedAt,
        isValid: report.isValid,
        summary: report.summary,
        results: report.results,
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cbcr-validation-${report.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('JSON download error:', error);
    } finally {
      setDownloadingJson(false);
    }
  }, [report]);

  /**
   * Copy share link to clipboard
   */
  const copyShareLink = useCallback(async () => {
    const shareUrl = `${window.location.origin}/reports/${report.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      console.error('Failed to copy link');
    }
  }, [report.id]);

  /**
   * Open share dialog (native share if available)
   */
  const shareReport = useCallback(async () => {
    const shareData = {
      title: `CbCR Validation Report - ${report.filename}`,
      text: `Validation ${report.isValid ? 'passed' : 'failed'} for ${report.filename}`,
      url: `${window.location.origin}/reports/${report.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed
      }
    } else {
      copyShareLink();
    }
  }, [report, copyShareLink]);

  /**
   * Email report
   */
  const emailReport = useCallback(() => {
    const subject = encodeURIComponent(
      `CbCR Validation Report - ${report.filename}`
    );
    const body = encodeURIComponent(
      `Validation ${report.isValid ? 'passed' : 'failed'} for ${report.filename}\n\n` +
      `View report: ${window.location.origin}/reports/${report.id}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [report]);

  const buttonSize = compact ? 'sm' : 'default';
  const iconSize = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Download dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={buttonSize}>
            <Download className={cn(iconSize, 'mr-2')} />
            Download
            <ChevronDown className={cn(iconSize, 'ml-2')} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={downloadPdf}
            disabled={downloadingPdf}
            className="cursor-pointer"
          >
            <FileText className="h-4 w-4 mr-2 text-red-600" />
            {downloadingPdf ? 'Generating...' : 'Download PDF Report'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={downloadJson}
            disabled={downloadingJson}
            className="cursor-pointer"
          >
            <FileJson className="h-4 w-4 mr-2 text-amber-600" />
            {downloadingJson ? 'Preparing...' : 'Download JSON'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => window.print()}
            className="cursor-pointer"
          >
            <FileDown className="h-4 w-4 mr-2 text-slate-600" />
            Print Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={buttonSize}>
            <Share2 className={cn(iconSize, 'mr-2')} />
            Share
            <ChevronDown className={cn(iconSize, 'ml-2')} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={copyShareLink} className="cursor-pointer">
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 mr-2 text-emerald-600" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareReport} className="cursor-pointer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Share Report
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={emailReport} className="cursor-pointer">
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New validation button */}
      {onNewValidation && (
        <Button
          variant="default"
          size={buttonSize}
          onClick={onNewValidation}
        >
          <Plus className={cn(iconSize, 'mr-2')} />
          New Validation
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// QUICK ACTIONS CARD VARIANT
// =============================================================================

type QuickActionsCardProps = QuickActionsProps;

/**
 * Quick actions in a card layout
 */
export function QuickActionsCard({
  report,
  onNewValidation,
  className,
}: QuickActionsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-900">Quick Actions</h3>
            <p className="text-sm text-slate-500">
              Download or share your validation results
            </p>
          </div>
          <QuickActions
            report={report}
            onNewValidation={onNewValidation}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}

