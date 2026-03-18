import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { requireRole } from "./lib/rbac";

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, search } = args;
    const result = await ctx.db
      .query("contacts")
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });

    const page = search
      ? result.page.filter((c) => {
          const hay =
            `${c.name} ${c.email} ${c.phone}`.toLowerCase();
          return hay.includes(search.toLowerCase());
        })
      : result.page;

    return {
      page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const getByNida = query({
  args: { nida: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "loan_officer", "cashier", "viewer"]);
    const nida = args.nida.trim();
    if (!nida) return null;
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_nida", (q) => q.eq("identity.serial", nida))
      .first();
    return contact ?? null;
  },
});
