import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /* =========================
     USERS (Clerk-backed)
     ========================= */
  users: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("admin"),
      v.literal("loan_officer"),
      v.literal("cashier"),
      v.literal("viewer"),
      v.literal("contact")
    ))
  })
  .index("by_clerk", 
    [
      "clerkUserId",
      
    ]
  ),

  /* =========================
     CONTACTS (Form A + B)
     (Was CLIENTS)
     ========================= */
  contacts: defineTable({
    name: v.string(),
    dateOfBirth: v.string(),
    phone: v.string(),
    email: v.string(),
    marital: v.object({
      status: v.string(),
      name: v.optional(v.string())
    }),

    identity: v.object({
      type:v.string(), // e.g NIDA, DRIVING LICENCE, OTHER
      serial: v.optional(v.string()),
    }),

    work: v.optional(v.object({
      company: v.optional(v.string()),
      address: v.optional(v.string()),
      designation: v.optional(v.string()),
      status: v.union(
        v.literal("employment"), 
        v.literal("business"),
        v.literal("unemployed"),
        v.literal("other"),
      ),
    })),

    address: v.object({
      street: v.optional(v.string()),
      ward: v.optional(v.string()),
      district: v.optional(v.string()),
      region: v.optional(v.string()),
      residenceOwnership: v.optional(v.string()),
      ownership: v.optional(v.string()),
      houseNumber: v.optional(v.string()),
    }),

    createdAt: v.number(),
  }),

  /* =========================
     CUSTOMERS
     (Active borrowers)
     ========================= */
  customers: defineTable({
    contactId: v.id("contacts"),
    customerNumber: v.optional(v.string()),
    status: v.string(), // e.g. "active", "inactive"
    createdAt: v.number(),
  })
  .index("by_contact", ["contactId"]),

  /* =========================
     LOAN TYPES (PRODUCTS)
     ========================= */
  loanTypes: defineTable({
    name: v.string(), // e.g. "Business Loan"
    description: v.optional(v.string()),

    minAmount: v.number(),
    maxAmount: v.number(),

    interestRate: v.number(), // % per duration
    penaltyRate: v.number(), // % per month (e.g. 5)

    processingFeeType: v.optional(
      v.union(v.literal("percentage"), v.literal("fixed"))
    ),
    processingFeeValue: v.optional(v.number()),

    durationMonths: v.number(), // e.g. 6, 12
    repaymentFrequency: v.union(v.literal("monthly"), v.literal("weekly")),

    calculationMethod: v.union(
      v.literal("flat"), // common in MFIs
      v.literal("reducing_balance")
    ),

    active: v.boolean(),
    createdAt: v.number(),
  }),

  /* =========================
     LOAN APPLICATIONS
     (Form C–H)
     ========================= */
  loanApplications: defineTable({
    contactId: v.id("contacts"),
    loanTypeId: v.optional(v.id("loanTypes")),
    applicationNumber: v.string(),

    requestedAmount: v.optional(v.number()),
    loanPurpose: v.optional(v.string()),
    hasOtherLoans: v.optional(v.boolean()),


    collateralDescription: v.optional(v.string()),

    declarationAccepted: v.optional(v.boolean()),
    applicantSignatureUrl: v.optional(v.string()),

    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("awaiting_referee"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected")
    ),

    currentStep: v.optional(v.number()),
    formData: v.optional(v.string()), // JSON string of the full form state

    submittedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),

    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_contact", ["contactId"]),

  /* =========================
     DOCUMENTS (Form G)
     ========================= */
  documents: defineTable({
    applicationId: v.id("loanApplications"),

    type: v.union(
      v.literal("nida"),
      v.literal("local_letter"),
      v.literal("collateral"),
      v.literal("photo"),
      v.literal("signature")
    ),

    fileUrl: v.string(),
    fileName: v.string(),
    uploadedAt: v.number(),
  }),

  /* =========================
     REFEREES (Form F)
     ========================= */
  referees: defineTable({
    applicationId: v.id("loanApplications"),

    fullName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    relationship: v.string(),
    address: v.string(),
    nidaNumber: v.string(),

    acknowledged: v.boolean(),
    acknowledgedAt: v.optional(v.number()),
    
    rejected: v.optional(v.boolean()),
    rejectionReason: v.optional(v.string()),
  }),

  refereeTokens: defineTable({
    refereeId: v.id("referees"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  }).index("by_token", ["tokenHash"]),

  /* =========================
     LOANS (FINANCIAL CONTRACT)
     ========================= */
  loans: defineTable({
    applicationId: v.id("loanApplications"),
    customerId: v.id("customers"),
    loanTypeSnapshot: v.object({
      name: v.string(),
      interestRate: v.number(),
      penaltyRate: v.number(),
      durationMonths: v.number(),
      calculationMethod: v.string(),
    }),

    principalAmount: v.number(),

    interestAmount: v.number(),
    totalPayable: v.number(),
    installmentAmount: v.number(),

    outstandingBalance: v.number(),

    startDate: v.number(),
    expectedEndDate: v.number(),

    status: v.union(
      v.literal("new"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("defaulted")
    ),
  })
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"]),

  /* =========================
     LOAN ACTIVITIES
     ========================= */
  loanActivities: defineTable({
    loanId: v.id("loans"),
    type: v.union(
        v.literal("info"), 
        v.literal("warning"), 
        v.literal("success"),
        v.literal("error")
    ),
    title: v.string(),
    description: v.string(),
    performedBy: v.optional(v.string()), // User ID or System
    createdAt: v.number(),
  }).index("by_loan", ["loanId"]),

  /* =========================
     TRANSACTIONS (LEDGER)
     ========================= */
  transactions: defineTable({
    loanId: v.optional(v.id("loans")),
    accountId: v.optional(v.id("accounts")),
    categoryId: v.optional(v.id("categories")),

    amount: v.number(),
    type: v.union(
      v.literal("disbursement"),
      v.literal("repayment"),
      v.literal("penalty"),
      v.literal("expense"),
      v.literal("adjustment"),
      v.literal("income")
    ),

    method: v.union(
      v.literal("cash"),
      v.literal("mobile_money"),
      v.literal("bank")
    ),

    reference: v.optional(v.string()),
    note: v.optional(v.string()),
    balanceBefore: v.optional(v.number()),
    balanceAfter: v.optional(v.number()),
    createdAt: v.number(),
    confirmed: v.optional(v.boolean()),
  })
  .index("by_loan", ["loanId"]),

  /* =========================
     SMS LOGS
     ========================= */
  smsLogs: defineTable({
    phone: v.string(),
    message: v.string(),
    status: v.string(),
    sentAt: v.number(),
  }),

  /* =========================
     BANK (TREASURY)
     ========================= */
  bank: defineTable({
    balance: v.number(),
    updatedAt: v.number(),
  }),

  /* =========================
     ACCOUNTS (TREASURY LEDGER)
     ========================= */
  accounts: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("cash"),
      v.literal("bank"),
      v.literal("mobile_money"),
      v.literal("other")
    ),
    currency: v.optional(v.string()),
    balance: v.number(),
    accountNumber: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    active: v.boolean(),
  })
  .index("by_type", ["type"])
  .index("by_active", ["active"])
  .index("by_number", ["accountNumber"]),

  /* =========================
     TRANSACTION CATEGORIES
     ========================= */
  categories: defineTable({
    name: v.string(),
    code: v.optional(v.string()),
    effect: v.union(
      v.literal("increase"),
      v.literal("decrease")
    ),
    kind: v.union(
      v.literal("expense"),
      v.literal("repayment"),
      v.literal("adjustment"),
      v.literal("income"),
      v.literal("disbursement")
    ),
    active: v.boolean(),
    createdAt: v.number(),
  })
  .index("by_kind", ["kind"])
  .index("by_active", ["active"]),
});
