// client/src/config/env.ts

/**-----------------------------------------------------------------------
    Next.js client-safe env values must be prefixed with NEXT_PUBLIC_.
    This should be your backend ROOT (WITHOUT trailing /api).
    Example: http://localhost:8080
--------------------------------------------------------------------------*/
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:8080";

/**-----------------------------------------------------------------------
    Helper to build API endpoints consistently
    e.g. apiUrl("/auth/login") => http://localhost:8080/api/auth/login
--------------------------------------------------------------------------*/
export const apiUrl = (path: string) => {
    const cleanBase = API_BASE_URL.replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${cleanBase}/api${cleanPath}`;
};
