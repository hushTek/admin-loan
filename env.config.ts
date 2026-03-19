import { defineEnv } from "envin";
import * as z from "zod";

const env = defineEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_API_URL: z.string().url().optional(),
    NEXT_PUBLIC_CLERK_FAPI_URL: z.string().url().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_CLERK_TELEMETRY_DEBUG: z.string().optional(),
    NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED: z.string().optional(),
    NEXT_PUBLIC_CLERK_JWT_ISSUER_DOMAIN: z.string().url().optional(),
  },
  clientPrefix: "NEXT_PUBLIC_",
});


export default env