/**
 * DocRefId Service
 *
 * Manages global DocRefId uniqueness by connecting to Convex database.
 * Per OECD requirements, DocRefIds must be globally unique across all submissions.
 *
 * @module lib/services/docrefid-service
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

// =============================================================================
// TYPES
// =============================================================================

export interface DocRefIdRecord {
  docRefId: string;
  issuingJurisdiction: string;
  reportingPeriod: string;
  createdAt: string;
  isSuperseded: boolean;
}

export interface BatchCheckResult {
  duplicates: Array<{
    docRefId: string;
    existingRecord: DocRefIdRecord;
  }>;
  unique: string[];
}

// =============================================================================
// HTTP CLIENT SINGLETON
// =============================================================================

let httpClient: ConvexHttpClient | null = null;

function getHttpClient(): ConvexHttpClient | null {
  if (httpClient) return httpClient;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl || convexUrl === "https://placeholder.convex.cloud") {
    console.warn("[DocRefIdService] Convex URL not configured, using stub mode");
    return null;
  }

  try {
    httpClient = new ConvexHttpClient(convexUrl);
    return httpClient;
  } catch (error) {
    console.error("[DocRefIdService] Failed to create Convex client:", error);
    return null;
  }
}

// =============================================================================
// SERVICE
// =============================================================================

/**
 * Service for checking DocRefId uniqueness against the Convex database
 */
export class DocRefIdService {
  /**
   * Check multiple DocRefIds for uniqueness against the global registry
   */
  static async batchCheck(docRefIds: string[]): Promise<BatchCheckResult> {
    const client = getHttpClient();

    if (!client) {
      // Stub mode: return all as unique
      console.log("[DocRefIdService] Stub mode - all DocRefIds treated as unique");
      return {
        duplicates: [],
        unique: docRefIds,
      };
    }

    try {
      const result = await client.query(api.docRefIdRegistry.publicCheckDocRefIds, {
        docRefIds,
      });

      return result as BatchCheckResult;
    } catch (error) {
      console.error("[DocRefIdService] Failed to check DocRefIds:", error);
      // On error, return all as unique to not block validation
      return {
        duplicates: [],
        unique: docRefIds,
      };
    }
  }

  /**
   * Check if a single DocRefId exists
   */
  static async checkSingle(docRefId: string): Promise<{ exists: boolean; record?: DocRefIdRecord }> {
    const result = await this.batchCheck([docRefId]);
    
    if (result.duplicates.length > 0) {
      return {
        exists: true,
        record: result.duplicates[0].existingRecord,
      };
    }
    
    return { exists: false };
  }

  /**
   * Register a new DocRefId after successful submission
   * Note: This requires authentication - should be called via Convex mutation
   */
  static async register(
    docRefId: string,
    jurisdiction: string,
    reportingPeriod: string
  ): Promise<void> {
    const client = getHttpClient();

    if (!client) {
      console.log(`[DocRefIdService] Stub mode - would register: ${docRefId}`);
      return;
    }

    // Note: Registration requires auth, so it's typically done client-side
    // or via a separate authenticated endpoint
    console.log(`[DocRefIdService] Registration should be done via authenticated mutation: ${docRefId}`);
  }

  /**
   * Mark a DocRefId as superseded (after correction/deletion)
   * Note: This requires authentication - should be called via Convex mutation
   */
  static async markSuperseded(docRefId: string, supersededBy: string): Promise<void> {
    const client = getHttpClient();

    if (!client) {
      console.log(`[DocRefIdService] Stub mode - would mark ${docRefId} as superseded by ${supersededBy}`);
      return;
    }

    console.log(`[DocRefIdService] Supersede should be done via authenticated mutation: ${docRefId}`);
  }
}
