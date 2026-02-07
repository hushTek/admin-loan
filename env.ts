import { defineEnv } from "envin";
import * as z from "zod";

export const env = defineEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  },
  server: {
    CONVEX_DEPLOYMENT: z.string().optional(),
    CLERK_ENCRYPTION_KEY: z.string(),
    // CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional(),
    CLERK_SECRET_KEY: z.string(),
    CLERK_JWT_ISSUER_DOMAIN: z.string().url(),
    UPLOADTHING_TOKEN: z.string(),
    RESEND_API_KEY: z.string(),
    SMS_API: z.string(),
    SMS_SECRET: z.string(),
    SMS_SENDER: z.string().optional(),
    SMS_URL: z.string().url(),  
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_API_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_FAPI_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_CLERK_TELEMETRY_DEBUG: z.string().optional(),
    NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED: z.string().optional(),
    NEXT_PUBLIC_CLERK_JWT_ISSUER_DOMAIN: z.string().url(),
  },
  clientPrefix: "NEXT_PUBLIC_",
});
