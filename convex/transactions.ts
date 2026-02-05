import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").order("desc").collect();
    
    // Enrich with loan and contact details
    const enrichedTransactions = await Promise.all(
      transactions.map(async (t) => {
        let contactName = "Unknown";
        if (t.loanId) {
            const loan = await ctx.db.get(t.loanId);
            
            if (loan) {
              const customer = await ctx.db.get(loan.customerId);
              if (customer) {
                const contact = await ctx.db.get(customer.contactId);
                if (contact) contactName = contact.name;
              }
            }
        }

        return {
          ...t,
          clientName: contactName,
          loanId: t.loanId,
        };
      })
    );

    return enrichedTransactions;
  },
});

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    type: v.optional(v.union(v.literal("disbursement"), v.literal("repayment"), v.literal("penalty"), v.literal("expense"), v.literal("adjustment"), v.literal("income"))),
    method: v.optional(v.union(v.literal("cash"), v.literal("mobile_money"), v.literal("bank"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, type, method, search } = args;
    const result = await ctx.db
      .query("transactions")
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });

    let page = result.page;
    if (type) page = page.filter((t) => t.type === type);
    if (method) page = page.filter((t) => t.method === method);

    const enriched = await Promise.all(
      page.map(async (t) => {
        let contactName = undefined as string | undefined;
        if (t.loanId) {
          const loan = await ctx.db.get(t.loanId as any);
          if (loan) {
            const customer = await ctx.db.get((loan as any).customerId);
            if (customer) {
              const contact = await ctx.db.get((customer as any).contactId);
              contactName = (contact as any)?.name ?? "Unknown";
            }
          }
        }
        let accountName = undefined as string | undefined;
        if (t.accountId) {
          const account = await ctx.db.get(t.accountId as any);
          accountName = (account as any)?.name;
        }
        return { ...t, clientName: contactName, accountName };
      })
    );

    const filtered = search
      ? enriched.filter((t) =>
          `${t.clientName ?? ""} ${t.accountName ?? ""}`.toLowerCase().includes(search.toLowerCase())
        )
      : enriched;

    return {
      page: filtered,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const listRepayments = query({
  args: {},
  handler: async (ctx) => {
    // Filter for repayments in code or use an index if added later. 
    // For now, fetching all and filtering in memory is fine for small datasets, 
    // but ideally we'd add an index on 'type' or just filter.
    // Since 'type' is not indexed alone (it is in schema but not indexed), we do full scan.
    const transactions = await ctx.db
      .query("transactions")
      .order("desc")
      .collect();
      
    const repayments = transactions.filter(t => t.type === "repayment");

    // Enrich with loan and client details
    const enrichedRepayments = await Promise.all(
      repayments.map(async (t) => {
        let clientName = "Unknown";
        if (t.loanId) {
            const loan = await ctx.db.get(t.loanId);
            
            if (loan) {
              const customer = await ctx.db.get(loan.customerId);
              if (customer) {
                const contact = await ctx.db.get(customer.contactId);
                if (contact) clientName = contact.name;
              }
            }
        }

        return {
          ...t,
          clientName,
        };
      })
    );

    return enrichedRepayments;
  },
});

export const listRepaymentsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    method: v.optional(v.union(v.literal("cash"), v.literal("mobile_money"), v.literal("bank"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, method, search } = args;
    const result = await ctx.db
      .query("transactions")
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });
    let page = result.page.filter((t) => t.type === "repayment");
    if (method) page = page.filter((t) => t.method === method);

    const enriched = await Promise.all(
      page.map(async (t) => {
        let clientName = "Unknown";
        if (t.loanId) {
            const loan = await ctx.db.get(t.loanId);
            if (loan) {
                const customer = await ctx.db.get(loan.customerId);
                if (customer) {
                    const contact = await ctx.db.get(customer.contactId);
                    clientName = contact?.name ?? "Unknown";
                }
            }
        }
        return { ...t, clientName };
      })
    );

    const filtered = search
      ? enriched.filter((t) =>
          `${t.clientName}`.toLowerCase().includes(search.toLowerCase())
        )
      : enriched;

    return {
      page: filtered,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const create = mutation({
  args: {
    loanId: v.id("loans"),
    accountId: v.optional(v.id("accounts")),
    amount: v.number(),
    type: v.union(
      v.literal("disbursement"),
      v.literal("repayment"),
      v.literal("penalty")
    ),
    method: v.union(
      v.literal("cash"),
      v.literal("mobile_money"),
      v.literal("bank")
    ),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Validate Account Balance if Account provided
    if (args.accountId) {
      const account = await ctx.db.get(args.accountId);
      if (!account) throw new Error("Account not found");
      
      if (args.type === "disbursement") {
        if (account.balance < args.amount) {
          throw new Error("Insufficient funds in the selected account");
        }
        // Deduct from account
        await ctx.db.patch(args.accountId, {
          balance: account.balance - args.amount,
          updatedAt: now,
        });
      } else if (args.type === "repayment") {
        // Add to account
        await ctx.db.patch(args.accountId, {
          balance: account.balance + args.amount,
          updatedAt: now,
        });
      }
    }

    // Create transaction
    const transactionId = await ctx.db.insert("transactions", {
      ...args,
      createdAt: now,
      confirmed: true, // Auto-confirm for manual entry by admin
    });

    // Handle Disbursement: Update Loan Status to Active
    if (args.type === "disbursement") {
        const loan = await ctx.db.get(args.loanId);
        if (loan && loan.status === "new") {
            await ctx.db.patch(args.loanId, {
                status: "active",
                // Set start date to now if not set? It's already set in creation but maybe update it?
                // Keeping original start date is fine.
            });
        }
    }

    // Update loan balance if repayment
    if (args.type === "repayment") {
        const loan = await ctx.db.get(args.loanId);
        if (loan) {
            const newBalance = loan.outstandingBalance - args.amount;
            await ctx.db.patch(args.loanId, {
                outstandingBalance: newBalance > 0 ? newBalance : 0,
                status: newBalance <= 0 ? "completed" : loan.status
            });
        }
    }

    // Legacy: Update Bank Balance (Main Balance) if no specific account used and method is bank
    // If accountId IS provided, we already updated the specific account, so we don't touch the singleton 'bank' table
    // unless we want to keep them in sync? usually separate. 
    // Let's assume if accountId is NOT provided, we fall back to legacy behavior.
    if (!args.accountId && args.method === "bank") {
        const delta = args.type === "disbursement" ? -args.amount : args.amount;
        const rows = await ctx.db.query("bank").order("desc").collect();
        const row = rows[0];
        if (!row) {
            await ctx.db.insert("bank", { balance: delta, updatedAt: now });
        } else {
            await ctx.db.patch(row._id, { balance: row.balance + delta, updatedAt: now });
        }
    }

    // Log to Loan Activities
    await ctx.db.insert("loanActivities", {
        loanId: args.loanId,
        type: args.type === "repayment" ? "success" : args.type === "penalty" ? "warning" : "info",
        title: args.type.charAt(0).toUpperCase() + args.type.slice(1),
        description: `${args.type === 'repayment' ? 'Received' : 'Applied'} ${args.amount} via ${args.method}. Reference: ${args.reference ?? 'N/A'}`,
        performedBy: "system", // Or user if we had context
        createdAt: now,
    });

    return transactionId;
  },
});

export const createGeneral = mutation({
  args: {
    accountId: v.id("accounts"),
    amount: v.number(),
    categoryId: v.id("categories"),
    type: v.union(
      v.literal("expense"),
      v.literal("income"),
      v.literal("adjustment"),
      v.literal("repayment"),
      v.literal("disbursement")
    ),
    method: v.union(v.literal("cash"), v.literal("mobile_money"), v.literal("bank")),
    note: v.optional(v.string()),
    reference: v.optional(v.string()),
    loanId: v.optional(v.id("loans")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");
    const before = account.balance;
    const direction = category.effect; // "increase" | "decrease"
    const after = direction === "increase" ? before + args.amount : before - args.amount;
    // Insert transaction snapshot
    const txId = await ctx.db.insert("transactions", {
      loanId: args.loanId,
      accountId: args.accountId,
      categoryId: args.categoryId,
      amount: args.amount,
      type: args.type,
      method: args.method,
      reference: args.reference,
      note: args.note,
      balanceBefore: before,
      balanceAfter: after,
      createdAt: now,
      confirmed: true,
    });
    // Update account balance
    await ctx.db.patch(args.accountId, { balance: after, updatedAt: now });
    return txId;
  },
});

export const listUnconfirmedBank = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("transactions").order("desc").collect();
    const page = rows.filter((t) => t.method === "bank" && !t.confirmed);
    const enriched = await Promise.all(
      page.map(async (t) => {
        let clientName = "Unknown";
        if (t.loanId) {
            const loan = await ctx.db.get(t.loanId);
            if (loan) {
                const customer = await ctx.db.get(loan.customerId);
                if (customer) {
                    const contact = await ctx.db.get(customer.contactId);
                    clientName = contact?.name ?? "Unknown";
                }
            }
        }
        return { ...t, clientName };
      })
    );
    return enriched;
  },
});

export const confirm = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.id);
    if (!tx) return false;
    if (tx.confirmed) return true;
    await ctx.db.patch(args.id, { confirmed: true });
    if (tx.method === "bank") {
      const delta =
        tx.type === "disbursement" ? -tx.amount : tx.amount;
      const rows = await ctx.db.query("bank").order("desc").collect();
      const now = Date.now();
      const row = rows[0];
      if (!row) {
        await ctx.db.insert("bank", { balance: delta, updatedAt: now });
      } else {
        await ctx.db.patch(row._id, { balance: row.balance + delta, updatedAt: now });
      }
    }
    return true;
  },
});
