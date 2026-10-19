import { PERSON_TYPE } from "@/constants/enums";

const PENDING_AUTH_REDIRECT_KEY = "pending_auth_redirect";

export const sanitizeRedirectPath = (value) => {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
        return null;
    }

    // No basePath-stripping here anymore - there's no React Router basename
    // (main.jsx), so paths captured from location.pathname or passed in
    // already correctly include the literal /mtss prefix and should stay
    // as-is.
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

export const getDefaultPostLoginPath = (user) => {
    if (user?.personType === PERSON_TYPE.STUDENT) {
        return "/mtss/student/support-hub";
    }

    // Staff land on /mtss/home first, which shows the dashboard card the person may open.
    return "/mtss/home";
};
