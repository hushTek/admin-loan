"use node";

import axios from "axios";
import https from "https";
import btoa from "btoa";
import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";

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

function beemDestAddrFromE164(phoneE164: string): string {
  // Beem examples use "2557XXXXXXXX" (no leading '+').
  return phoneE164.startsWith("+") ? phoneE164.slice(1) : phoneE164;
}

export const sendSms = action({
  args: {
    to: v.string(),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.SMS_API;
    const secretKey = process.env.SMS_SECRET;
    const sender = process.env.SMS_SENDER ?? "INFO";
    const baseUrl = (process.env.SMS_URL ?? "https://apisms.beem.africa/v1").replace(/\/+$/, "");

    if (!apiKey || !secretKey) {
      throw new Error("SMS credentials missing");
    }

    const to = normalizeTzPhoneToE164(args.to);
    if (!to) throw new Error("Invalid phone number format");
    if (!args.message.trim()) throw new Error("Missing message");

    try {
      const response = await axios.post(
        `${baseUrl}/send`,
        {
          source_addr: sender,
          schedule_time: "",
          encoding: 0,
          message: args.message,
          recipients: [{ recipient_id: 1, dest_addr: beemDestAddrFromE164(to) }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(`${apiKey}:${secretKey}`)}`,
          },
          httpsAgent: new https.Agent({}),
        }
      );
      return response.data;
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: unknown }; message?: string };
      throw new Error(
        `Beem SMS failed (${e.response?.status ?? "unknown"}): ${JSON.stringify(
          e.response?.data ?? e.message ?? "unknown error"
        )}`
      );
    }
  },
});

export const sendSmsInternal = internalAction({
  args: {
    to: v.string(),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    // Delegate to the same implementation.
    const apiKey = process.env.SMS_API;
    const secretKey = process.env.SMS_SECRET;
    const sender = process.env.SMS_SENDER ?? "INFO";
    const baseUrl = (process.env.SMS_URL ?? "https://apisms.beem.africa/v1").replace(/\/+$/, "");

    if (!apiKey || !secretKey) {
      throw new Error("SMS credentials missing");
    }

    const to = normalizeTzPhoneToE164(args.to);
    if (!to) throw new Error("Invalid phone number format");
    if (!args.message.trim()) throw new Error("Missing message");

    try {
      const response = await axios.post(
        `${baseUrl}/send`,
        {
          source_addr: sender,
          schedule_time: "",
          encoding: 0,
          message: args.message,
          recipients: [{ recipient_id: 1, dest_addr: beemDestAddrFromE164(to) }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(`${apiKey}:${secretKey}`)}`,
          },
          httpsAgent: new https.Agent({}),
        }
      );
      return response.data;
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: unknown }; message?: string };
      throw new Error(
        `Beem SMS failed (${e.response?.status ?? "unknown"}): ${JSON.stringify(
          e.response?.data ?? e.message ?? "unknown error"
        )}`
      );
    }
  },
});

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY missing");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "tms@hushtek.co.tz",
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to send email: ${text}`);
    }
    return await res.json();
  },
});

export const sendEmailInternal = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY missing");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "tms@hushtek.co.tz",
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to send email: ${text}`);
    }
    return await res.json();
  },
});

