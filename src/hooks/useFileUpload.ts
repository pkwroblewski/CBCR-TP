'use client';

/**
 * File Upload Hook
 *
 * Custom hook for managing XML file upload state and logic.
 * Handles drag/drop, file validation, and upload progress.
 * Works without Convex - validation happens via API route.
 *
 * @module hooks/useFileUpload
 */

import { useState, useCallback, useRef } from 'react';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum file size in bytes (50MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Allowed file extensions */
const ALLOWED_EXTENSIONS = ['.xml'];

/** Allowed MIME types */
const ALLOWED_MIME_TYPES = ['text/xml', 'application/xml'];

// =============================================================================
// TYPES
// =============================================================================

/**
 * Upload progress stages
 */
export type UploadStage = 'idle' | 'uploading' | 'parsing' | 'validating' | 'complete' | 'error';

/**
 * File validation error
 */
export interface FileValidationError {
  type: 'size' | 'type' | 'extension' | 'empty' | 'parse' | 'unknown';
  message: string;
  suggestion?: string;
}

/**
 * Basic XML info extracted from file
 */
export interface XmlPreviewInfo {
  rootElement: string | null;
  namespace: string | null;
  encoding: string | null;
  version: string | null;
  elementCount: number;
}

/**
 * Upload state
 */
export interface UploadState {
  /** Selected file */
  file: File | null;
  /** XML preview information */
  xmlInfo: XmlPreviewInfo | null;
  /** Current upload stage */
  stage: UploadStage;
  /** Upload progress (0-100) */
  progress: number;
  /** Current status message */
  statusMessage: string;
  /** Error if any */
  error: FileValidationError | null;
  /** Whether drag is active over drop zone */
  isDragActive: boolean;
  /** Report ID after successful validation */
  reportId: string | null;
}

/**
 * Upload hook return type
 */
export interface UseFileUploadReturn extends UploadState {
  /** Handle file drop event */
  handleDrop: (event: React.DragEvent<HTMLElement>) => void;
  /** Handle drag enter event */
  handleDragEnter: (event: React.DragEvent<HTMLElement>) => void;
  /** Handle drag leave event */
  handleDragLeave: (event: React.DragEvent<HTMLElement>) => void;
  /** Handle drag over event */
  handleDragOver: (event: React.DragEvent<HTMLElement>) => void;
  /** Handle file input change */
  handleSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Clear selected file */
  clearFile: () => void;
  /** Upload and validate the file */
  uploadFile: () => Promise<string | null>;
  /** File input ref for programmatic access */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Open file dialog */
  openFileDialog: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Custom hook for file upload management
 */
export function useFileUpload(): UseFileUploadReturn {
  const [state, setState] = useState<UploadState>({
    file: null,
    xmlInfo: null,
    stage: 'idle',
    progress: 0,
    statusMessage: '',
    error: null,
    isDragActive: false,
    reportId: null,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);

  /**
   * Update state partially
   */
  const updateState = useCallback((updates: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Validate file before processing
   */
  const validateFile = useCallback((file: File): FileValidationError | null => {
    if (!file) {
      return {
        type: 'empty',
        message: 'No file selected',
        suggestion: 'Please select an XML file to upload',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        type: 'size',
        message: `File too large (${sizeMB}MB)`,
        suggestion: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    if (file.size === 0) {
      return {
        type: 'empty',
        message: 'File is empty',
        suggestion: 'Please select a valid XML file with content',
      };
    }

    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );
    if (!hasValidExtension) {
      return {
        type: 'extension',
        message: `Invalid file type: ${file.name.split('.').pop()}`,
        suggestion: 'Only XML files (.xml) are accepted',
      };
    }

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      console.warn(`Unexpected MIME type: ${file.type}`);
    }

    return null;
  }, []);

  /**
   * Extract basic XML info from file content
   */
  const extractXmlInfo = useCallback(async (file: File): Promise<XmlPreviewInfo> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        const xmlDeclMatch = content.match(/<\?xml[^?]*\?>/i);
        let encoding: string | null = null;
        let version: string | null = null;
        
        if (xmlDeclMatch) {
          const encodingMatch = xmlDeclMatch[0].match(/encoding=["']([^"']+)["']/i);
          const versionMatch = xmlDeclMatch[0].match(/version=["']([^"']+)["']/i);
          encoding = encodingMatch?.[1] ?? null;
          version = versionMatch?.[1] ?? null;
        }
        
        const rootMatch = content.match(/<([a-zA-Z_][\w:.-]*)[^>]*>/);
        const rootElement = rootMatch?.[1] ?? null;
        
        let namespace: string | null = null;
        if (rootElement) {
          const rootElementMatch = content.match(new RegExp(`<${rootElement}[^>]*>`));
          if (rootElementMatch) {
            const nsMatch = rootElementMatch[0].match(/xmlns(?::[^=]+)?=["']([^"']+)["']/);
            namespace = nsMatch?.[1] ?? null;
          }
        }
        
        const elementCount = (content.match(/<[a-zA-Z]/g) || []).length;
        
        resolve({
          rootElement,
          namespace,
          encoding,
          version,
          elementCount,
        });
      };
      
      reader.onerror = () => {
        resolve({
          rootElement: null,
          namespace: null,
          encoding: null,
          version: null,
          elementCount: 0,
        });
      };
      
      const slice = file.slice(0, 10240);
      reader.readAsText(slice);
    });
  }, []);

  /**
   * Process a selected file
   */
  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      updateState({
        file: null,
        xmlInfo: null,
        stage: 'error',
        error: validationError,
        statusMessage: validationError.message,
      });
      return;
    }

    updateState({
      stage: 'parsing',
      statusMessage: 'Reading file...',
      progress: 10,
    });

    try {
      const xmlInfo = await extractXmlInfo(file);
      
      updateState({
        file,
        xmlInfo,
        stage: 'idle',
        progress: 0,
        statusMessage: '',
        error: null,
      });
    } catch {
      updateState({
        file: null,
        xmlInfo: null,
        stage: 'error',
        error: {
          type: 'parse',
          message: 'Failed to read file',
          suggestion: 'The file may be corrupted or not a valid XML file',
        },
        statusMessage: 'Failed to read file',
      });
    }
  }, [validateFile, extractXmlInfo, updateState]);

  /**
   * Handle file drop
   */
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      
      dragCounter.current = 0;
      updateState({ isDragActive: false });

      const files = event.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile, updateState]
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      
      dragCounter.current++;
      if (dragCounter.current === 1) {
        updateState({ isDragActive: true });
      }
    },
    [updateState]
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      
      dragCounter.current--;
      if (dragCounter.current === 0) {
        updateState({ isDragActive: false });
      }
    },
    [updateState]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      event.target.value = '';
    },
    [processFile]
  );

  const clearFile = useCallback(() => {
    setState({
      file: null,
      xmlInfo: null,
      stage: 'idle',
      progress: 0,
      statusMessage: '',
      error: null,
      isDragActive: false,
      reportId: null,
    });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /**
   * Upload and validate the file via API route
   */
  const uploadFile = useCallback(async (): Promise<string | null> => {
    if (!state.file) {
      updateState({
        stage: 'error',
        error: {
          type: 'empty',
          message: 'No file selected',
          suggestion: 'Please select an XML file first',
        },
      });
      return null;
    }

    try {
      // Stage 1: Uploading
      updateState({
        stage: 'uploading',
        progress: 10,
        statusMessage: 'Uploading file...',
        error: null,
      });

      updateState({ progress: 30 });

      // Stage 2: Parsing
      updateState({
        stage: 'parsing',
        progress: 40,
        statusMessage: 'Parsing XML structure...',
      });

      // Read file content for validation
      const content = await state.file.text();
      
      updateState({ progress: 50 });

      // Stage 3: Validating via API
      updateState({
        stage: 'validating',
        progress: 60,
        statusMessage: 'Running validation checks...',
      });

      // Call validation API
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: state.file.name,
          content,
        }),
      });

      updateState({ progress: 80 });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Validation failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Validation failed');
      }

      updateState({ progress: 100 });

      // Use Convex report ID if available, otherwise use local ID
      const convexReportId = result.data?.convexReportId;
      const localReportId = result.data?.localReportId || `local-${Date.now()}`;
      const reportId = convexReportId || localReportId;

      // Cache results for immediate display (always cache for quick access)
      if (result.data) {
        try {
          const reportData = {
            id: reportId,
            convexId: convexReportId,
            localId: localReportId,
            filename: state.file?.name || result.data.metadata?.filename,
            fileSize: result.data.metadata?.fileSize || state.file?.size || 0,
            uploadedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            status: 'completed',
            isValid: result.data.isValid,
            fiscalYear: result.data.metadata?.fiscalYear,
            upeJurisdiction: result.data.metadata?.upeJurisdiction,
            upeName: result.data.metadata?.upeName,
            messageRefId: result.data.metadata?.messageRefId,
            jurisdictionCount: result.data.metadata?.jurisdictionCount,
            entityCount: result.data.metadata?.entityCount,
            durationMs: result.data.durationMs,
            summary: result.data.summary,
            byCategory: result.data.byCategory,
            results: result.data.results,
          };
          // Store under both IDs if we have a Convex ID
          sessionStorage.setItem(`validation-report-${reportId}`, JSON.stringify(reportData));
          if (convexReportId && localReportId !== convexReportId) {
            sessionStorage.setItem(`validation-report-${localReportId}`, JSON.stringify(reportData));
          }
        } catch (e) {
          console.warn('Failed to cache validation results:', e);
        }
      }

      // Stage 4: Complete
      updateState({
        stage: 'complete',
        progress: 100,
        statusMessage: convexReportId ? 'Validation complete! Report saved.' : 'Validation complete!',
        reportId: reportId,
      });

      return reportId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      updateState({
        stage: 'error',
        error: {
          type: 'unknown',
          message: `Validation failed: ${message}`,
          suggestion: 'Please try again or contact support if the problem persists',
        },
        statusMessage: 'Validation failed',
      });
      return null;
    }
  }, [state.file, updateState]);

  return {
    ...state,
    handleDrop,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleSelect,
    clearFile,
    uploadFile,
    inputRef,
    openFileDialog,
  };
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES };

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
