// client/src/services/api.ts

import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const axiosClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // enables sending cookies (if needed)
  timeout: 10000,
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