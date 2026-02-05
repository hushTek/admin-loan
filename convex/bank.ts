import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("bank").order("desc").collect();
    const row = rows[0];
    if (!row) {
      return { balance: 0, updatedAt: 0 };
    }
    return { balance: row.balance, updatedAt: row.updatedAt, _id: row._id };
  },
});

export const set = mutation({
  args: { balance: v.number() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("bank").order("desc").collect();
    const now = Date.now();
    const row = rows[0];
    if (!row) {
      const id = await ctx.db.insert("bank", { balance: args.balance, updatedAt: now });
      return id;
    }
    await ctx.db.patch(row._id, { balance: args.balance, updatedAt: now });
    return row._id;
  },
});

export const adjust = mutation({
  args: { delta: v.number() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("bank").order("desc").collect();
    const now = Date.now();
    const row = rows[0];
    if (!row) {
      const id = await ctx.db.insert("bank", { balance: args.delta, updatedAt: now });
      return id;
    }
    const next = row.balance + args.delta;
    await ctx.db.patch(row._id, { balance: next, updatedAt: now });
    return row._id;
  },
});
