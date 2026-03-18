import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("submitted"),
        v.literal("awaiting_referee"),
        v.literal("under_review"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
    source: v.optional(v.union(v.literal("customer"), v.literal("staff"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, status, search, source } = args;
    const base = ctx.db.query("loanApplications").order("desc");
    const result = await base.paginate({
      cursor: paginationOpts.cursor ?? null,
      numItems: paginationOpts.numItems,
    });

    let page = result.page;
    if (status) {
      page = page.filter((a) => a.status === status);
    }
    if (source) {
      page = page.filter((a) => (a.createdSource ?? "customer") === source);
    }

    // Always enrich with contact details
    const enriched = await Promise.all(
      page.map(async (a) => {
        const contact = await ctx.db.get(a.contactId);
        const loanType = a.loanTypeId ? await ctx.db.get(a.loanTypeId) : null;
        return {
          ...a,
          contact,
          contactName: contact?.name ?? "",
          contactPhone: contact?.phone ?? "",
          loanTypeName: loanType?.name ?? "",
        };
      })
    );

    let finalPage = enriched;

    if (search) {
      const lower = search.toLowerCase();
      finalPage = enriched.filter(
        (a) =>
          `${a.applicationNumber} ${a.contactName || a.contact?.name} ${a.contactPhone} ${a.loanTypeName} ${a.loanPurpose}`.toLowerCase().includes(lower)
      );
    }

    return {
      page: finalPage,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const submit = mutation({
  args: {
    applicationNumber: v.optional(v.string()),
    contact: v.object({
      name: v.string(),
      dateOfBirth: v.string(),
      phoneNumber: v.string(),
      email: v.string(),
      maritalStatus: v.string(),
      spouseName: v.optional(v.string()),
      residence: v.object({
        street: v.optional(v.string()),
        houseNumber: v.optional(v.string()),
        ward: v.optional(v.string()),
        district: v.optional(v.string()),
        region: v.optional(v.string()),
        ownership: v.optional(v.string()),
      }),
      employment: v.object({
        status: v.string(),
        companyName: v.optional(v.string()),
        address: v.optional(v.string()),
        position: v.optional(v.string()),
      }),
      nidaNumber: v.optional(v.string()),
    }),
    loanDetails: v.object({
      loanTypeId: v.id("loanTypes"),
      amount: v.string(),
      existingLoan: v.optional(v.string()),
      purpose: v.string(),
    }),
    guarantors: v.array(
      v.object({
        fullName: v.string(),
        phoneNumber: v.string(),
        email: v.optional(v.string()),
        relationship: v.optional(v.string()),
        residence: v.optional(v.string()),
        nidaNumber: v.optional(v.string()),
      })
    ),
    attachments: v.array(
      v.object({
        type: v.union(
          v.literal("nida"),
          v.literal("local_letter"),
          v.literal("collateral"),
          v.literal("photo"),
          v.literal("signature")
        ),
        storageId: v.string(),
        fileName: v.string(),
      })
    ),
    declarationAccepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = identity?.subject;
    let createdSource: "customer" | "staff" = "customer";
    let createdByName: string | undefined = undefined;
    if (clerkUserId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk", (q) => q.eq("clerkUserId", clerkUserId))
        .first();
      createdByName = user?.name;
      const role = user?.role;
      createdSource = role && role !== "contact" ? "staff" : "customer";
    }
    const statusMap: Record<string, "employment" | "business" | "unemployed" | "other"> = {
      employed: "employment",
      "self employed": "business",
      selfEmployed: "business",
      unemployed: "unemployed",
    };
    const workStatus =
      statusMap[args.contact.employment.status] ?? "other";

    let contactId: Id<"contacts">;
    const existingContacts = await ctx.db.query("contacts").collect();
    const existing = existingContacts.find(
      (c) =>
        (c.email && c.email.toLowerCase().trim() === args.contact.email.toLowerCase().trim()) ||
        (c.identity?.serial && args.contact.nidaNumber && c.identity.serial.trim() === args.contact.nidaNumber.trim())
    );
    if (existing) {
      contactId = existing._id as Id<"contacts">;
      // Update existing contact details
      await ctx.db.patch(contactId, {
        name: args.contact.name,
        dateOfBirth: args.contact.dateOfBirth,
        phone: args.contact.phoneNumber,
        marital: {
          status: args.contact.maritalStatus,
          name: args.contact.spouseName,
        },
        identity: {
          type: "NIDA",
          serial: args.contact.nidaNumber,
        },
        work: {
          company: args.contact.employment.companyName,
          address: args.contact.employment.address,
          designation: args.contact.employment.position,
          status: workStatus,
        },
        address: {
          street: args.contact.residence.street,
          ward: args.contact.residence.ward,
          district: args.contact.residence.district,
          region: args.contact.residence.region,
          residenceOwnership: args.contact.residence.ownership,
          ownership: args.contact.residence.ownership,
          houseNumber: args.contact.residence.houseNumber,
        },
      });
    } else {
      contactId = await ctx.db.insert("contacts", {
        name: args.contact.name,
        dateOfBirth: args.contact.dateOfBirth,
        phone: args.contact.phoneNumber,
        email: args.contact.email,
        marital: {
          status: args.contact.maritalStatus,
          name: args.contact.spouseName,
        },
        identity: {
          type: "NIDA",
          serial: args.contact.nidaNumber,
        },
        work: {
          company: args.contact.employment.companyName,
          address: args.contact.employment.address,
          designation: args.contact.employment.position,
          status: workStatus,
        },
        address: {
          street: args.contact.residence.street,
          ward: args.contact.residence.ward,
          district: args.contact.residence.district,
          region: args.contact.residence.region,
          residenceOwnership: args.contact.residence.ownership,
          ownership: args.contact.residence.ownership,
          houseNumber: args.contact.residence.houseNumber,
        },
        createdAt: now,
      });
    }

    function code(): string {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let out = "";
      for (let i = 0; i < 6; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
      }
      return `TFM-${out}`;
    }
    const requestedAmount = Number(args.loanDetails.amount) || 0;
    const hasOtherLoans = (args.loanDetails.existingLoan ?? "").toLowerCase() === "yes";
    
    let applicationId: Id<"loanApplications">;
    let applicationNumber = args.applicationNumber;

    // Check if we can update an existing draft
    let existingDraft = null;
    if (applicationNumber) {
        existingDraft = await ctx.db
            .query("loanApplications")
            .filter((q) => q.eq(q.field("applicationNumber"), applicationNumber))
            .first();
    }

    if (existingDraft) {
        applicationId = existingDraft._id;
        await ctx.db.patch(applicationId, {
            contactId,
            loanTypeId: args.loanDetails.loanTypeId,
            requestedAmount,
            loanPurpose: args.loanDetails.purpose,
            hasOtherLoans,
            collateralDescription: "Collateral pledged with listed guarantors.",
            declarationAccepted: args.declarationAccepted,
            status: "under_review",
            submittedAt: now,
            formData: undefined, // Clear draft data upon submission
            source: existingDraft.source ?? "portal",
            createdSource: existingDraft.createdSource ?? createdSource,
            createdByClerkUserId: existingDraft.createdByClerkUserId ?? clerkUserId,
            createdByName: existingDraft.createdByName ?? createdByName,
        });
    } else {
        if (!applicationNumber) {
            applicationNumber = code();
            for (let i = 0; i < 5; i++) {
                const exists = await ctx.db
                    .query("loanApplications")
                    .collect()
                    .then((all) => all.some((a) => a.applicationNumber === applicationNumber));
                if (!exists) break;
                applicationNumber = code();
            }
        }
        
        applicationId = await ctx.db.insert("loanApplications", {
            contactId,
            loanTypeId: args.loanDetails.loanTypeId,
            applicationNumber: applicationNumber!,
            requestedAmount,
            loanPurpose: args.loanDetails.purpose,
            hasOtherLoans,
            collateralDescription: "Collateral pledged with listed guarantors.",
            declarationAccepted: args.declarationAccepted,
            status: "under_review",
            submittedAt: now,
            source: "portal",
            createdSource,
            createdByClerkUserId: clerkUserId,
            createdByName,
            createdAt: now,
        });
    }

    // Process attachments
    // Note: If updating, we might want to clear old documents or append. 
    // For simplicity, we assume new attachments are added or we rely on them being the same.
    // Ideally, we should check if documents exist. 
    // Since attachments have storageId, let's just insert them. Duplicate documents table entries for same file are okay-ish, or we can check.
    
    // Better: delete old documents for this application if updating
    if (existingDraft) {
        const oldDocs = await ctx.db.query("documents").filter(q => q.eq(q.field("applicationId"), applicationId)).collect();
        for (const doc of oldDocs) {
            await ctx.db.delete(doc._id);
        }
        // Also clear old referees if any
        const oldRefs = await ctx.db.query("referees").filter(q => q.eq(q.field("applicationId"), applicationId)).collect();
        for (const ref of oldRefs) {
            await ctx.db.delete(ref._id);
            // And their tokens
             const tokens = await ctx.db.query("refereeTokens").filter(q => q.eq(q.field("refereeId"), ref._id)).collect();
             for (const t of tokens) await ctx.db.delete(t._id);
        }
    }

    for (const att of args.attachments) {
      const url = await ctx.storage.getUrl(att.storageId);
      if (url) {
        await ctx.db.insert("documents", {
          applicationId,
          type: att.type,
          fileUrl: url,
          fileName: att.fileName,
          uploadedAt: now,
        });
      }
    }

    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL
        ? process.env.NEXT_PUBLIC_SITE_URL
        : "http://localhost:3000";

    // Do not generate guarantor approval invitations or routes
    // Notify admins (if enabled)
    const settingsRows = await ctx.db.query("notificationSettings").order("desc").collect();
    const settings = settingsRows[0];
    if (settings?.enabled) {
      const subject = "New loan application submitted";
      const html = `
        <div style="font-family:system-ui,Segoe UI,Roboto,Arial;">
          <h2 style="margin:0 0 8px 0;">New loan application</h2>
          <p style="margin:0 0 4px 0;"><b>Application:</b> ${applicationNumber}</p>
          <p style="margin:0 0 4px 0;"><b>Customer:</b> ${args.contact.name}</p>
          <p style="margin:0 0 4px 0;"><b>Phone:</b> ${args.contact.phoneNumber}</p>
          <p style="margin:0 0 4px 0;"><b>Amount:</b> ${args.loanDetails.amount}</p>
          <p style="margin:12px 0 0 0;color:#555;">Open the admin dashboard to review.</p>
        </div>
      `;
      for (const email of settings.emails) {
        if (email.trim()) {
          await ctx.scheduler.runAfter(0, internal.notifications.sendEmailInternal, {
            to: email.trim(),
            subject,
            html,
          });
        }
      }
      const smsText = `New loan application ${applicationNumber} from ${args.contact.name}, phone ${args.contact.phoneNumber}, amount ${args.loanDetails.amount}.`;
      for (const phone of settings.phones) {
        if (phone.trim()) {
          await ctx.scheduler.runAfter(0, internal.notifications.sendSmsInternal, {
            to: phone.trim(),
            message: smsText,
          });
        }
      }
    }

    return { applicationId, applicationNumber };
  },
});

export const getByApplicationNumber = query({
  args: { applicationNumber: v.string() },
  handler: async (ctx, args) => {
    const application = await ctx.db
      .query("loanApplications")
      .filter((q) => q.eq(q.field("applicationNumber"), args.applicationNumber))
      .first();

    if (!application) {
      return null;
    }

    const referees = await ctx.db
      .query("referees")
      .filter((q) => q.eq(q.field("applicationId"), application._id))
      .collect();

    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("applicationId"), application._id))
      .collect();

    let loanType = null;
    if (application.loanTypeId) {
      loanType = await ctx.db.get(application.loanTypeId as Id<"loanTypes">);
    }

    return {
      application,
      referees,
      documents,
      loanType,
    };
  },
});

export const getById = query({
  args: { id: v.id("loanApplications") },
  handler: async (ctx, args) => {
    const application = await ctx.db.get(args.id);
    if (!application) return null;

    const contact = await ctx.db.get(application.contactId);
    let loanType = null;
    if (application.loanTypeId) {
      loanType = await ctx.db.get(application.loanTypeId);
    }
    
    const referees = await ctx.db
      .query("referees")
      .filter((q) => q.eq(q.field("applicationId"), application._id))
      .collect();
    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("applicationId"), application._id))
      .collect();

    return {
      application,
      contact,
      loanType,
      referees,
      documents,
    };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("loanApplications"),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("awaiting_referee"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      reviewNotes: args.reviewNotes,
    });

    if (args.status === "approved") {
      const application = await ctx.db.get(args.id);
      if (!application) throw new Error("Application not found");
      if (!application.loanTypeId) throw new Error("Loan Type not set");

      // Check if customer exists
      const existingCustomer = await ctx.db
        .query("customers")
        .withIndex("by_contact", (q) => q.eq("contactId", application.contactId))
        .first();

      let customerId = existingCustomer?._id;

      if (!customerId) {
        customerId = await ctx.db.insert("customers", {
          contactId: application.contactId,
          status: "active",
          createdAt: Date.now(),
          customerNumber: `CUST-${Date.now()}`,
        });
      }

      const loanType = await ctx.db.get(application.loanTypeId);
      if (!loanType) throw new Error("Loan Type not found");

      const requestedAmount = application.requestedAmount ?? 0;
      const interestAmount = (requestedAmount * loanType.interestRate) / 100;
      const totalPayable = requestedAmount + interestAmount;
      const installmentAmount = totalPayable / loanType.durationMonths;

      const loanId = await ctx.db.insert("loans", {
        applicationId: args.id,
        customerId,
        loanTypeSnapshot: {
          name: loanType.name,
          interestRate: loanType.interestRate,
          penaltyRate: loanType.penaltyRate,
          durationMonths: loanType.durationMonths,
          calculationMethod: loanType.calculationMethod,
        },
        principalAmount: requestedAmount,
        interestAmount,
        totalPayable,
        installmentAmount,
        outstandingBalance: totalPayable,
        startDate: Date.now(),
        expectedEndDate: Date.now() + (loanType.durationMonths * 30 * 24 * 60 * 60 * 1000),
        status: "new",
      });

      await ctx.db.insert("loanActivities", {
        loanId,
        type: "success",
        title: "Loan Approved",
        description: `Loan generated from Application ${application.applicationNumber}`,
        performedBy: "system",
        createdAt: Date.now(),
      });
    }
  },
});

export const updateDetails = mutation({
  args: {
    id: v.id("loanApplications"),
    amount: v.number(),
    loanTypeId: v.id("loanTypes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      requestedAmount: args.amount,
      loanTypeId: args.loanTypeId,
    });
  },
});

export const listLoanTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("loanTypes").filter(q => q.eq(q.field("active"), true)).collect();
  },
});

function code(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export const saveDraft = mutation({
  args: {
    applicationNumber: v.optional(v.string()),
    formData: v.string(),
    currentStep: v.number(),
    contact: v.optional(v.object({
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let applicationId: Id<"loanApplications"> | null = null;
    let appNumber = args.applicationNumber;

    if (appNumber) {
      const existingApp = await ctx.db
        .query("loanApplications")
        .filter((q) => q.eq(q.field("applicationNumber"), appNumber))
        .first();
      
      if (existingApp) {
        applicationId = existingApp._id;
        await ctx.db.patch(applicationId, {
          formData: args.formData,
          currentStep: args.currentStep,
          // Update timestamp?
        });
        return { applicationNumber: appNumber, applicationId };
      }
    }

    // Create new if not found
    if (!args.contact) {
      throw new Error("Contact information required to start a new application");
    }

    // Find or create contact
    let contactId: Id<"contacts">;
    const existingContacts = await ctx.db.query("contacts").collect();
    const existingContact = existingContacts.find(
      (c) =>
        (c.email && args.contact!.email && c.email.toLowerCase().trim() === args.contact!.email.toLowerCase().trim()) ||
        (c.phone && args.contact!.phone && c.phone.trim() === args.contact!.phone.trim())
    );

    if (existingContact) {
      contactId = existingContact._id;
    } else {
      contactId = await ctx.db.insert("contacts", {
        name: args.contact.name,
        email: args.contact.email ?? "",
        phone: args.contact.phone ?? "",
        dateOfBirth: "", // Placeholder
        marital: { status: "single" }, // Placeholder
        identity: { type: "NIDA" }, // Placeholder
        address: {},
        createdAt: now,
      });
    }

    if (!appNumber) {
       appNumber = `LN-${new Date().getFullYear()}-${code()}`;
       // Ensure uniqueness (simple check)
       const existingApp = await ctx.db
         .query("loanApplications")
         .filter((q) => q.eq(q.field("applicationNumber"), appNumber))
         .first();
       if (existingApp) {
         appNumber = `LN-${new Date().getFullYear()}-${code()}`;
       }
    }

    applicationId = await ctx.db.insert("loanApplications", {
      contactId,
      applicationNumber: appNumber!,
      status: "draft",
      formData: args.formData,
      currentStep: args.currentStep,
      source: "portal",
      createdAt: now,
    });

    return { applicationNumber: appNumber, applicationId };
  },
});
