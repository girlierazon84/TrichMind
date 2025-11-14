// client/src/services/axiosClient.ts

import axios from "axios";


const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const axiosClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15000,
});

// -------------------------------------------------
// Request Interceptor — FIX token key
// -------------------------------------------------
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token"); // FIXED
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------------------------------------
// Error handler
// -------------------------------------------------
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
