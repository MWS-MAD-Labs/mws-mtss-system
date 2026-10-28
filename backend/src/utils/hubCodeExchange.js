// Trades the one-time ?code= from Hub's launch redirect for the relay token, server to server.
const TIMEOUT_MS = 5000;

async function exchangeHubCode(code, state) {
  const baseUrl = (process.env.HUB_BASE_URL || "").replace(/\/$/, "");
  const secret = process.env.HUB_INTERNAL_SECRET;
  const appId = process.env.HUB_SSO_APP_ID || "mtss";
  if (!baseUrl || !secret) {
    throw new Error("HUB_BASE_URL and HUB_INTERNAL_SECRET are required for the Hub code exchange");
  }

  const response = await fetch(`${baseUrl}/sso/exchange`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hub-internal-secret": secret,
    },
    body: JSON.stringify({ code, appId, ...(state ? { state } : {}) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Hub code exchange answered ${response.status}`);
  }
  const body = await response.json().catch(() => null);
  const token = body?.data?.token;
  if (typeof token !== "string" || !token) {
    throw new Error("Hub code exchange returned no token");
  }
  return token;
}

module.exports = { exchangeHubCode };
