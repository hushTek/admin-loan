'use client'

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

export default function AppProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    const convex = useMemo(() => {
        if (!convexUrl) return null;
        return new ConvexReactClient(convexUrl);
    }, [convexUrl]);

    if (!convex || !clerkPublishableKey) {
        return (
            <div className="p-4 text-sm text-red-600">
                Missing required client environment variables:
                {!convexUrl ? " NEXT_PUBLIC_CONVEX_URL" : ""}
                {!clerkPublishableKey ? " NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" : ""}
            </div>
        );
    }

    return (
        <ClerkProvider publishableKey={clerkPublishableKey}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
