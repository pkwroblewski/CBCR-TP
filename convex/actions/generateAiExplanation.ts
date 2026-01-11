"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Builds a prompt for generating plain-language explanations of validation findings.
 * Per master plan: AI explains findings AFTER deterministic validation.
 */
function buildExplanationPrompt(
  finding: {
    ruleCode: string;
    title: string;
    description: string;
    severity: string;
    affectedField?: string;
  },
  context: {
    reportingEntity?: string;
    jurisdiction?: string;
  }
): string {
  return `You are a CbCR (Country-by-Country Reporting) expert helping tax professionals understand validation findings.

Explain this validation finding in plain language:

Finding Details:
- Rule Code: ${finding.ruleCode}
- Title: ${finding.title}
- Technical Description: ${finding.description}
- Severity: ${finding.severity}
- Affected Field: ${finding.affectedField || "N/A"}

Context:
- Reporting Entity: ${context.reportingEntity || "Unknown"}
- Jurisdiction: ${context.jurisdiction || "N/A"}

Provide a concise explanation with:
1. What this means in plain language (2-3 sentences)
2. Why it matters for CbCR compliance
3. Suggested action to resolve

Keep your response under 150 words. Be specific and actionable. Do not use markdown formatting.`;
}

/**
 * Generate AI explanation for a single validation finding using Claude API.
 * This is a Convex action because it calls an external API (Anthropic).
 */
export const generateExplanation = action({
  args: {
    finding: v.object({
      ruleCode: v.string(),
      title: v.string(),
      description: v.string(),
      severity: v.string(),
      affectedField: v.optional(v.string()),
    }),
    context: v.object({
      reportingEntity: v.optional(v.string()),
      jurisdiction: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.warn("ANTHROPIC_API_KEY not configured - returning placeholder explanation");
      return {
        explanation: `[AI explanation unavailable] ${args.finding.title}: ${args.finding.description}`,
        inputTokens: 0,
        outputTokens: 0,
        error: "ANTHROPIC_API_KEY not configured",
      };
    }

    try {
      const anthropic = new Anthropic({
        apiKey,
      });

      const prompt = buildExplanationPrompt(args.finding, args.context);

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = response.content.find((block) => block.type === "text");
      const explanation = textContent?.type === "text" ? textContent.text : "";

      return {
        explanation,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      return {
        explanation: `[AI explanation failed] ${args.finding.title}: ${args.finding.description}`,
        inputTokens: 0,
        outputTokens: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Generate AI explanations for multiple findings in batch.
 * More efficient than calling generateExplanation for each finding.
 */
export const generateBatchExplanations = action({
  args: {
    findings: v.array(
      v.object({
        id: v.string(), // Finding ID to match back
        ruleCode: v.string(),
        title: v.string(),
        description: v.string(),
        severity: v.string(),
        affectedField: v.optional(v.string()),
      })
    ),
    context: v.object({
      reportingEntity: v.optional(v.string()),
      jurisdiction: v.optional(v.string()),
    }),
    maxConcurrent: v.optional(v.number()), // Limit concurrent API calls
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const maxConcurrent = args.maxConcurrent || 3;

    if (!apiKey) {
      return {
        explanations: args.findings.map((f) => ({
          id: f.id,
          explanation: `[AI unavailable] ${f.title}`,
          error: "ANTHROPIC_API_KEY not configured",
        })),
        totalInputTokens: 0,
        totalOutputTokens: 0,
      };
    }

    const anthropic = new Anthropic({ apiKey });
    const results: Array<{
      id: string;
      explanation: string;
      inputTokens: number;
      outputTokens: number;
      error?: string;
    }> = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < args.findings.length; i += maxConcurrent) {
      const batch = args.findings.slice(i, i + maxConcurrent);
      
      const batchResults = await Promise.all(
        batch.map(async (finding) => {
          try {
            const prompt = buildExplanationPrompt(finding, args.context);
            const response = await anthropic.messages.create({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 500,
              messages: [{ role: "user", content: prompt }],
            });

            const textContent = response.content.find((block) => block.type === "text");
            return {
              id: finding.id,
              explanation: textContent?.type === "text" ? textContent.text : "",
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
            };
          } catch (error) {
            return {
              id: finding.id,
              explanation: `[Error] ${finding.title}`,
              inputTokens: 0,
              outputTokens: 0,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })
      );

      results.push(...batchResults);
    }

    return {
      explanations: results,
      totalInputTokens: results.reduce((sum, r) => sum + r.inputTokens, 0),
      totalOutputTokens: results.reduce((sum, r) => sum + r.outputTokens, 0),
    };
  },
});
