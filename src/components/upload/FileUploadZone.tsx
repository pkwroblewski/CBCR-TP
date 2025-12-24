'use client';

/**
 * File Upload Zone Component
 *
 * Premium drag-and-drop file upload component with glassmorphism effects.
 * Supports drag & drop, click to browse, and file validation.
 *
 * @module components/upload/FileUploadZone
 */

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  useFileUpload,
  formatFileSize,
  MAX_FILE_SIZE,
} from '@/hooks/useFileUpload';
import { FilePreview } from './FilePreview';
import { UploadProgress } from './UploadProgress';
import {
  Upload,
  FileUp,
  AlertCircle,
  FileCode2,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface FileUploadZoneProps {
  /** Callback when validation completes successfully */
  onValidationComplete?: (reportId: string) => void;
  /** Callback when file is selected */
  onFileSelected?: (file: File) => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Premium drag-and-drop file upload zone for CbC XML files
 */
export function FileUploadZone({
  onValidationComplete,
  onFileSelected,
  className,
}: FileUploadZoneProps) {
  const {
    file,
    xmlInfo,
    stage,
    progress,
    statusMessage,
    error,
    isDragActive,
    handleDrop,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleSelect,
    clearFile,
    uploadFile,
    inputRef,
    openFileDialog,
  } = useFileUpload();

  const isProcessing = ['uploading', 'parsing', 'validating'].includes(stage);
  const isComplete = stage === 'complete';
  const hasFile = !!file;

  /**
   * Handle file selection callback
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleSelect(event);
      const files = event.target.files;
      if (files && files.length > 0 && onFileSelected) {
        onFileSelected(files[0]);
      }
    },
    [handleSelect, onFileSelected]
  );

  /**
   * Handle upload button click
   */
  const handleUpload = useCallback(async () => {
    const reportId = await uploadFile();
    if (reportId && onValidationComplete) {
      onValidationComplete(reportId);
    }
  }, [uploadFile, onValidationComplete]);

  /**
   * Handle new validation (after complete)
   */
  const handleNewValidation = useCallback(() => {
    clearFile();
  }, [clearFile]);

  return (
    <Card className={cn('overflow-hidden glass-strong border-white/20 shadow-xl', className)}>
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-accent/5 via-transparent to-transparent">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-cyan-500 shadow-lg shadow-accent/20">
            <FileCode2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-primary">Upload CbC Report</span>
            <span className="text-xs text-muted-foreground font-normal">OECD CbC-Schema v2.0 compliant</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Drop zone - only show when no file selected */}
          {!hasFile && (
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop zone for CbC XML files. Click or drag and drop to upload."
              aria-describedby={error ? 'upload-error' : undefined}
              onDrop={handleDrop}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onClick={openFileDialog}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  openFileDialog();
                }
              }}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'w-full min-h-[280px] p-8',
                'border-2 border-dashed rounded-2xl',
                'cursor-pointer transition-all duration-300',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                isDragActive
                  ? 'border-accent bg-accent/5 scale-[1.01]'
                  : 'border-border/50 hover:border-accent/50 hover:bg-accent/5',
                error && 'border-red-300 bg-red-50/30'
              )}
            >
              {/* Animated background gradient on drag */}
              {isDragActive && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-cyan-500/10 to-accent/10 animate-pulse" />
                  <div className="absolute top-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" />
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl animate-float-slow" />
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={inputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Select XML file"
              />

              {/* Drag indicator */}
              <div
                className={cn(
                  'relative flex items-center justify-center w-20 h-20 rounded-2xl mb-6 transition-all duration-300',
                  isDragActive
                    ? 'bg-gradient-to-br from-accent to-cyan-500 scale-110 shadow-xl shadow-accent/30'
                    : 'bg-gradient-to-br from-slate-100 to-slate-50'
                )}
              >
                {isDragActive ? (
                  <FileUp className="h-10 w-10 text-white animate-bounce" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground" />
                )}
                {!isDragActive && (
                  <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-accent animate-pulse" />
                )}
              </div>

              {/* Instructions */}
              <div className="relative text-center">
                <p className="text-foreground font-semibold text-lg">
                  {isDragActive
                    ? 'Drop your file here'
                    : 'Drag & drop your CbC XML file'}
                </p>
                <p className="text-muted-foreground mt-2">
                  or{' '}
                  <span className="text-accent font-semibold hover:underline cursor-pointer">
                    click to browse
                  </span>
                </p>
              </div>

              {/* File requirements */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 rounded-full">
                  <FileCode2 className="h-3.5 w-3.5 text-accent" />
                  XML files only
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 rounded-full">
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  Max {formatFileSize(MAX_FILE_SIZE)}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 rounded-full">
                  <Shield className="h-3.5 w-3.5 text-accent" />
                  OECD CbC-Schema v2.0
                </span>
              </div>

              {/* Error display */}
              {error && (
                <div
                  id="upload-error"
                  role="alert"
                  aria-live="assertive"
                  className="absolute bottom-4 left-4 right-4 p-4 glass border border-red-200/50 rounded-xl shadow-lg animate-fade-in"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100">
                      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-red-800">{error.message}</p>
                      {error.suggestion && (
                        <p className="text-red-600 text-sm mt-1">{error.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File preview - show when file selected */}
          {hasFile && !isProcessing && !isComplete && (
            <FilePreview
              file={file}
              xmlInfo={xmlInfo}
              onRemove={clearFile}
              onChange={openFileDialog}
              disabled={isProcessing}
            />
          )}

          {/* Upload progress - show during processing */}
          {(isProcessing || isComplete) && (
            <UploadProgress
              stage={stage}
              progress={progress}
              statusMessage={statusMessage}
              errorMessage={error?.message}
            />
          )}

          {/* Action buttons */}
          {hasFile && !isComplete && (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={clearFile}
                disabled={isProcessing}
                className="rounded-xl border-border/50 hover:bg-accent/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isProcessing}
                className="min-w-[160px] rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    Validate Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Completed state actions */}
          {isComplete && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleNewValidation}
                className="rounded-xl border-border/50 hover:bg-accent/5"
              >
                Validate Another File
              </Button>
              <Button
                onClick={() => onValidationComplete?.('')}
                className="rounded-xl bg-gradient-to-r from-accent to-cyan-500 hover:from-accent/90 hover:to-cyan-500/90 shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                View Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { FilePreview } from './FilePreview';
export { UploadProgress } from './UploadProgress';
