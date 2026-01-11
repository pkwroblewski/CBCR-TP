import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Validation reports (replaces Supabase validation_reports table)
  validationReports: defineTable({
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
    validationResults: v.any(), // Full JSON validation results
    xmlStorageId: v.optional(v.id("_storage")), // XML file in Convex storage
    aiSummary: v.optional(v.string()), // AI-generated executive summary
    riskScore: v.optional(v.number()), // 0-100 risk score
  }).index("by_user", ["userId"]),

  // Individual findings with AI explanations (per master plan)
  findings: defineTable({
    submissionId: v.id("validationReports"),
    category: v.string(),
    severity: v.string(),
    ruleCode: v.string(),
    title: v.string(),
    description: v.string(),
    aiExplanation: v.optional(v.string()), // AI-generated plain language
    affectedField: v.optional(v.string()),
    affectedJurisdiction: v.optional(v.string()),
    currentValue: v.optional(v.string()),
    expectedValue: v.optional(v.string()),
    recommendation: v.optional(v.string()),
  })
    .index("by_submission", ["submissionId"])
    .index("by_severity", ["severity"]),

  // AI usage tracking for billing/limits
  aiUsage: defineTable({
    userId: v.string(),
    provider: v.literal("anthropic"),
    inputTokens: v.number(),
    outputTokens: v.number(),
    submissionId: v.optional(v.id("validationReports")),
    operation: v.union(
      v.literal("finding_explanation"),
      v.literal("executive_summary")
    ),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // User preferences (replaces Supabase user_preferences table)
  userPreferences: defineTable({
    userId: v.string(),
    defaultJurisdiction: v.optional(v.string()),
    enablePillar2: v.boolean(),
    emailNotifications: v.boolean(),
    theme: v.union(v.literal("dark"), v.literal("light"), v.literal("system")),
  }).index("by_user", ["userId"]),

  // DocRefId registry (replaces Supabase docrefid_registry table)
  // Per OECD requirements, DocRefIds must be globally unique across all submissions
  docRefIdRegistry: defineTable({
    userId: v.string(),
    docRefId: v.string(),
    reportId: v.id("validationReports"),
    messageType: v.string(),
    registeredAt: v.number(),
    isSuperseded: v.optional(v.boolean()),
    supersededBy: v.optional(v.string()),
    supersededAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_docref", ["docRefId"]),

  // Audit logs (replaces Supabase audit_logs table)
  auditLogs: defineTable({
    userId: v.optional(v.string()),
    eventType: v.string(),
    eventCategory: v.string(),
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("failure"), v.literal("pending")),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("critical")),
    message: v.string(),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
