const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");

export const getBasePath = () => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const normalized = `/${String(baseUrl).replace(/^\/+|\/+$/g, "")}`;
    return normalized === "/" ? "" : normalized;
};

export const getApiBaseUrl = () => {
    const configuredBase = import.meta.env.VITE_API_BASE;
    if (configuredBase) return trimTrailingSlash(configuredBase);
    return `${getBasePath()}/api/v1`;
};
