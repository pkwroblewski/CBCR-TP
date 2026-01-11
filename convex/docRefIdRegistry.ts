/**
 * DocRefId Registry Convex Functions
 * 
 * Manages global DocRefId uniqueness across all CbCR submissions.
 * Per OECD requirements, DocRefIds must be globally unique.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Check if DocRefIds already exist in the registry
 * Returns information about any duplicates found
 */
export const checkDocRefIds = query({
  args: {
    docRefIds: v.array(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const duplicates: Array<{
      docRefId: string;
      existingRecord: {
        userId: string;
        reportId: string;
        messageType: string;
        registeredAt: number;
        isSuperseded: boolean;
      };
    }> = [];
    const unique: string[] = [];

    for (const docRefId of args.docRefIds) {
      const existing = await ctx.db
        .query("docRefIdRegistry")
        .withIndex("by_docref", (q) => q.eq("docRefId", docRefId))
        .first();

      if (existing) {
        duplicates.push({
          docRefId,
          existingRecord: {
            userId: existing.userId,
            reportId: existing.reportId,
            messageType: existing.messageType,
            registeredAt: existing.registeredAt,
            isSuperseded: existing.isSuperseded ?? false,
          },
        });
      } else {
        unique.push(docRefId);
      }
    }

    return { duplicates, unique };
  },
});

/**
 * Get DocRefId history for a specific user
 */
export const getUserDocRefIds = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("docRefIdRegistry")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single DocRefId record
 */
export const getDocRefId = query({
  args: { docRefId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("docRefIdRegistry")
      .withIndex("by_docref", (q) => q.eq("docRefId", args.docRefId))
      .first();
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Register multiple DocRefIds after successful validation
 */
export const registerDocRefIds = mutation({
  args: {
    docRefIds: v.array(v.object({
      docRefId: v.string(),
      messageType: v.string(),
    })),
    reportId: v.id("validationReports"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const registeredAt = Date.now();
    const results: string[] = [];

    for (const { docRefId, messageType } of args.docRefIds) {
      // Check if already exists
      const existing = await ctx.db
        .query("docRefIdRegistry")
        .withIndex("by_docref", (q) => q.eq("docRefId", docRefId))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("docRefIdRegistry", {
          userId: identity.subject,
          docRefId,
          reportId: args.reportId,
          messageType,
          registeredAt,
          isSuperseded: false,
        });
        results.push(id);
      }
    }

    return results;
  },
});

/**
 * Mark a DocRefId as superseded (after correction/deletion)
 */
export const markSuperseded = mutation({
  args: {
    docRefId: v.string(),
    supersededBy: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("docRefIdRegistry")
      .withIndex("by_docref", (q) => q.eq("docRefId", args.docRefId))
      .first();

    if (existing && existing.userId === identity.subject) {
      await ctx.db.patch(existing._id, {
        isSuperseded: true,
        supersededBy: args.supersededBy,
        supersededAt: Date.now(),
      });
      return true;
    }

    return false;
  },
});

/**
 * Bulk check DocRefIds without authentication (for API route use)
 * This is a public query that doesn't require auth
 */
export const publicCheckDocRefIds = query({
  args: {
    docRefIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const duplicates: Array<{
      docRefId: string;
      existingRecord: {
        issuingJurisdiction: string;
        reportingPeriod: string;
        createdAt: string;
        isSuperseded: boolean;
      };
    }> = [];
    const unique: string[] = [];

    for (const docRefId of args.docRefIds) {
      const existing = await ctx.db
        .query("docRefIdRegistry")
        .withIndex("by_docref", (q) => q.eq("docRefId", docRefId))
        .first();

      if (existing) {
        duplicates.push({
          docRefId,
          existingRecord: {
            issuingJurisdiction: existing.messageType, // Using messageType as jurisdiction proxy
            reportingPeriod: new Date(existing.registeredAt).toISOString().slice(0, 10),
            createdAt: new Date(existing.registeredAt).toISOString(),
            isSuperseded: existing.isSuperseded ?? false,
          },
        });
      } else {
        unique.push(docRefId);
      }
    }

    return { duplicates, unique };
  },
});

/**
 * Register DocRefIds from the API route (called by HTTP action)
 * This bypasses Clerk auth and accepts userId directly
 */
export const registerFromApi = mutation({
  args: {
    userId: v.string(),
    reportId: v.id("validationReports"),
    docRefIds: v.array(v.object({
      docRefId: v.string(),
      messageType: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const registeredAt = Date.now();
    const results: string[] = [];

    for (const { docRefId, messageType } of args.docRefIds) {
      // Check if already exists
      const existing = await ctx.db
        .query("docRefIdRegistry")
        .withIndex("by_docref", (q) => q.eq("docRefId", docRefId))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("docRefIdRegistry", {
          userId: args.userId,
          docRefId,
          reportId: args.reportId,
          messageType,
          registeredAt,
          isSuperseded: false,
        });
        results.push(id);
      }
    }

    return results;
  },
});
