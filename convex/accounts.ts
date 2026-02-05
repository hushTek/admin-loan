import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("accounts").order("desc").collect();
    return accounts;
  },
});

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    type: v.optional(v.union(v.literal("cash"), v.literal("bank"), v.literal("mobile_money"), v.literal("other"))),
    search: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, type, search, active } = args;
    const result = await ctx.db
      .query("accounts")
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });
    let page = result.page;
    if (typeof active === "boolean") page = page.filter((a) => a.active === active);
    if (type) page = page.filter((a) => a.type === type);
    if (search) page = page.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    return {
      page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const get = query({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account) return null;
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_loan") // fallback index; we will filter in memory for accountId
      .order("desc")
      .collect();
    const accountTxs = txs.filter((t) => t.accountId && t.accountId === args.id);
    return { account, transactions: accountTxs };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("cash"), v.literal("bank"), v.literal("mobile_money"), v.literal("other")),
    currency: v.optional(v.string()),
    balance: v.number(),
    accountNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let accountNumber = args.accountNumber;
    if (!accountNumber) {
      const pad = (n: number) => n.toString().padStart(2, "0");
      const d = new Date(now);
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      accountNumber = `ACC-${y}${m}${day}-${rand}`;
    }
    const id = await ctx.db.insert("accounts", {
      name: args.name,
      type: args.type,
      currency: args.currency ?? "TZS",
      balance: args.balance,
      accountNumber,
      createdAt: now,
      updatedAt: now,
      active: true,
    });
    return id;
  },
});

export const adjustBalance = mutation({
  args: {
    accountId: v.id("accounts"),
    newBalance: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");
    const now = Date.now();
    const before = account.balance;
    const after = args.newBalance;
    const delta = after - before;
    await ctx.db.patch(args.accountId, { balance: after, updatedAt: now });
    // Record adjustment transaction with before/after snapshot
    await ctx.db.insert("transactions", {
      loanId: (await ctx.db.query("loans").order("desc").first())?._id ?? (undefined as any), // placeholder: not tied to a loan
      accountId: args.accountId,
      categoryId: undefined,
      amount: Math.abs(delta),
      type: "adjustment",
      method: account.type === "bank" ? "bank" : account.type === "mobile_money" ? "mobile_money" : "cash",
      reference: undefined,
      note: args.note ?? "Balance adjustment",
      balanceBefore: before,
      balanceAfter: after,
      createdAt: now,
      confirmed: true,
    });
    return true;
  },
});

export const listAccountTransactions = query({
  args: {
    accountId: v.id("accounts"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { accountId, paginationOpts } = args;
    const all = await ctx.db
      .query("transactions")
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });
    const page = all.page.filter((t) => t.accountId && t.accountId === accountId);
    return {
      page,
      isDone: all.isDone,
      continueCursor: all.continueCursor,
    };
  },
});
