'use client';

/**
 * File Preview Component
 *
 * Premium file details display with glassmorphism and refined typography.
 *
 * @module components/upload/FilePreview
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { XmlPreviewInfo } from '@/hooks/useFileUpload';
import { formatFileSize, formatDate } from '@/hooks/useFileUpload';
import {
  FileCode2,
  X,
  RefreshCw,
  Calendar,
  HardDrive,
  Code2,
  Globe,
  Hash,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface FilePreviewProps {
  /** Selected file */
  file: File;
  /** XML preview information */
  xmlInfo: XmlPreviewInfo | null;
  /** Callback to remove/clear file */
  onRemove: () => void;
  /** Callback to change file (re-open dialog) */
  onChange: () => void;
  /** Whether actions are disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Premium file preview with details and XML structure info
 */
export function FilePreview({
  file,
  xmlInfo,
  onRemove,
  onChange,
  disabled = false,
  className,
}: FilePreviewProps) {
  const lastModified = new Date(file.lastModified);
  const isCbcFile = xmlInfo?.rootElement?.includes('CBC') || xmlInfo?.namespace?.includes('cbc');

  return (
    <Card className={cn('overflow-hidden glass border-white/20 shadow-lg animate-fade-in-up', className)}>
      <CardContent className="p-0">
        {/* File header */}
        <div className="flex items-start justify-between p-5 bg-gradient-to-r from-accent/5 via-transparent to-transparent border-b border-white/10">
          <div className="flex items-start gap-4">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-cyan-500 shadow-lg shadow-accent/20">
              <FileCode2 className="h-7 w-7 text-white" />
              {isCbcFile && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground truncate max-w-[280px]">
                {file.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(lastModified)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onChange}
              disabled={disabled}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
              title="Change file"
              aria-label="Change file"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              disabled={disabled}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove file"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File details */}
        <div className="p-5 space-y-5">
          {/* XML structure preview */}
          {xmlInfo && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10">
                  <Code2 className="h-4 w-4 text-accent" />
                </div>
                XML Structure
              </h4>

              <div className="grid gap-3">
                {/* Root element */}
                {xmlInfo.rootElement && (
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Root Element</span>
                      <code className="block mt-0.5 px-2 py-1 bg-slate-100 rounded-lg text-primary font-mono text-sm truncate">
                        &lt;{xmlInfo.rootElement}&gt;
                      </code>
                    </div>
                  </div>
                )}

                {/* Namespace */}
                {xmlInfo.namespace && (
                  <div className="flex items-start gap-3 p-3 bg-white/50 rounded-xl">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Namespace</span>
                      <code className="block mt-0.5 px-2 py-1 bg-slate-100 rounded-lg text-primary font-mono text-xs break-all">
                        {xmlInfo.namespace}
                      </code>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Element count */}
                  {xmlInfo.elementCount > 0 && (
                    <div className="p-3 bg-white/50 rounded-xl text-center">
                      <Hash className="h-4 w-4 text-accent mx-auto mb-1" />
                      <span className="block text-xs text-muted-foreground">Elements</span>
                      <span className="block font-bold text-foreground">
                        ~{xmlInfo.elementCount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* XML version */}
                  {xmlInfo.version && (
                    <div className="p-3 bg-white/50 rounded-xl text-center">
                      <FileText className="h-4 w-4 text-accent mx-auto mb-1" />
                      <span className="block text-xs text-muted-foreground">XML</span>
                      <span className="block font-bold text-foreground">{xmlInfo.version}</span>
                    </div>
                  )}

                  {/* Encoding */}
                  {xmlInfo.encoding && (
                    <div className="p-3 bg-white/50 rounded-xl text-center">
                      <Code2 className="h-4 w-4 text-accent mx-auto mb-1" />
                      <span className="block text-xs text-muted-foreground">Encoding</span>
                      <span className="block font-bold text-foreground">{xmlInfo.encoding}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CbCR detection hint */}
              {xmlInfo.rootElement && (
                <div
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl text-sm transition-all duration-300',
                    isCbcFile
                      ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/50 border border-emerald-200/50'
                      : 'bg-gradient-to-r from-amber-50 to-amber-50/50 border border-amber-200/50'
                  )}
                >
                  {isCbcFile ? (
                    <>
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-800">CbCR File Detected</p>
                        <p className="text-emerald-600 text-xs mt-0.5">Valid Country-by-Country Report format</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-800">Non-Standard Format</p>
                        <p className="text-amber-600 text-xs mt-0.5">Validation will attempt OECD CbC-Schema v2.0 parsing</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
