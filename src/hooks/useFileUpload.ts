'use client';

/**
 * File Upload Hook
 *
 * Custom hook for managing XML file upload state and logic.
 * Handles drag/drop, file validation, and upload progress.
 *
 * @module hooks/useFileUpload
 */

import { useState, useCallback, useRef } from 'react';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum file size in bytes (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
 *
 * @example
 * ```tsx
 * function UploadComponent() {
 *   const {
 *     file,
 *     stage,
 *     progress,
 *     error,
 *     isDragActive,
 *     handleDrop,
 *     handleDragOver,
 *     handleSelect,
 *     clearFile,
 *     uploadFile,
 *     inputRef,
 *     openFileDialog,
 *   } = useFileUpload();
 *
 *   return (
 *     <div
 *       onDrop={handleDrop}
 *       onDragOver={handleDragOver}
 *       onClick={openFileDialog}
 *     >
 *       <input ref={inputRef} type="file" onChange={handleSelect} />
 *       {file && <span>{file.name}</span>}
 *     </div>
 *   );
 * }
 * ```
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
    // Check if file exists
    if (!file) {
      return {
        type: 'empty',
        message: 'No file selected',
        suggestion: 'Please select an XML file to upload',
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        type: 'size',
        message: `File too large (${sizeMB}MB)`,
        suggestion: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    // Check file size (empty file)
    if (file.size === 0) {
      return {
        type: 'empty',
        message: 'File is empty',
        suggestion: 'Please select a valid XML file with content',
      };
    }

    // Check file extension
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

    // Check MIME type (if available)
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      // Some systems may not set MIME type correctly, so just warn
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
        
        // Extract XML declaration info
        const xmlDeclMatch = content.match(/<\?xml[^?]*\?>/i);
        let encoding: string | null = null;
        let version: string | null = null;
        
        if (xmlDeclMatch) {
          const encodingMatch = xmlDeclMatch[0].match(/encoding=["']([^"']+)["']/i);
          const versionMatch = xmlDeclMatch[0].match(/version=["']([^"']+)["']/i);
          encoding = encodingMatch?.[1] ?? null;
          version = versionMatch?.[1] ?? null;
        }
        
        // Extract root element
        const rootMatch = content.match(/<([a-zA-Z_][\w:.-]*)[^>]*>/);
        const rootElement = rootMatch?.[1] ?? null;
        
        // Extract namespace from root element
        let namespace: string | null = null;
        if (rootElement) {
          const rootElementMatch = content.match(new RegExp(`<${rootElement}[^>]*>`));
          if (rootElementMatch) {
            const nsMatch = rootElementMatch[0].match(/xmlns(?::[^=]+)?=["']([^"']+)["']/);
            namespace = nsMatch?.[1] ?? null;
          }
        }
        
        // Count elements (rough estimate)
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
      
      // Read first 10KB for preview
      const slice = file.slice(0, 10240);
      reader.readAsText(slice);
    });
  }, []);

  /**
   * Process a selected file
   */
  const processFile = useCallback(async (file: File) => {
    // Validate file
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

    // Extract XML info
    updateState({
      stage: 'parsing',
      statusMessage: 'Reading file...',
      progress: 10,
    });

    try {
      const xmlInfo = await extractXmlInfo(file);
      
      // Check if it looks like a CbCR file
      const isCbcr = xmlInfo.rootElement?.includes('CBC') ||
        xmlInfo.namespace?.includes('cbc') ||
        xmlInfo.namespace?.includes('CBC');
      
      if (!isCbcr && xmlInfo.rootElement) {
        console.warn(`Root element "${xmlInfo.rootElement}" may not be a CbCR file`);
      }

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

  /**
   * Handle drag enter
   */
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

  /**
   * Handle drag leave
   */
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

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  /**
   * Handle file input change
   */
  const handleSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      // Reset input value so same file can be selected again
      event.target.value = '';
    },
    [processFile]
  );

  /**
   * Clear selected file
   */
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

  /**
   * Open file dialog programmatically
   */
  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /**
   * Upload and validate the file
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
        progress: 0,
        statusMessage: 'Uploading file...',
        error: null,
      });

      // Simulate upload progress
      for (let i = 0; i <= 30; i += 10) {
        await new Promise((r) => setTimeout(r, 100));
        updateState({ progress: i });
      }

      // Stage 2: Parsing
      updateState({
        stage: 'parsing',
        progress: 40,
        statusMessage: 'Parsing XML structure...',
      });

      await new Promise((r) => setTimeout(r, 500));
      updateState({ progress: 50 });

      // Stage 3: Validating
      updateState({
        stage: 'validating',
        progress: 60,
        statusMessage: 'Running validation checks...',
      });

      // Read file content
      const content = await state.file.text();

      // Make API call to validate
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      updateState({ progress: 90 });

      // Check if the response was successful
      if (!result.success) {
        throw new Error(result.error?.message || 'Validation failed');
      }

      const reportId = result.data?.reportId;

      // Cache the validation results in sessionStorage for immediate display
      if (reportId && result.data) {
        try {
          const reportData = {
            id: reportId,
            filename: state.file?.name || result.data.metadata?.filename,
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
          sessionStorage.setItem(`validation-report-${reportId}`, JSON.stringify(reportData));
        } catch (e) {
          console.warn('Failed to cache validation results:', e);
        }
      }

      // Stage 4: Complete - store reportId in state
      updateState({
        stage: 'complete',
        progress: 100,
        statusMessage: 'Validation complete!',
        reportId: reportId || null,
      });

      // Return the reportId from the nested data object
      return reportId || null;
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

export { MAX_FILE_SIZE, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES };

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
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

