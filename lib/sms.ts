import axios from 'axios';
import https from 'https';
import btoa from 'btoa';
import { env } from "@/env";

export async function sendSMS({ to, message }: { to: string; message: string }) {
  const api_key = env.SMS_API;
  const secret_key = env.SMS_SECRET;
  const content_type = 'application/json';
  const source_addr = env.SMS_SENDER || 'INFO';
  // Use the URL from env if available, otherwise default to Beem Africa
  // Note: env.SMS_URL might not be defined in lib/env.ts yet, so we use a hardcoded default or check if we should add it.
  // The user showed SMS_URL='https://apisms.beem.africa/v1' in .env.local
  // But lib/env.ts might not have it. I'll stick to the hardcoded one or add it to env.ts if needed.
  // For now, hardcode the send endpoint.
  const url = "https://apisms.beem.africa/v1/send";

  if (!api_key || !secret_key) {
    console.error("SMS credentials missing");
    return { success: false, error: "SMS credentials missing" };
  }

  try {
    const response = await axios.post(
      url,
      {
        source_addr: source_addr,
        schedule_time: "",
        encoding: 0,
        message: message,
        recipients: [
          {
            recipient_id: 1,
            dest_addr: to.replace('+', ''), 
          },
        ],
      },
      {
        headers: {
          "Content-Type": content_type,
          Authorization: "Basic " + btoa(api_key + ":" + secret_key),
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("SMS Send Error:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}
