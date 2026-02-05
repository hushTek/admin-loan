import { AuthConfig } from "convex/server";
import env from "@/env.config";

const issuer =
  env.CLERK_JWT_ISSUER_DOMAIN ?? env.NEXT_PUBLIC_CLERK_JWT_ISSUER_DOMAIN;

export default {
  providers: issuer
    ? [
        {
          domain: issuer,
          applicationID: "convex",
        },
      ]
    : [],
} satisfies AuthConfig;
