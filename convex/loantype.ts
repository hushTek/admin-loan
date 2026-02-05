import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    search: v.optional(v.string()),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("loanTypes").order("desc").collect();
    const filtered = all.filter((lt) => {
      const activeOk = args.includeInactive ? true : lt.active;
      const searchOk = args.search
        ? `${lt.name} ${lt.description ?? ""}`.toLowerCase().includes(args.search.toLowerCase())
        : true;
      return activeOk && searchOk;
    });
    return filtered;
  },
});

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, search, includeInactive } = args;
    const result = await ctx.db
      .query("loanTypes")
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });
    const filtered = result.page.filter((lt) => {
      const activeOk = includeInactive ? true : lt.active;
      const searchOk = search
        ? `${lt.name} ${lt.description ?? ""}`.toLowerCase().includes(search.toLowerCase())
        : true;
      return activeOk && searchOk;
    });
    return {
      page: filtered,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const get = query({
  args: { id: v.id("loanTypes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    minAmount: v.number(),
    maxAmount: v.number(),
    interestRate: v.number(),
    penaltyRate: v.number(),
    processingFeeType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
    processingFeeValue: v.optional(v.number()),
    durationMonths: v.number(),
    repaymentFrequency: v.union(v.literal("monthly"), v.literal("weekly")),
    calculationMethod: v.union(v.literal("flat"), v.literal("reducing_balance")),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.minAmount > args.maxAmount) {
      throw new Error("minAmount cannot be greater than maxAmount");
    }
    const now = Date.now();
    const id = await ctx.db.insert("loanTypes", {
      ...args,
      createdAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("loanTypes"),
    patch: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      minAmount: v.optional(v.number()),
      maxAmount: v.optional(v.number()),
      interestRate: v.optional(v.number()),
      penaltyRate: v.optional(v.number()),
      processingFeeType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
      processingFeeValue: v.optional(v.number()),
      durationMonths: v.optional(v.number()),
      repaymentFrequency: v.optional(v.union(v.literal("monthly"), v.literal("weekly"))),
      calculationMethod: v.optional(v.union(v.literal("flat"), v.literal("reducing_balance"))),
      active: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Loan type not found");
    if (
      args.patch.minAmount !== undefined ||
      args.patch.maxAmount !== undefined
    ) {
      const min = args.patch.minAmount ?? existing.minAmount;
      const max = args.patch.maxAmount ?? existing.maxAmount;
      if (min > max) {
        throw new Error("minAmount cannot be greater than maxAmount");
      }
    }
    await ctx.db.patch(args.id, args.patch);
    return true;
  },
});

export const remove = mutation({
  args: { id: v.id("loanTypes") },
  handler: async (ctx, args) => {
    // Optional: ensure no applications reference this loan type
    const ref = await ctx.db.query("loanApplications").collect();
    const hasReference = ref.some((r) => r.loanTypeId === args.id);
    if (hasReference) {
      throw new Error("Cannot delete: loan type is referenced by applications");
    }
    await ctx.db.delete(args.id);
    return true;
  },
});
