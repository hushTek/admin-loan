import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateKeyUtcDay(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  return `${yyyy}-${mm}-${dd}`;
}

function startOfUtcDay(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
}

function formatDateDDMMYYYY(ts: number): string {
  const d = new Date(ts);
  const dd = pad2(d.getUTCDate());
  const mm = pad2(d.getUTCMonth() + 1);
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatCurrencyTZS(amount: number): string {
  try {
    return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(amount);
  } catch {
    return `TZS ${amount}`;
  }
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? `{${key}}`);
}

export const runDaily = internalMutation({
  args: {},
  handler: async (ctx) => {
    const settingsRows = await ctx.db.query("notificationSettings").order("desc").collect();
    const settings = settingsRows[0] ?? null;
    if (!settings?.enabled) return { ok: true, sent: 0 };

    const templates = (settings.reminderTemplates ?? []).filter((t) => t.enabled);
    if (templates.length === 0) return { ok: true, sent: 0 };

    const now = Date.now();
    const todayStart = startOfUtcDay(now);
    const todayKey = dateKeyUtcDay(now);
    let sent = 0;

    for (const t of templates) {
      const days = Math.floor(t.days);
      const delta = t.direction === "before" ? days : -days;
      const targetStart = todayStart + delta * 24 * 60 * 60 * 1000;
      const targetEnd = targetStart + 24 * 60 * 60 * 1000 - 1;

      const loans = await ctx.db
        .query("loans")
        .withIndex("by_expectedEndDate", (q) =>
          q.gte("expectedEndDate", targetStart).lte("expectedEndDate", targetEnd)
        )
        .collect();

      for (const loan of loans) {
        // Skip loans that are already settled
        if (loan.status === "completed" || loan.outstandingBalance <= 0) continue;

        const existing = await ctx.db
          .query("loanReminderSends")
          .withIndex("by_loan_template_date", (q) =>
            q.eq("loanId", loan._id).eq("templateId", t.id).eq("dateKey", todayKey)
          )
          .first();
        if (existing) continue;

        const customer = await ctx.db.get(loan.customerId);
        if (!customer) continue;
        const contact = await ctx.db.get(customer.contactId);
        if (!contact?.phone) continue;

        const message = renderTemplate(t.message, {
          name: contact.name ?? "Customer",
          dueDate: formatDateDDMMYYYY(loan.expectedEndDate),
          amount: formatCurrencyTZS(loan.outstandingBalance),
          principal: formatCurrencyTZS(loan.principalAmount),
          total: formatCurrencyTZS(loan.totalPayable),
          loanId: loan._id,
        });

        await ctx.scheduler.runAfter(0, internal.notifications.sendSmsInternal, {
          to: contact.phone,
          message,
        });

        await ctx.db.insert("loanReminderSends", {
          loanId: loan._id,
          templateId: t.id,
          dateKey: todayKey,
          to: contact.phone,
          message,
          sentAt: now,
        });

        await ctx.db.insert("loanActivities", {
          loanId: loan._id,
          type: "info",
          title: "Reminder scheduled",
          description: `Auto reminder sent (${t.name}) to ${contact.phone}.`,
          performedBy: "system",
          createdAt: now,
        });

        sent += 1;
      }
    }

    return { ok: true, sent };
  },
});

