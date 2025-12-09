// client/src/config/env.ts

// Backend ROOT (WITHOUT trailing /api)
// axiosClient will append `/api` for you
export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
