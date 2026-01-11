/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_generateAiExplanation from "../actions/generateAiExplanation.js";
import type * as actions_generateSummary from "../actions/generateSummary.js";
import type * as aiUsage from "../aiUsage.js";
import type * as docRefIdRegistry from "../docRefIdRegistry.js";
import type * as findings from "../findings.js";
import type * as http from "../http.js";
import type * as userPreferences from "../userPreferences.js";
import type * as validationReports from "../validationReports.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/generateAiExplanation": typeof actions_generateAiExplanation;
  "actions/generateSummary": typeof actions_generateSummary;
  aiUsage: typeof aiUsage;
  docRefIdRegistry: typeof docRefIdRegistry;
  findings: typeof findings;
  http: typeof http;
  userPreferences: typeof userPreferences;
  validationReports: typeof validationReports;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
