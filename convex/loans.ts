import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { requireRole } from "./lib/rbac";
import { internal } from "./_generated/api";

function normalizeTzPhoneToE164(input: string): string {
  const raw = input.trim();
  // keep digits and leading +
  const cleaned = raw.startsWith("+")
    ? "+" + raw.slice(1).replace(/\D/g, "")
    : raw.replace(/\D/g, "");

  if (cleaned.startsWith("+255")) {
    const rest = cleaned.slice(4);
    if (rest.length !== 9) throw new Error("Invalid phone number");
    return `+255${rest}`;
  }

  if (cleaned.startsWith("255")) {
    const rest = cleaned.slice(3);
    if (rest.length !== 9) throw new Error("Invalid phone number");
    return `+255${rest}`;
  }

  if (cleaned.startsWith("0")) {
    const rest = cleaned.slice(1);
    if (rest.length !== 9) throw new Error("Invalid phone number");
    return `+255${rest}`;
  }

  throw new Error("Invalid phone number");
}

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

        const application = await ctx.db.get(loan.applicationId);
        
        const customer = await ctx.db.get(loan.customerId);
        let contact = null;
        if (customer) {
            contact = await ctx.db.get(customer.contactId);
        }
        
        return { loan, application, customer, contact };
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
        await requireRole(ctx, ["admin", "loan_officer"]);
        const loan = await ctx.db.get(args.loanId);
        if (!loan) throw new Error("Loan not found");
        
        const customer = await ctx.db.get(loan.customerId);
        if (!customer) throw new Error("Customer not found");
        
        const contact = await ctx.db.get(customer.contactId);
        if (!contact) throw new Error("Contact not found");

        const message = args.message ?? `Dear ${contact.name}, this is a reminder regarding your loan payment.`;

        if (args.type === "sms") {
            await ctx.scheduler.runAfter(0, internal.notifications.sendSmsInternal, {
              to: contact.phone,
              message,
            });
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

function computeLoanFigures(args: {
  principalAmount: number;
  interestRate: number;
  durationMonths: number;
  repaymentFrequency: "monthly" | "weekly";
}) {
  const interestAmount = args.principalAmount * (args.interestRate / 100);
  const totalPayable = args.principalAmount + interestAmount;
  const numInstallments =
    args.repaymentFrequency === "weekly" ? args.durationMonths * 4 : args.durationMonths;
  const installmentAmount = numInstallments > 0 ? totalPayable / numInstallments : totalPayable;
  return { interestAmount, totalPayable, installmentAmount };
}

function code(len = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export const adminCreateApproved = mutation({
  args: {
    contact: v.object({
      name: v.string(),
      phone: v.string(),
      email: v.string(),
      dateOfBirth: v.string(),
      maritalStatus: v.string(),
      spouseName: v.optional(v.string()),
      nidaNumber: v.optional(v.string()),
      address: v.optional(
        v.object({
          street: v.optional(v.string()),
          ward: v.optional(v.string()),
          district: v.optional(v.string()),
          region: v.optional(v.string()),
          houseNumber: v.optional(v.string()),
        })
      ),
    }),
    loan: v.object({
      loanTypeId: v.id("loanTypes"),
      principalAmount: v.number(),
      loanPurpose: v.optional(v.string()),
      startDate: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["admin", "loan_officer"]);
    const now = Date.now();

    const normalizedPhone = normalizeTzPhoneToE164(args.contact.phone);
    const normalizedEmail = args.contact.email.trim().toLowerCase();
    if (!args.contact.name.trim()) throw new Error("Customer name is required");
    if (!normalizedEmail) throw new Error("Email is required");
    if (!args.contact.dateOfBirth.trim()) throw new Error("Date of birth is required");
    if (!args.contact.maritalStatus.trim()) throw new Error("Marital status is required");

    if (args.loan.principalAmount <= 0) {
      throw new Error("Principal amount must be greater than 0");
    }

    const loanType = await ctx.db.get(args.loan.loanTypeId);
    if (!loanType) throw new Error("Loan type not found");

    const startDate =
      args.loan.startDate !== undefined ? args.loan.startDate : now;
    if (!Number.isFinite(startDate) || startDate <= 0) {
      throw new Error("Invalid start date");
    }
    if (startDate > now) {
      throw new Error("Start date cannot be in the future");
    }

    // 1) Upsert contact (NIDA/phone/email match)
    const nida = args.contact.nidaNumber?.trim() || "";
    const contact =
      (nida
        ? await ctx.db
            .query("contacts")
            .withIndex("by_nida", (q) => q.eq("identity.serial", nida))
            .first()
        : null) ??
      (await ctx.db
        .query("contacts")
        .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
        .first()) ??
      (await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .first());

    const nextContactPatch = {
      name: args.contact.name.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      dateOfBirth: args.contact.dateOfBirth.trim(),
      marital: {
        status: args.contact.maritalStatus.trim(),
        name: args.contact.spouseName?.trim() || undefined,
      },
      identity: {
        type: "NIDA",
        serial: args.contact.nidaNumber?.trim() || undefined,
      },
      address: {
        ...(contact?.address ?? {}),
        ...(args.contact.address ?? {}),
      },
    };

    let contactId = contact?._id;
    if (contactId) {
      await ctx.db.patch(contactId, nextContactPatch);
    } else {
      contactId = await ctx.db.insert("contacts", {
        ...nextContactPatch,
        work: undefined,
        createdAt: now,
      });
    }

    // 2) Ensure customer row exists
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_contact", (q) => q.eq("contactId", contactId))
      .first();
    let customerId = customer?._id;
    if (!customerId) {
      customerId = await ctx.db.insert("customers", {
        contactId,
        status: "active",
        createdAt: now,
        customerNumber: `CUST-${now}`,
      });
    }

    // 3) Create application (approved immediately)
    let applicationNumber = `ADM-${new Date(now).getFullYear()}-${code()}`;
    for (let i = 0; i < 5; i++) {
      const exists = await ctx.db
        .query("loanApplications")
        .withIndex("by_number", (q) => q.eq("applicationNumber", applicationNumber))
        .first();
      if (!exists) break;
      applicationNumber = `ADM-${new Date(now).getFullYear()}-${code()}`;
    }

    const applicationId = await ctx.db.insert("loanApplications", {
      contactId,
      loanTypeId: args.loan.loanTypeId,
      applicationNumber,
      requestedAmount: args.loan.principalAmount,
      loanPurpose: args.loan.loanPurpose?.trim() || undefined,
      hasOtherLoans: false,
      collateralDescription: undefined,
      declarationAccepted: true,
      status: "approved",
      currentStep: undefined,
      formData: undefined,
      submittedAt: now,
      reviewedBy: actor.userDocId,
      reviewNotes: "Created and approved by admin",
      source: "manual",
      createdSource: "staff",
      createdByClerkUserId: actor.clerkUserId,
      createdByName: actor.name,
      createdAt: now,
    });

    // 4) Create loan contract
    const figures = computeLoanFigures({
      principalAmount: args.loan.principalAmount,
      interestRate: loanType.interestRate,
      durationMonths: loanType.durationMonths,
      repaymentFrequency: loanType.repaymentFrequency,
    });
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + loanType.durationMonths);

    const loanId = await ctx.db.insert("loans", {
      applicationId,
      customerId,
      loanTypeSnapshot: {
        name: loanType.name,
        interestRate: loanType.interestRate,
        penaltyRate: loanType.penaltyRate,
        durationMonths: loanType.durationMonths,
        calculationMethod: loanType.calculationMethod,
      },
      principalAmount: args.loan.principalAmount,
      interestAmount: figures.interestAmount,
      totalPayable: figures.totalPayable,
      installmentAmount: figures.installmentAmount,
      outstandingBalance: figures.totalPayable,
      startDate,
      expectedEndDate: endDate.getTime(),
      status: "new",
    });

    await ctx.db.insert("loanActivities", {
      loanId,
      type: "success",
      title: "Loan created",
      description: `Loan created and approved by ${actor.name ?? actor.clerkUserId}. Application ${applicationNumber}.`,
      performedBy: actor.name ?? actor.clerkUserId,
      createdAt: now,
    });

    return { loanId, applicationId, contactId, customerId };
  },
});

export const amend = mutation({
  args: {
    loanId: v.id("loans"),
    loanTypeId: v.optional(v.id("loanTypes")),
    principalAmount: v.optional(v.number()),
    contactPatch: v.optional(
      v.object({
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        dateOfBirth: v.optional(v.string()),
        maritalStatus: v.optional(v.string()),
        spouseName: v.optional(v.string()),
        nidaNumber: v.optional(v.string()),
        address: v.optional(
          v.object({
            street: v.optional(v.string()),
            ward: v.optional(v.string()),
            district: v.optional(v.string()),
            region: v.optional(v.string()),
            houseNumber: v.optional(v.string()),
          })
        ),
      })
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["admin", "loan_officer"]);

    const loan = await ctx.db.get(args.loanId);
    if (!loan) throw new Error("Loan not found");

    const application = await ctx.db.get(loan.applicationId);
    if (!application) throw new Error("Loan application not found");

    const customer = await ctx.db.get(loan.customerId);
    if (!customer) throw new Error("Customer not found");

    const contact = await ctx.db.get(customer.contactId);
    if (!contact) throw new Error("Contact not found");

    const beforeSnapshot = {
      loan,
      application,
      customer,
      contact,
    };

    // Amend contact (if requested)
    if (args.contactPatch) {
      const cp = args.contactPatch;
      await ctx.db.patch(contact._id, {
        ...(cp.name !== undefined ? { name: cp.name } : {}),
        ...(cp.phone !== undefined ? { phone: cp.phone } : {}),
        ...(cp.email !== undefined ? { email: cp.email } : {}),
        ...(cp.dateOfBirth !== undefined ? { dateOfBirth: cp.dateOfBirth } : {}),
        ...(cp.maritalStatus !== undefined
          ? { marital: { ...contact.marital, status: cp.maritalStatus, name: cp.spouseName ?? contact.marital?.name } }
          : cp.spouseName !== undefined
            ? { marital: { ...contact.marital, name: cp.spouseName } }
            : {}),
        ...(cp.nidaNumber !== undefined
          ? { identity: { ...contact.identity, type: contact.identity?.type ?? "NIDA", serial: cp.nidaNumber } }
          : {}),
        ...(cp.address !== undefined
          ? {
              address: {
                ...contact.address,
                ...cp.address,
              },
            }
          : {}),
      });
    }

    const didChangeTerms = args.loanTypeId !== undefined || args.principalAmount !== undefined;
    if (didChangeTerms) {
      // Determine new loan type and principal for recalculation
      const loanTypeId = args.loanTypeId ?? application.loanTypeId ?? undefined;
      if (!loanTypeId) {
        throw new Error("Loan type is required to amend terms");
      }
      const loanType = await ctx.db.get(loanTypeId);
      if (!loanType) throw new Error("Loan type not found");

      const newPrincipal = args.principalAmount ?? loan.principalAmount;
      if (newPrincipal <= 0) throw new Error("Principal amount must be greater than 0");

      // Sum repayments to keep outstandingBalance consistent after amendments
      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_loan", (q) => q.eq("loanId", loan._id))
        .collect();
      const repaid = txs
        .filter((t) => t.type === "repayment")
        .reduce((sum, t) => sum + t.amount, 0);

      const figures = computeLoanFigures({
        principalAmount: newPrincipal,
        interestRate: loanType.interestRate,
        durationMonths: loanType.durationMonths,
        repaymentFrequency: loanType.repaymentFrequency,
      });

      const newOutstanding = Math.max(figures.totalPayable - repaid, 0);
      const newStatus: typeof loan.status =
        newOutstanding <= 0 ? "completed" : loan.status;

      // Update application terms (source of truth for requestedAmount/loanTypeId)
      await ctx.db.patch(application._id, {
        ...(args.loanTypeId ? { loanTypeId: args.loanTypeId } : {}),
        ...(args.principalAmount !== undefined ? { requestedAmount: newPrincipal } : {}),
      });

      // Update loan contract snapshot + figures
      await ctx.db.patch(loan._id, {
        loanTypeSnapshot: {
          name: loanType.name,
          interestRate: loanType.interestRate,
          penaltyRate: loanType.penaltyRate,
          durationMonths: loanType.durationMonths,
          calculationMethod: loanType.calculationMethod,
        },
        principalAmount: newPrincipal,
        interestAmount: figures.interestAmount,
        totalPayable: figures.totalPayable,
        installmentAmount: figures.installmentAmount,
        outstandingBalance: newOutstanding,
        status: newStatus,
      });
    }

    const now = Date.now();

    await ctx.db.insert("loanActivities", {
      loanId: loan._id,
      type: "info",
      title: "Loan Amended",
      description:
        args.reason?.trim()
          ? `Loan updated. Reason: ${args.reason.trim()}`
          : "Loan updated.",
      performedBy: actor.name ?? actor.clerkUserId,
      createdAt: now,
    });

    const afterLoan = await ctx.db.get(loan._id);
    const afterApplication = await ctx.db.get(application._id);
    const afterContact = await ctx.db.get(contact._id);

    await ctx.db.insert("auditLogs", {
      action: "loan.amend",
      entityTable: "loans",
      entityId: loan._id,
      performedByClerkUserId: actor.clerkUserId,
      performedByName: actor.name,
      reason: args.reason,
      snapshotJson: JSON.stringify({
        before: beforeSnapshot,
        after: {
          loan: afterLoan,
          application: afterApplication,
          contact: afterContact,
        },
      }),
      createdAt: now,
    });

    return { ok: true };
  },
});

export const adminDelete = mutation({
  args: {
    loanId: v.id("loans"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["admin"]);

    const loan = await ctx.db.get(args.loanId);
    if (!loan) throw new Error("Loan not found");

    const application = await ctx.db.get(loan.applicationId);
    if (!application) throw new Error("Loan application not found");

    const customer = await ctx.db.get(loan.customerId);
    const contact = customer ? await ctx.db.get(customer.contactId) : null;

    // Gather related rows for a full undo snapshot
    const [activities, transactions, documents, referees] = await Promise.all([
      ctx.db
        .query("loanActivities")
        .withIndex("by_loan", (q) => q.eq("loanId", loan._id))
        .collect(),
      ctx.db
        .query("transactions")
        .withIndex("by_loan", (q) => q.eq("loanId", loan._id))
        .collect(),
      ctx.db
        .query("documents")
        .filter((q) => q.eq(q.field("applicationId"), application._id))
        .collect(),
      ctx.db
        .query("referees")
        .filter((q) => q.eq(q.field("applicationId"), application._id))
        .collect(),
    ]);

    const refereeTokens = [];
    for (const ref of referees) {
      const tokens = await ctx.db
        .query("refereeTokens")
        .filter((q) => q.eq(q.field("refereeId"), ref._id))
        .collect();
      refereeTokens.push(...tokens);
    }

    const now = Date.now();

    await ctx.db.insert("auditLogs", {
      action: "loan.delete",
      entityTable: "loans",
      entityId: loan._id,
      performedByClerkUserId: actor.clerkUserId,
      performedByName: actor.name,
      reason: args.reason,
      snapshotJson: JSON.stringify({
        loan,
        application,
        customer,
        contact,
        activities,
        transactions,
        documents,
        referees,
        refereeTokens,
      }),
      createdAt: now,
    });

    // Delete related children first to avoid orphans
    for (const a of activities) await ctx.db.delete(a._id);
    for (const t of transactions) await ctx.db.delete(t._id);
    for (const d of documents) await ctx.db.delete(d._id);
    for (const tok of refereeTokens) await ctx.db.delete(tok._id);
    for (const r of referees) await ctx.db.delete(r._id);

    // Requirement: only remove loan and its application (keep contact/customer)
    await ctx.db.delete(loan._id);
    await ctx.db.delete(application._id);

    return { ok: true };
  },
});
