import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const importLegacyLoans = mutation({
  args: {
    loans: v.array(
      v.object({
        // Customer Info
        customer_name: v.string(),
        customer_phone: v.string(),
        customer_nida: v.optional(v.string()),
        customer_email: v.optional(v.string()),
        customer_address: v.optional(v.string()),

        // Loan Info
        loan_amount: v.number(),
        loan_product: v.optional(v.string()), // Name of loan type
        interest_rate: v.number(),
        duration_months: v.number(),
        start_date: v.string(), // ISO date string or YYYY-MM-DD
        
        // Repayment Info
        repayment_amount: v.optional(v.number()),
        repayment_date: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const row of args.loans) {
      try {
        // 1. Find or Create Contact
        let contact = await ctx.db
          .query("contacts")
          .filter((q) => q.eq(q.field("phone"), row.customer_phone))
          .first();

        if (!contact && row.customer_nida) {
            contact = await ctx.db
            .query("contacts")
            .filter((q) => q.eq(q.field("identity.serial"), row.customer_nida))
            .first();
        }

        if (!contact) {
          const contactId = await ctx.db.insert("contacts", {
            name: row.customer_name,
            phone: row.customer_phone,
            email: row.customer_email ?? "",
            dateOfBirth: "", // Placeholder
            marital: { status: "single" },
            identity: {
              type: "NIDA",
              serial: row.customer_nida,
            },
            address: {
                street: row.customer_address
            },
            createdAt: Date.now(),
          });
          contact = await ctx.db.get(contactId);
        }

        if (!contact) throw new Error("Failed to create contact");

        // 2. Find or Create Customer
        let customer = await ctx.db
          .query("customers")
          .withIndex("by_contact", (q) => q.eq("contactId", contact!._id))
          .first();

        if (!customer) {
          const customerId = await ctx.db.insert("customers", {
            contactId: contact._id,
            status: "active",
            createdAt: Date.now(),
          });
          customer = await ctx.db.get(customerId);
        }

        if (!customer) throw new Error("Failed to create customer");

        // 3. Prepare Loan Data
        const principal = row.loan_amount;
        const interestRate = row.interest_rate;
        const duration = row.duration_months;
        
        // Simple Interest Calculation
        const interestAmount = principal * (interestRate / 100);
        const totalPayable = principal + interestAmount;
        const installmentAmount = totalPayable / duration; // Assuming monthly

        const startDate = row.start_date ? new Date(row.start_date).getTime() : Date.now();
        if (isNaN(startDate)) throw new Error(`Invalid Start Date: ${row.start_date}`);

        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);

        // 4. Create Dummy Application
        // Try to find a loan type ID if name provided
        let loanTypeId = undefined;
        if (row.loan_product) {
            const lt = await ctx.db.query("loanTypes").filter(q => q.eq(q.field("name"), row.loan_product)).first();
            if (lt) loanTypeId = lt._id;
        }

        const applicationId = await ctx.db.insert("loanApplications", {
          contactId: contact._id,
          loanTypeId,
          applicationNumber: `LEGACY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          requestedAmount: principal,
          status: "approved",
          createdAt: startDate,
          submittedAt: startDate,
        });

        // 5. Create Loan
        // Check if similar loan exists
        let loan = await ctx.db
            .query("loans")
            .withIndex("by_customer", (q) => q.eq("customerId", customer!._id))
            .filter((q) => 
                q.and(
                    q.eq(q.field("principalAmount"), principal),
                    q.eq(q.field("startDate"), startDate)
                )
            )
            .first();

        // Calculate outstanding
        const repaid = row.repayment_amount ?? 0;
        const outstandingBalance = Math.max(0, totalPayable - repaid);
        const status = outstandingBalance <= 0 ? "completed" : "active";

        let loanId;
        if (!loan) {
            loanId = await ctx.db.insert("loans", {
              applicationId,
              customerId: customer._id,
              loanTypeSnapshot: {
                name: row.loan_product ?? "Legacy Loan",
                interestRate,
                penaltyRate: 0, // Default
                durationMonths: duration,
                calculationMethod: "flat", // Default
              },
              principalAmount: principal,
              interestAmount,
              totalPayable,
              installmentAmount,
              outstandingBalance,
              startDate,
              expectedEndDate: endDate.getTime(),
              status,
            });
        } else {
            loanId = loan._id;
        }

        // 6. Create Transaction (if repaid > 0)
        if (repaid > 0) {
            let txDate = Date.now();
            if (row.repayment_date && row.repayment_date.trim() !== "") {
                const parsed = new Date(row.repayment_date).getTime();
                if (!isNaN(parsed)) txDate = parsed;
            }

            // Check if duplicate transaction exists
            const existingTx = await ctx.db
                .query("transactions")
                .withIndex("by_loan", (q) => q.eq("loanId", loanId))
                .filter((q) => 
                    q.and(
                        q.eq(q.field("type"), "repayment"),
                        q.eq(q.field("amount"), repaid),
                        q.eq(q.field("reference"), "LEGACY-IMPORT")
                    )
                )
                .first();

            if (!existingTx) {
                await ctx.db.insert("transactions", {
                    loanId,
                    amount: repaid,
                    type: "repayment",
                    method: "cash", // Default for legacy
                    reference: "LEGACY-IMPORT",
                    createdAt: txDate,
                    confirmed: true
                });
            }
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row error (${row.customer_name}): ${error.message}`);
      }
    }

    return results;
  },
});
