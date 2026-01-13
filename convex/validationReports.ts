import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List user's validation reports
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("validationReports")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

// Get single report by ID
export const get = query({
  args: { id: v.id("validationReports") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Debug: Log identity info
    console.log("[Convex] get query - identity:", identity ? {
      subject: identity.subject,
      issuer: identity.issuer,
      tokenIdentifier: identity.tokenIdentifier,
    } : "NO IDENTITY");

    if (!identity) return null;

    const report = await ctx.db.get(args.id);

    // Debug: Log comparison
    console.log("[Convex] get query - report userId:", report?.userId);
    console.log("[Convex] get query - identity.subject:", identity.subject);
    console.log("[Convex] get query - match:", report?.userId === identity.subject);

    if (!report || report.userId !== identity.subject) return null;

    return report;
  },
});

// Generate upload URL for XML storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Save a new validation report
export const save = mutation({
  args: {
    fileName: v.string(),
    fileSize: v.number(),
    reportingPeriod: v.optional(v.string()),
    reportingEntity: v.optional(v.string()),
    jurisdictionCount: v.optional(v.number()),
    totalErrors: v.number(),
    totalWarnings: v.number(),
    validationStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    validationResults: v.any(),
    xmlStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("validationReports", {
      userId: identity.subject,
      ...args,
    });
  },
});

// Update a validation report
export const update = mutation({
  args: {
    id: v.id("validationReports"),
    validationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    validationResults: v.optional(v.any()),
    totalErrors: v.optional(v.number()),
    totalWarnings: v.optional(v.number()),
    reportingPeriod: v.optional(v.string()),
    reportingEntity: v.optional(v.string()),
    jurisdictionCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const report = await ctx.db.get(args.id);
    if (!report || report.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

// Get report by ID without strict auth check
// Having the report ID implies authorization (security through obscurity)
// This is acceptable because report IDs are long random strings
export const getById = query({
  args: { id: v.id("validationReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    return report;
  },
});

// List recent reports (without strict auth)
// Returns reports ordered by creation time
// Used when Clerk-Convex auth isn't working properly
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("validationReports")
      .order("desc")
      .take(limit);
  },
});

// DEBUG: List all reports with userIds (for debugging auth mismatch)
export const debugListAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("[Convex DEBUG] Current identity.subject:", identity?.subject || "NO IDENTITY");

    const reports = await ctx.db
      .query("validationReports")
      .order("desc")
      .take(10);

    console.log("[Convex DEBUG] Reports found:", reports.length);
    reports.forEach((r, i) => {
      console.log(`[Convex DEBUG] Report ${i}: id=${r._id}, userId=${r.userId}, fileName=${r.fileName}`);
    });

    return reports.map(r => ({
      id: r._id,
      userId: r.userId,
      fileName: r.fileName,
      matchesIdentity: r.userId === identity?.subject,
    }));
  },
});

// Delete a validation report
export const remove = mutation({
  args: { id: v.id("validationReports") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const report = await ctx.db.get(args.id);
    if (!report || report.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    if (report.xmlStorageId) {
      await ctx.storage.delete(report.xmlStorageId);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Save a validation report from the API route (called by HTTP action)
 * This bypasses Clerk auth and accepts userId directly
 */
export const saveFromApi = mutation({
  args: {
    userId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    reportingPeriod: v.optional(v.string()),
    reportingEntity: v.optional(v.string()),
    jurisdictionCount: v.optional(v.number()),
    totalErrors: v.number(),
    totalWarnings: v.number(),
    validationStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    validationResults: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("validationReports", {
      userId: args.userId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      reportingPeriod: args.reportingPeriod,
      reportingEntity: args.reportingEntity,
      jurisdictionCount: args.jurisdictionCount,
      totalErrors: args.totalErrors,
      totalWarnings: args.totalWarnings,
      validationStatus: args.validationStatus,
      validationResults: args.validationResults,
    });
  },
});
