import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user preferences
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    // Return default preferences if none exist
    if (!preferences) {
      return {
        defaultJurisdiction: undefined,
        enablePillar2: true,
        emailNotifications: false,
        theme: "dark" as const,
      };
    }

    return preferences;
  },
});

// Save or update user preferences
export const save = mutation({
  args: {
    defaultJurisdiction: v.optional(v.string()),
    enablePillar2: v.boolean(),
    emailNotifications: v.boolean(),
    theme: v.union(v.literal("dark"), v.literal("light"), v.literal("system")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("userPreferences", {
        userId: identity.subject,
        ...args,
      });
    }
  },
});
