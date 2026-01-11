import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Track AI usage for billing and limits.
 */
export const trackUsage = mutation({
  args: {
    userId: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    operation: v.union(
      v.literal("finding_explanation"),
      v.literal("executive_summary")
    ),
    submissionId: v.optional(v.id("validationReports")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiUsage", {
      userId: args.userId,
      provider: "anthropic",
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      operation: args.operation,
      submissionId: args.submissionId,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get user's AI usage statistics.
 */
export const getUserUsage = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const usageRecords = await ctx.db
      .query("aiUsage")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalInputTokens = usageRecords.reduce((sum, r) => sum + r.inputTokens, 0);
    const totalOutputTokens = usageRecords.reduce((sum, r) => sum + r.outputTokens, 0);

    // Group by operation type
    const byOperation = usageRecords.reduce(
      (acc, r) => {
        if (!acc[r.operation]) {
          acc[r.operation] = { count: 0, inputTokens: 0, outputTokens: 0 };
        }
        acc[r.operation].count++;
        acc[r.operation].inputTokens += r.inputTokens;
        acc[r.operation].outputTokens += r.outputTokens;
        return acc;
      },
      {} as Record<string, { count: number; inputTokens: number; outputTokens: number }>
    );

    // Get usage for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thisMonthRecords = usageRecords.filter((r) => r.timestamp >= startOfMonth);

    const thisMonthInputTokens = thisMonthRecords.reduce((sum, r) => sum + r.inputTokens, 0);
    const thisMonthOutputTokens = thisMonthRecords.reduce((sum, r) => sum + r.outputTokens, 0);

    // Estimate cost (Claude 3.5 Sonnet pricing as of 2024)
    // Input: $3 per million tokens, Output: $15 per million tokens
    const estimatedCost =
      (totalInputTokens / 1_000_000) * 3 + (totalOutputTokens / 1_000_000) * 15;
    const thisMonthCost =
      (thisMonthInputTokens / 1_000_000) * 3 + (thisMonthOutputTokens / 1_000_000) * 15;

    return {
      totalRequests: usageRecords.length,
      totalInputTokens,
      totalOutputTokens,
      estimatedCost: Math.round(estimatedCost * 100) / 100, // Round to 2 decimals
      thisMonth: {
        requests: thisMonthRecords.length,
        inputTokens: thisMonthInputTokens,
        outputTokens: thisMonthOutputTokens,
        estimatedCost: Math.round(thisMonthCost * 100) / 100,
      },
      byOperation,
    };
  },
});

/**
 * Get usage for a specific submission.
 */
export const getSubmissionUsage = query({
  args: { submissionId: v.id("validationReports") },
  handler: async (ctx, args) => {
    const usageRecords = await ctx.db
      .query("aiUsage")
      .filter((q) => q.eq(q.field("submissionId"), args.submissionId))
      .collect();

    return {
      totalInputTokens: usageRecords.reduce((sum, r) => sum + r.inputTokens, 0),
      totalOutputTokens: usageRecords.reduce((sum, r) => sum + r.outputTokens, 0),
      operations: usageRecords.map((r) => ({
        operation: r.operation,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        timestamp: r.timestamp,
      })),
    };
  },
});

/**
 * Get recent AI usage across all users (for admin dashboard).
 */
export const getRecentUsage = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const usageRecords = await ctx.db
      .query("aiUsage")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    return usageRecords;
  },
});
