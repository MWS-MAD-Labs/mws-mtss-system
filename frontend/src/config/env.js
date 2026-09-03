const runtimeEnv =
  typeof window !== "undefined" && window.__MWS_MTSS_ENV__
    ? window.__MWS_MTSS_ENV__
    : {};

const readEnv = (key, fallback = "") =>
  runtimeEnv[key] || import.meta.env[key] || fallback;

export const env = {
  hubBaseUrl: readEnv("VITE_HUB_BASE_URL", "http://localhost:5175"),
};
