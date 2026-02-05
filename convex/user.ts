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