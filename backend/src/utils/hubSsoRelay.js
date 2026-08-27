const jwt = require("jsonwebtoken");
const cacheService = require("../services/cacheService");

const ISSUER = "mws-hub";
const AUDIENCE = "mtss";

function verifyHubRelayToken(token) {
  const publicKey = process.env.HUB_SSO_PUBLIC_KEY?.replace(/\\n/g, "\n");
  if (!publicKey) {
    throw new Error("HUB_SSO_PUBLIC_KEY is not configured");
  }

  const payload = jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (!payload.jti || !payload.sub) {
    throw new Error("Relay token missing required claims");
  }

  if (cacheService.hasSeenSsoJti(payload.jti)) {
    throw new Error("Relay token already used");
  }
  cacheService.markSsoJtiSeen(payload.jti);

  // tags/source are Hub's own access-tag verdict for this person (see
  // AppsService.accessTagsFor in mws-hub) - default defensively so an older
  // Hub deployment that hasn't rolled the new claims out yet degrades to
  // "no tags" instead of throwing here.
  return {
    ...payload,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
  };
}

module.exports = { verifyHubRelayToken };
