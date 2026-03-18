import axios from 'axios';
import https from 'https';
import btoa from 'btoa';
import { env } from "@/env";
import { normalizeTzPhoneToE164 } from "@/lib/phone";

function beemDestAddrFromE164(phoneE164: string) {
  return phoneE164.startsWith("+") ? phoneE164.slice(1) : phoneE164;
}

export async function sendSMS({
  to,
  message,
  recipientId = 1,
  scheduleTime = "",
  encoding = 0,
}: {
  to: string;
  message: string;
  recipientId?: number;
  scheduleTime?: string;
  encoding?: number;
}) {
  
  const api_key = env.SMS_API;
  const secret_key = env.SMS_SECRET;
  const content_type = "application/json";
  const source_addr = env.SMS_SENDER || "INFO";
  const baseUrl = env.SMS_URL.replace(/\/+$/, "");
  const url = `${baseUrl}/send`;

  if (!api_key || !secret_key) {
    console.error("SMS credentials missing");
    return { success: false, error: "SMS credentials missing" };
  }

  const normalized = normalizeTzPhoneToE164(to);
  if (!normalized) return { success: false, error: "Invalid phone number format" };
  if (!message.trim()) return { success: false, error: "Missing message" };

  try {
    const response = await axios.post(
      url,
      {
        source_addr: source_addr,
        schedule_time: scheduleTime,
        encoding,
        message: message,
        recipients: [
          {
            recipient_id: recipientId,
            dest_addr: beemDestAddrFromE164(normalized),
          },
        ],
      },
      {
        headers: {
          "Content-Type": content_type,
          Authorization: "Basic " + btoa(api_key + ":" + secret_key),
        },
        // Keep default TLS verification (safer than disabling it).
        httpsAgent: new https.Agent({}),
      }
    );
    return { success: true, data: response.data };
  } catch (error: unknown) {
    const e = error as { response?: { data?: unknown }; message?: string };
    console.error("SMS Send Error:", e.response?.data || e.message);
    return { success: false, error: e.response?.data || e.message || "Failed to send SMS" };
  }
}
