/**
 * Convex HTTP Router
 * 
 * Provides HTTP endpoints for server-side API routes to interact with Convex.
 * This enables the Next.js API route to save reports and register DocRefIds.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * Save a validation report from the API route
 * POST /api/saveReport
 */
http.route({
  path: "/saveReport",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      
      // Extract user ID from request (passed from Next.js API route via Clerk token)
      const authHeader = request.headers.get("Authorization");
      let userId = body.userId || "anonymous";
      
      // If we have a Clerk token, we could verify it here
      // For now, we'll trust the userId passed from the authenticated API route
      if (!userId || userId === "anonymous") {
        return new Response(
          JSON.stringify({ error: "User ID required" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // Save the report
      const reportId = await ctx.runMutation(api.validationReports.saveFromApi, {
        userId,
        fileName: body.fileName,
        fileSize: body.fileSize,
        reportingPeriod: body.reportingPeriod,
        reportingEntity: body.reportingEntity,
        jurisdictionCount: body.jurisdictionCount,
        totalErrors: body.totalErrors,
        totalWarnings: body.totalWarnings,
        validationStatus: body.validationStatus,
        validationResults: body.validationResults,
      });

      // Register DocRefIds if provided
      if (body.docRefIds && body.docRefIds.length > 0) {
        await ctx.runMutation(api.docRefIdRegistry.registerFromApi, {
          userId,
          reportId,
          docRefIds: body.docRefIds,
        });
      }

      return new Response(
        JSON.stringify({ reportId, success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error saving report:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * Check DocRefIds for uniqueness
 * POST /api/checkDocRefIds
 */
http.route({
  path: "/checkDocRefIds",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const docRefIds = body.docRefIds || [];

      const result = await ctx.runQuery(api.docRefIdRegistry.publicCheckDocRefIds, {
        docRefIds,
      });

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error checking DocRefIds:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
