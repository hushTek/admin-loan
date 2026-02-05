'use client'

import { useConvexAuth } from "convex/react";

const CheckAuth = () => {
    const { isAuthenticated } = useConvexAuth();

    return <div>
        {
            isAuthenticated ? "Authenticated" : "Not authenticated"
        }
    </div>;
}

export default CheckAuth;
