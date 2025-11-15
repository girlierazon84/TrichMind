// client/src/services/axiosClient.ts

import axios from "axios";


// Base URL
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Axios Client
export const axiosClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 10000,
});

/* Attach token */
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* Handle expired token */
axiosClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.error === "Token expired" &&
      !original._retry
    ) {
      original._retry = true;

      try {
        const refresh = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refresh.data.token;

        localStorage.setItem("access_token", newToken);
        axiosClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newToken}`;
        original.headers.Authorization = `Bearer ${newToken}`;

        return axiosClient(original);
      } catch {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
