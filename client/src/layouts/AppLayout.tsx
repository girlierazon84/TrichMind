// client/src/layouts/AppLayout.tsx

import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components";
import { useAuth } from "@/hooks";


// Main application layout component
export const AppLayout = () => {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <Outlet />
            {isAuthenticated && <BottomNav />}
        </>
    );
};

export default AppLayout;