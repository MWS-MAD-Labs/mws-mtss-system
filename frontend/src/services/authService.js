import axios from "axios";
import { startGlobalLoading, stopGlobalLoading } from "@/lib/loadingManager";
import { getApiBaseUrl, getBasePath } from "@/lib/apiBase";
import { clearStoredAuthSession } from "@/utils/authStorage";

// Base-aware: standalone uses /api/v1, gateway build under /mtss uses /mtss/api/v1.
const API_BASE_URL = getApiBaseUrl();

// Set right before logout()'s own window.location.assign(hubLogoutUrl)
// below, so the 401 interceptor further down can tell a Hub redirect is
// already in flight. Without this, any OTHER in-flight request (a
// notification poller, a background refetch, anything else on the page
// making an API call around the same moment) sees its cookie already
// cleared server-side, 401s, and the interceptor's own
// window.location.assign(homePath) below can win the race against the
// logout's cross-origin navigate - landing the user back on this app's own
// landing page instead of Hub, depending on which network response comes
// back first.
let hubRedirectInFlight = false;

// Exported so useSilentHubRelogin can check it too - that hook's own hidden
// iframe attempt fires the instant Redux flips isAuthenticated to false,
// which can be BEFORE this app's own cross-origin window.location.assign
// to Hub has actually landed (Hub's session cookie is still valid on
// Hub's side until the navigate completes). Left unguarded, the iframe's
// silent relogin can succeed mid-navigate and undo the logout entirely -
// useCrossTabAuthSync picks up its localStorage write and routes this tab
// straight back to a logged-in page before the browser ever reaches Hub.
export const isHubRedirectInFlight = () => hubRedirectInFlight;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  // The session lives in an httpOnly cookie now (see backend
  // utils/authCookie.js) instead of a token this app attaches itself -
  // withCredentials is what makes the browser actually send it.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - loading indicator only now. Auth is carried by the
// httpOnly cookie automatically; there's no token for this app's own JS to
// attach anymore.
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
    if (error.response?.status === 401) {
      const requestPath = String(error?.config?.url || "");
      const isLoginRequest = /\/auth\/login$/i.test(requestPath);
      if (!isLoginRequest) {
        const msg = String(error.response?.data?.message || "").toLowerCase();
        const authFailureHints = [
          "token expired",
          "invalid token",
          "jwt expired",
          "access token required",
          "authentication required",
          "user not found or inactive",
        ];
        const shouldResetAuth =
          !msg || authFailureHints.some((hint) => msg.includes(hint));
        if (shouldResetAuth) {
          clearStoredAuthSession();
          // Gateway build serves this app under /mtss/, not site
          // root - '/' is a different (and here, non-existent)
          // route as far as this app's own router/dev server know.
          // Skipped entirely while a Hub redirect is already underway
          // (see hubRedirectInFlight above) - this would otherwise race
          // it and can win, landing the user back here instead of at Hub.
          const homePath = `${getBasePath()}/`;
          if (
            !hubRedirectInFlight &&
            typeof window !== "undefined" &&
            window.location.pathname !== homePath
          ) {
            window.location.assign(homePath);
          }
        }
      }
    }
    return Promise.reject(error);
  },
);

// Auth API functions
export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response;
};

export const logout = async () => {
  // Set before the request even fires: the backend clears this app's
  // cookie as part of handling it, so another in-flight request can 401
  // and race the interceptor above against this function's own
  // window.location.assign below starting from that moment, not just
  // after this response comes back.
  hubRedirectInFlight = true;

  let response;
  try {
    response = await api.post("/auth/logout");
  } catch (error) {
    // The request itself failed - nothing is navigating away, so don't
    // leave the interceptor permanently suppressed for the rest of the
    // session.
    hubRedirectInFlight = false;
    throw error;
  }

  clearStoredAuthSession();

  // The backend tells us where to go so the Hub session ends too. It has to
  // be a real navigation: Hub's cookie lives on Hub's domain, so nothing
  // this app calls from the background can clear it. Every caller of
  // logout() gets this for free by living in one place.
  const hubLogoutUrl = response?.data?.data?.hubLogoutUrl;
  if (hubLogoutUrl) {
    window.location.assign(hubLogoutUrl);
    // Signal callers to NOT also navigate locally - that would race
    // against this cross-origin navigation and can flash/override it.
    return { redirectedToHub: true };
  }

  // No hubLogoutUrl - nothing is actually navigating away, so let the
  // interceptor resume its normal behavior for any future 401.
  hubRedirectInFlight = false;
  return { redirectedToHub: false };
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response;
};

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response;
};

export default api;
