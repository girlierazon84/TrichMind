// client/src/api/axiosClient.ts
import axios from "axios";

// Base URL (from environment variable or fallback)
const BASE_URL =
    import.meta.env?.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:8080";

export const axiosClient = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // enables sending cookies (if needed)
});

// Interceptors for logging and cleaner error messages
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.error || error.message;
        console.error(`❌ API Error [${status}]: ${msg}`);
        return Promise.reject(error);
    }
);

export default axiosClient;
