import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const cats = await ctx.db.query("categories").order("desc").collect();
    return cats;
  },
});

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    kind: v.optional(v.union(v.literal("expense"), v.literal("repayment"), v.literal("adjustment"), v.literal("income"), v.literal("disbursement"))),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, kind, active } = args;
    const result = await ctx.db
      .query("categories")
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });
    let page = result.page;
    if (typeof active === "boolean") page = page.filter((c) => c.active === active);
    if (kind) page = page.filter((c) => c.kind === kind);
    return {
      page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    effect: v.union(v.literal("increase"), v.literal("decrease")),
    kind: v.union(v.literal("expense"), v.literal("repayment"), v.literal("adjustment"), v.literal("income"), v.literal("disbursement")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("categories", {
      name: args.name,
      code: args.code,
      effect: args.effect,
      kind: args.kind,
      active: true,
      createdAt: now,
    });
    return id;
  },
});
