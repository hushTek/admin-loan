'use client'

import env from "@/env.config";

import { ClerkProvider } from "@clerk/nextjs";

import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

import { ConvexProviderWithClerk } from "convex/react-clerk";

import { useAuth } from "@clerk/nextjs";

export default function AppProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}   
