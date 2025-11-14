// client/src/services/axiosClient.ts

import axios from "axios";


const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const axiosClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 10000,
});

// ──────────────────────────────
// 🔐 Request Interceptor
// ──────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token"); // ✅ unified key
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ──────────────────────────────
// ⚠️ Response Interceptor
// ──────────────────────────────
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
