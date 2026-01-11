"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Builds a prompt for generating executive summary of validation results.
 */
function buildSummaryPrompt(
  findings: Array<{
    severity: string;
    title: string;
    category: string;
    aiExplanation?: string;
  }>,
  metadata: {
    reportingEntity?: string;
    jurisdictionCount?: number;
    fiscalYear?: string;
    fileName?: string;
  }
): string {
  // Count findings by severity
  const counts = findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Group findings by category
  const byCategory = findings.reduce(
    (acc, f) => {
      if (!acc[f.category]) acc[f.category] = [];
      acc[f.category].push(f.title);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const criticalFindings = findings
    .filter((f) => f.severity === "critical" || f.severity === "error")
    .slice(0, 5)
    .map((f) => `- ${f.title}${f.aiExplanation ? `: ${f.aiExplanation.slice(0, 100)}...` : ""}`)
    .join("\n");

  return `You are a CbCR (Country-by-Country Reporting) expert. Generate an executive summary for a validation report.

Report Metadata:
- Reporting Entity: ${metadata.reportingEntity || "Unknown"}
- Fiscal Year: ${metadata.fiscalYear || "Unknown"}
- Jurisdictions: ${metadata.jurisdictionCount || "Unknown"}
- File: ${metadata.fileName || "Unknown"}

Finding Summary:
- Critical: ${counts.critical || 0}
- Errors: ${counts.error || 0}
- Warnings: ${counts.warning || 0}
- Info: ${counts.info || 0}
- Total: ${findings.length}

Categories Affected:
${Object.entries(byCategory)
  .map(([cat, items]) => `- ${cat}: ${items.length} findings`)
  .join("\n")}

Top Critical/Error Findings:
${criticalFindings || "None"}

Generate a 2-3 paragraph executive summary that:
1. Opens with overall compliance status (Pass/Fail/Needs Attention)
2. Highlights the most significant issues and their business impact
3. Provides 2-3 prioritized recommendations

Keep the tone professional but accessible. Be specific about what needs action.
Maximum 200 words. Do not use markdown formatting.`;
}

/**
 * Generate executive summary for a validation report using Claude API.
 */
export const generateExecutiveSummary = action({
  args: {
    findings: v.array(
      v.object({
        severity: v.string(),
        title: v.string(),
        category: v.string(),
        aiExplanation: v.optional(v.string()),
      })
    ),
    metadata: v.object({
      reportingEntity: v.optional(v.string()),
      jurisdictionCount: v.optional(v.number()),
      fiscalYear: v.optional(v.string()),
      fileName: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Generate a basic summary without AI
      const counts = args.findings.reduce(
        (acc, f) => {
          acc[f.severity] = (acc[f.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const status =
        (counts.critical || 0) > 0
          ? "CRITICAL ISSUES FOUND"
          : (counts.error || 0) > 0
            ? "ERRORS FOUND"
            : (counts.warning || 0) > 0
              ? "WARNINGS PRESENT"
              : "VALIDATION PASSED";

      return {
        summary: `${status}: This CbCR file has ${args.findings.length} findings (${counts.critical || 0} critical, ${counts.error || 0} errors, ${counts.warning || 0} warnings). Review the detailed findings below for specific issues that require attention.`,
        inputTokens: 0,
        outputTokens: 0,
        isAiGenerated: false,
      };
    }

    try {
      const anthropic = new Anthropic({ apiKey });
      const prompt = buildSummaryPrompt(args.findings, args.metadata);

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = response.content.find((block) => block.type === "text");
      const summary = textContent?.type === "text" ? textContent.text : "";

      return {
        summary,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        isAiGenerated: true,
      };
    } catch (error) {
      console.error("Error generating executive summary:", error);

      // Fallback to basic summary
      const counts = args.findings.reduce(
        (acc, f) => {
          acc[f.severity] = (acc[f.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        summary: `Validation completed with ${args.findings.length} findings: ${counts.critical || 0} critical, ${counts.error || 0} errors, ${counts.warning || 0} warnings. AI summary generation failed - please review individual findings.`,
        inputTokens: 0,
        outputTokens: 0,
        isAiGenerated: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Calculate risk score based on findings (deterministic, not AI).
 * Per master plan: AI does NOT do calculations.
 */
export const calculateRiskScore = action({
  args: {
    findings: v.array(
      v.object({
        severity: v.string(),
        category: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Weights per severity level
    const severityWeights: Record<string, number> = {
      critical: 25,
      error: 15,
      warning: 5,
      info: 1,
    };

    // Category multipliers (some categories are more serious)
    const categoryMultipliers: Record<string, number> = {
      schema: 1.2,
      logical: 1.0,
      jurisdiction: 1.1,
      pillar2: 1.3,
      quality: 0.8,
      oecd: 1.0,
    };

    let rawScore = 0;

    for (const finding of args.findings) {
      const weight = severityWeights[finding.severity] || 5;
      const multiplier = categoryMultipliers[finding.category] || 1.0;
      rawScore += weight * multiplier;
    }

    // Normalize to 0-100 scale (cap at 100)
    const normalizedScore = Math.min(100, Math.round(rawScore));

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical";
    if (normalizedScore >= 75) {
      riskLevel = "critical";
    } else if (normalizedScore >= 50) {
      riskLevel = "high";
    } else if (normalizedScore >= 25) {
      riskLevel = "medium";
    } else {
      riskLevel = "low";
    }

    return {
      score: normalizedScore,
      riskLevel,
      breakdown: {
        criticalCount: args.findings.filter((f) => f.severity === "critical").length,
        errorCount: args.findings.filter((f) => f.severity === "error").length,
        warningCount: args.findings.filter((f) => f.severity === "warning").length,
        infoCount: args.findings.filter((f) => f.severity === "info").length,
      },
    };
  },
});
