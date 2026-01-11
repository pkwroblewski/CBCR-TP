import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Store findings from a validation run.
 */
export const storeBatch = mutation({
  args: {
    submissionId: v.id("validationReports"),
    findings: v.array(
      v.object({
        category: v.string(),
        severity: v.string(),
        ruleCode: v.string(),
        title: v.string(),
        description: v.string(),
        affectedField: v.optional(v.string()),
        affectedJurisdiction: v.optional(v.string()),
        currentValue: v.optional(v.string()),
        expectedValue: v.optional(v.string()),
        recommendation: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds: string[] = [];

    for (const finding of args.findings) {
      const id = await ctx.db.insert("findings", {
        submissionId: args.submissionId,
        ...finding,
      });
      insertedIds.push(id);
    }

    return { insertedIds, count: insertedIds.length };
  },
});

/**
 * Get all findings for a submission.
 */
export const getBySubmission = query({
  args: { submissionId: v.id("validationReports") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("findings")
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
      .collect();
  },
});

/**
 * Get findings by severity for a submission.
 */
export const getBySeverity = query({
  args: {
    submissionId: v.id("validationReports"),
    severity: v.string(),
  },
  handler: async (ctx, args) => {
    const allFindings = await ctx.db
      .query("findings")
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
      .collect();

    return allFindings.filter((f) => f.severity === args.severity);
  },
});

/**
 * Update a finding with AI explanation.
 */
export const updateWithAiExplanation = mutation({
  args: {
    findingId: v.id("findings"),
    aiExplanation: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.findingId, {
      aiExplanation: args.aiExplanation,
    });
  },
});

/**
 * Batch update findings with AI explanations.
 */
export const batchUpdateAiExplanations = mutation({
  args: {
    updates: v.array(
      v.object({
        findingId: v.id("findings"),
        aiExplanation: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.findingId, {
        aiExplanation: update.aiExplanation,
      });
    }
    return { updated: args.updates.length };
  },
});

/**
 * Get finding counts by severity for a submission.
 */
export const getCounts = query({
  args: { submissionId: v.id("validationReports") },
  handler: async (ctx, args) => {
    const findings = await ctx.db
      .query("findings")
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
      .collect();

    const counts = findings.reduce(
      (acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: findings.length,
      critical: counts.critical || 0,
      error: counts.error || 0,
      warning: counts.warning || 0,
      info: counts.info || 0,
    };
  },
});

/**
 * Delete all findings for a submission.
 */
export const deleteBySubmission = mutation({
  args: { submissionId: v.id("validationReports") },
  handler: async (ctx, args) => {
    const findings = await ctx.db
      .query("findings")
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
      .collect();

    for (const finding of findings) {
      await ctx.db.delete(finding._id);
    }

    return { deleted: findings.length };
  },
});

/**
 * Get findings that don't have AI explanations yet.
 */
export const getWithoutAiExplanation = query({
  args: { submissionId: v.id("validationReports") },
  handler: async (ctx, args) => {
    const findings = await ctx.db
      .query("findings")
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
      .collect();

    return findings.filter((f) => !f.aiExplanation);
  },
});
