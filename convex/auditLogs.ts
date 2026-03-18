import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireRole } from "./lib/rbac";

export const listForLoan = query({
  args: {
    loanId: v.id("loans"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_entity", (q) => q.eq("entityTable", "loans").eq("entityId", args.loanId))
      .order("desc")
      .collect();
  },
});

