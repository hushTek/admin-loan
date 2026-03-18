import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();
  },
});


export const createUser = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("admin"),
      v.literal("loan_officer"),
      v.literal("cashier"),
      v.literal("viewer"),
      v.literal("contact")
    )),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", args);
  },
});