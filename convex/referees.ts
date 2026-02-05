import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("refereeTokens")
      .withIndex("by_token", (q) => q.eq("tokenHash", args.token))
      .first();

    if (!tokenRecord) {
      return { status: "invalid" as const };
    }

    if (tokenRecord.expiresAt < Date.now()) {
      return { status: "expired" as const };
    }

    if (tokenRecord.used) {
        // Check if the referee has already acted
        const referee = await ctx.db.get(tokenRecord.refereeId);
        if (referee) {
             // If we found the referee, return the data so we can show "Already Confirmed/Rejected" state
             const application = await ctx.db.get(referee.applicationId);
             if (application) {
                 const contact = await ctx.db.get(application.contactId);
                 return {
                     status: "valid" as const,
                     referee,
                     clientName: contact?.name,
                     applicationId: application._id,
                     loanAmount: application.requestedAmount
                 }
             }
        }
    }

    const referee = await ctx.db.get(tokenRecord.refereeId);
    if (!referee) {
      return { status: "invalid" as const };
    }

    const application = await ctx.db.get(referee.applicationId);
    if (!application) {
        return { status: "invalid" as const };
    }

    const contact = await ctx.db.get(application.contactId);

    return { 
        status: "valid" as const,
        referee,
        clientName: contact?.name,
        applicationId: application._id,
        loanAmount: application.requestedAmount
    };
  },
});

export const confirm = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("refereeTokens")
      .withIndex("by_token", (q) => q.eq("tokenHash", args.token))
      .first();

    if (!tokenRecord) {
      throw new Error("Invalid token");
    }

    // Mark referee as acknowledged
    await ctx.db.patch(tokenRecord.refereeId, {
      acknowledged: true,
      acknowledgedAt: Date.now(),
      rejected: false,
    });

    // Mark token as used
    await ctx.db.patch(tokenRecord._id, {
      used: true,
    });

    // Check if all referees have confirmed
    const referee = await ctx.db.get(tokenRecord.refereeId);
    if (referee) {
      const allReferees = await ctx.db
        .query("referees")
        .filter((q) => q.eq(q.field("applicationId"), referee.applicationId))
        .collect();
      
      const allConfirmed = allReferees.every((r) => r.acknowledged);
      if (allConfirmed) {
        await ctx.db.patch(referee.applicationId, {
          status: "under_review",
        });
      }
    }

    return { success: true };
  },
});

export const reject = mutation({
  args: { 
    token: v.string(),
    reason: v.string() 
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("refereeTokens")
      .withIndex("by_token", (q) => q.eq("tokenHash", args.token))
      .first();

    if (!tokenRecord) {
      throw new Error("Invalid token");
    }

    const referee = await ctx.db.get(tokenRecord.refereeId);
    if (!referee) {
      throw new Error("Referee not found");
    }

    // Mark referee as rejected
    await ctx.db.patch(tokenRecord.refereeId, {
      acknowledged: false,
      rejected: true,
      rejectionReason: args.reason,
    });

    // Mark token as used
    await ctx.db.patch(tokenRecord._id, {
      used: true,
    });

    // Return application to draft so user can correct it
    await ctx.db.patch(referee.applicationId, {
      status: "draft",
    });

    return { success: true };
  },
});
