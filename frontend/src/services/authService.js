import axios from "axios";
import { startGlobalLoading, stopGlobalLoading } from "@/lib/loadingManager";
import { getApiBaseUrl } from "@/lib/apiBase";
import { clearStoredAuthSession } from "@/utils/authStorage";

// Base-aware: standalone uses /api/v1, gateway build under /mtss uses /mtss/api/v1.
const API_BASE_URL = getApiBaseUrl();

let authResetInFlight = false;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  // The session is the Hub's cookie on the parent domain. withCredentials is what makes the browser send it.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: loading indicator only, the cookie carries the session.
api.interceptors.request.use(
  (config) => {
    if (!config?.skipGlobalLoading) {
      startGlobalLoading();
    }
    return config;
  },
  (error) => {
    if (!error?.config?.skipGlobalLoading) {
      stopGlobalLoading();
    }
    return Promise.reject(error);
  },
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    if (!response?.config?.skipGlobalLoading) {
      stopGlobalLoading();
    }
    return response;
  },
  (error) => {
    if (!error?.config?.skipGlobalLoading) {
      stopGlobalLoading();
    }
    if (error.response?.status === 401 && !authResetInFlight) {
      authResetInFlight = true;
      clearStoredAuthSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("mtss:auth-cleared"));
      }
      // The Hub's session is gone or ended: ask the Hub for it back, or go to its front page.
      // Loaded here and not at the top, because hubSession.js reads the Hub address through this file.
      import("@/utils/hubSession").then(({ sendToHub }) => sendToHub());
    }
    return Promise.reject(error);
  },
);

// Auth API functions
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response;
};

export default api;
