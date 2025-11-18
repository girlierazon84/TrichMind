// client/src/layouts/AppLayout.tsx

import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "@/components";
import { useAuth } from "@/hooks";


// ─────────────────────────────────────────────────────────────
// App Layout Component
// ─────────────────────────────────────────────────────────────
export const AppLayout = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    // ❌ Pages that should never show bottom nav
    const hiddenRoutes = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password"
    ];

    // Check if current path matches any hidden route prefix
    const hideNav = hiddenRoutes.some((route) =>
        location.pathname.startsWith(route)
    );

    return (
        <>
            <Outlet />
            {/* ✔ Only show for logged-in users, and not on login/register */}
            {isAuthenticated && !hideNav && <BottomNav />}
        </>
    );
};

export default AppLayout;