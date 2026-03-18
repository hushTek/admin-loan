import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/rbac";

function normalizeTzPhoneToE164(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const cleaned = raw.startsWith("+")
    ? "+" + raw.slice(1).replace(/\D/g, "")
    : raw.replace(/\D/g, "");
  if (cleaned.startsWith("+255")) {
    const rest = cleaned.slice(4);
    if (rest.length !== 9) return null;
    return `+255${rest}`;
  }
  if (cleaned.startsWith("255")) {
    const rest = cleaned.slice(3);
    if (rest.length !== 9) return null;
    return `+255${rest}`;
  }
  if (cleaned.startsWith("0")) {
    const rest = cleaned.slice(1);
    if (rest.length !== 9) return null;
    return `+255${rest}`;
  }
  return null;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "loan_officer"]);
    const rows = await ctx.db.query("notificationSettings").order("desc").collect();
    return rows[0] ?? null;
  },
});

export const upsert = mutation({
  args: {
    enabled: v.boolean(),
    emails: v.array(v.string()),
    phones: v.array(v.string()),
    reminderTemplates: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          enabled: v.boolean(),
          direction: v.union(v.literal("before"), v.literal("after")),
          days: v.number(),
          message: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const now = Date.now();
    const normalizedPhones = args.phones
      .map((p) => normalizeTzPhoneToE164(p))
      .filter((p): p is string => Boolean(p));

    const reminderTemplates = (args.reminderTemplates ?? []).map((t) => ({
      id: t.id.trim(),
      name: t.name.trim(),
      enabled: t.enabled,
      direction: t.direction,
      days: Math.floor(t.days),
      message: t.message,
    }));
    for (const t of reminderTemplates) {
      if (!t.id) throw new Error("Template id is required");
      if (!t.name) throw new Error("Template name is required");
      if (!Number.isFinite(t.days) || t.days < 0) {
        throw new Error("Template days must be 0 or greater");
      }
      if (!t.message.trim()) throw new Error("Template message is required");
    }

    const rows = await ctx.db.query("notificationSettings").order("desc").collect();
    const existing = rows[0] ?? null;
    if (!existing) {
      return await ctx.db.insert("notificationSettings", {
        enabled: args.enabled,
        emails: args.emails,
        phones: normalizedPhones,
        reminderTemplates,
        createdAt: now,
        updatedAt: now,
      });
    }
    await ctx.db.patch(existing._id, {
      enabled: args.enabled,
      emails: args.emails,
      phones: normalizedPhones,
      reminderTemplates,
      updatedAt: now,
    });
    return existing._id;
  },
});

