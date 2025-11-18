// client/src/hooks/useAuth.ts

import {
    useState,
    useEffect,
    useCallback
} from "react";
import {
    axiosClient,
    authApi,
    RegisterData,
    LoginData,
    AuthResponse,
    userApi,
} from "@/services";
import { useLogger } from "@/hooks";
import type { AxiosError } from "axios";   // ✅ For proper error typing


// -------------------- types --------------------
interface User {
    id: string;
    email: string;
    displayName?: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(
        JSON.parse(localStorage.getItem("user") || "null")
    );

    const [token, setToken] = useState<string | null>(
        localStorage.getItem("access_token")
    );

    const [loading, setLoading] = useState(false);
    const { log, warn, error: logError } = useLogger(false);

    /* -------------------- normalize user -------------------- */
    const normalizeUser = useCallback((raw: unknown): User => {
        const obj = raw as Record<string, unknown>;
        const u = (obj.user as Record<string, unknown>) ?? obj;

        return {
            id: (u._id as string) ?? (u.id as string),
            email: u.email as string,
            displayName: u.displayName as string | undefined,
        };
    }, []);

    /* -------------------- auth header -------------------- */
    const updateAuthHeader = useCallback((jwt: string | null) => {
        if (jwt) {
            axiosClient.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
        } else {
            delete axiosClient.defaults.headers.common["Authorization"];
        }
    }, []);

    /* -------------------- logout -------------------- */
    const logout = useCallback(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        updateAuthHeader(null);
        log("User logged out");
    }, [log, updateAuthHeader]);

    /* -------------------- load user -------------------- */
    const loadUser = useCallback(async () => {
        if (!token) return;

        try {
            updateAuthHeader(token);

            const profile = await authApi.me();
            const normalized = normalizeUser(profile);

            setUser(normalized);
            localStorage.setItem("user", JSON.stringify(normalized));
        } catch (err: unknown) {
            // ----------------------------
            // FIX: No "any", proper narrowing
            // ----------------------------

            const axiosErr = err as AxiosError<{ error?: string }>;

            const expired =
                axiosErr.response?.data?.error === "Token expired";

            if (expired) warn("Token expired — logging out");

            logout();
        }
    }, [token, updateAuthHeader, normalizeUser, logout, warn]);

    useEffect(() => {
        if (token) void loadUser();
    }, [token, loadUser]);

    /* -------------------- store auth -------------------- */
    const storeAuth = useCallback(
        (res: AuthResponse): User => {
            localStorage.setItem("access_token", res.token);
            setToken(res.token);
            updateAuthHeader(res.token);

            const normalized = normalizeUser(res.user);
            setUser(normalized);
            localStorage.setItem("user", JSON.stringify(normalized));

            return normalized;
        },
        [normalizeUser, updateAuthHeader]
    );

    /* -------------------- register -------------------- */
    const register = async (data: RegisterData) => {
        setLoading(true);
        try {
            const res = await authApi.register(data);
            if (res.token) storeAuth(res);
            return res;
        } catch (err: unknown) {
            logError("Registration failed", {});
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /* -------------------- login -------------------- */
    const login = async (data: LoginData) => {
        setLoading(true);
        try {
            const res = await authApi.login(data);
            if (res.token) storeAuth(res);
            return res;
        } catch (err: unknown) {
            logError("Login failed", {});
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /* -------------------- forgot password -------------------- */
    const forgotPassword = async (email: string): Promise<{ message: string }> =>
        authApi.forgotPassword(email);

    /* -------------------- reset password -------------------- */
    const resetPassword = async (data: {
        token: string;
        newPassword: string;
    }): Promise<{ message: string }> => authApi.resetPassword(data);

    /* -------------------- refresh user -------------------- */
    const refreshUser = async () => {
        if (!token) return;

        try {
            const { user } = await userApi.getProfile();
            setUser(user);
        } catch (err) {
            console.error("Failed to refresh user:", err);
        }
    };

    return {
        user,
        token,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!user,
        refreshUser,
    };
};

export default useAuth;
