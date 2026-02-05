import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.union(v.literal("new"), v.literal("active"), v.literal("completed"), v.literal("defaulted"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, status, search } = args;
    const result = await ctx.db
      .query("loans")
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });

    let page = result.page;
    if (status) {
      page = page.filter((l) => l.status === status);
    }
    
    // Enrich with contact details for search and display
    const enriched = await Promise.all(
        page.map(async (l) => {
          const customer = await ctx.db.get(l.customerId);
          let contactName = "";
          let contactId = null;
          if (customer) {
              const contact = await ctx.db.get(customer.contactId);
              contactName = contact?.name ?? "";
              contactId = contact?._id;
          }
          return { ...l, clientName: contactName, contactId };
        })
      );

    if (search) {
      const lower = search.toLowerCase();
      const filtered = enriched.filter(
        (l) =>
          `${l.clientName}`.toLowerCase().includes(lower) ||
          String(l.principalAmount).includes(search)
      );
       return {
            page: filtered,
            isDone: result.isDone,
            continueCursor: result.continueCursor,
        };
    }

    return {
      page: enriched,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const get = query({
    args: { id: v.id("loans") },
    handler: async (ctx, args) => {
        const loan = await ctx.db.get(args.id);
        if (!loan) return null;
        
        const customer = await ctx.db.get(loan.customerId);
        let contact = null;
        if (customer) {
            contact = await ctx.db.get(customer.contactId);
        }
        
        return { loan, customer, contact };
    }
});

export const getActivities = query({
    args: { loanId: v.id("loans") },
    handler: async (ctx, args) => {
        return await ctx.db.query("loanActivities")
            .withIndex("by_loan", (q) => q.eq("loanId", args.loanId))
            .order("desc")
            .collect();
    }
});

export const getTransactions = query({
    args: { loanId: v.id("loans") },
    handler: async (ctx, args) => {
        return await ctx.db.query("transactions")
            .withIndex("by_loan", (q) => q.eq("loanId", args.loanId))
            .order("desc")
            .collect();
    }
});

export const approveApplication = mutation({
    args: { applicationId: v.id("loanApplications") },
    handler: async (ctx, args) => {
        const app = await ctx.db.get(args.applicationId);
        if (!app) throw new Error("Application not found");
        
        if (app.status === "approved") {
            // Check if loan already exists
             const existingLoan = await ctx.db.query("loans")
                .filter(q => q.eq(q.field("applicationId"), app._id))
                .first();
             if (existingLoan) return existingLoan._id;
        }

        const contact = await ctx.db.get(app.contactId);
        if (!contact) throw new Error("Contact not found");

        // 1. Find or create customer
        let customer = await ctx.db.query("customers")
            .withIndex("by_contact", (q) => q.eq("contactId", app.contactId))
            .first();
            
        if (!customer) {
            const customerId = await ctx.db.insert("customers", {
                contactId: app.contactId,
                status: "active",
                createdAt: Date.now(),
            });
            customer = await ctx.db.get(customerId);
        }

        if (!customer) throw new Error("Failed to create/fetch customer");

        // 2. Get Loan Type and calculate
        if (!app.loanTypeId) throw new Error("Loan Type not specified");
        const loanType = await ctx.db.get(app.loanTypeId);
        if (!loanType) throw new Error("Loan Type not found");

        const principal = app.requestedAmount ?? 0;
        const interestRate = loanType.interestRate; // %
        const duration = loanType.durationMonths;
        
        // Simple interest calculation (adjust based on method if needed, using 'flat' logic as default)
        const interestAmount = principal * (interestRate / 100);
        const totalPayable = principal + interestAmount;
        
        // Installments
        let numInstallments = duration; // if monthly
        if (loanType.repaymentFrequency === "weekly") {
            numInstallments = duration * 4; // Approx
        }
        const installmentAmount = totalPayable / numInstallments;

        const now = Date.now();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + duration);

        // 3. Create Loan
        const loanId = await ctx.db.insert("loans", {
            applicationId: app._id,
            customerId: customer._id,
            loanTypeSnapshot: {
                name: loanType.name,
                interestRate: loanType.interestRate,
                penaltyRate: loanType.penaltyRate,
                durationMonths: loanType.durationMonths,
                calculationMethod: loanType.calculationMethod,
            },
            principalAmount: principal,
            interestAmount: interestAmount,
            totalPayable: totalPayable,
            installmentAmount: installmentAmount,
            outstandingBalance: totalPayable,
            startDate: now,
            expectedEndDate: endDate.getTime(),
            status: "new",
        });

        // 4. Update Application
        await ctx.db.patch(app._id, { status: "approved" });

        // 5. Log Activity
        await ctx.db.insert("loanActivities", {
            loanId,
            type: "success",
            title: "Loan Approved",
            description: `Loan generated from Application ${app.applicationNumber}`,
            performedBy: "system", 
            createdAt: now,
        });

        return loanId;
    }
});

export const sendReminder = mutation({
    args: { 
        loanId: v.id("loans"),
        type: v.union(v.literal("sms"), v.literal("email")),
        message: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const loan = await ctx.db.get(args.loanId);
        if (!loan) throw new Error("Loan not found");
        
        const customer = await ctx.db.get(loan.customerId);
        if (!customer) throw new Error("Customer not found");
        
        const contact = await ctx.db.get(customer.contactId);
        if (!contact) throw new Error("Contact not found");

        const message = args.message ?? `Dear ${contact.name}, this is a reminder regarding your loan payment.`;

        // In a real app, call external API here.
        // For now, log to smsLogs if SMS
        if (args.type === "sms") {
            await ctx.db.insert("smsLogs", {
                phone: contact.phone,
                message: message,
                status: "sent",
                sentAt: Date.now(),
            });
        }

        // Log Activity
        await ctx.db.insert("loanActivities", {
            loanId: args.loanId,
            type: "info",
            title: `${args.type.toUpperCase()} Reminder Sent`,
            description: `Sent to ${contact.name}: "${message}"`,
            performedBy: "admin",
            createdAt: Date.now(),
        });
        
        return "sent";
    }
});
