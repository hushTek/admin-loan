import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

export type StaffRole = "admin" | "loan_officer" | "cashier" | "viewer" | "contact";

function isMutationCtx(ctx: Ctx): ctx is MutationCtx {
  // Queries have a read-only db; mutations have insert/patch/etc.
  return typeof (ctx.db as unknown as { insert?: unknown }).insert === "function";
}

export async function getCurrentUser(ctx: Ctx): Promise<{
  clerkUserId: string;
  name?: string;
  role?: StaffRole;
  userDocId?: Id<"users">;
}> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    throw new Error("Unauthenticated");
  }

  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
    .first();

  // Auto-provision the authenticated user in Convex if missing.
  // Safe bootstrap: if there are no admins yet, first provisioned user becomes admin.
  if (!user && isMutationCtx(ctx)) {
    const existingAdmins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();
    const bootstrapRole: StaffRole = existingAdmins.length === 0 ? "admin" : "viewer";

    const idAny = identity as unknown as {
      name?: string;
      email?: string;
      phone?: string;
    };

    const userId = await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      name: idAny.name ?? "User",
      email: idAny.email ?? "",
      phone: idAny.phone,
      role: bootstrapRole,
    });
    user = await ctx.db.get(userId);
  }

  return {
    clerkUserId: identity.subject,
    name: user?.name,
    role: user?.role as StaffRole | undefined,
    userDocId: user?._id,
  };
}

export async function requireRole(ctx: Ctx, allowed: StaffRole[]) {
  const current = await getCurrentUser(ctx);
  if (!current.role || !allowed.includes(current.role)) {
    throw new Error("Forbidden");
  }
  return current;
}

