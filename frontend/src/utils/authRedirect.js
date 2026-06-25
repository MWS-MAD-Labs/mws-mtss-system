import { hasMtssAccess } from "@/utils/mtssAccess";
import { getBasePath } from "@/lib/apiBase";

const PENDING_AUTH_REDIRECT_KEY = "pending_auth_redirect";

export const sanitizeRedirectPath = (value) => {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
        return null;
    }

    if (trimmed.startsWith("/auth/callback")) {
        return null;
    }

    const basePath = getBasePath();
    if (basePath && (trimmed === basePath || trimmed.startsWith(`${basePath}/`))) {
        return trimmed.slice(basePath.length) || "/";
    }

    return trimmed;
};

export const storePendingRedirect = (value) => {
    if (typeof window === "undefined") return;

    const sanitized = sanitizeRedirectPath(value);
    if (!sanitized || sanitized === "/") return;

    window.sessionStorage.setItem(PENDING_AUTH_REDIRECT_KEY, sanitized);
};

export const peekPendingRedirect = () => {
    if (typeof window === "undefined") return null;
    return sanitizeRedirectPath(window.sessionStorage.getItem(PENDING_AUTH_REDIRECT_KEY));
};

export const consumePendingRedirect = () => {
    if (typeof window === "undefined") return null;

    const redirect = peekPendingRedirect();
    window.sessionStorage.removeItem(PENDING_AUTH_REDIRECT_KEY);
    return redirect;
};

export const getDefaultPostLoginPath = (userOrRole) => {
    const user = userOrRole && typeof userOrRole === "object" ? userOrRole : null;
    const normalizedRole = String(user?.role || userOrRole || "").trim().toLowerCase();

    if (normalizedRole === "student") {
        return "/student/support-hub";
    }

    if (hasMtssAccess(user || { role: normalizedRole })) {
        return "/support-hub";
    }

    // Unknown/non-support roles go directly to check-in method selection.
    return "/select-role";
};
