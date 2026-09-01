// Central has no concept of "who administers MTSS pilot feedback" - this is
// an MTSS-only, temporary-feature designation, so an email allowlist is the
// only way to express it. Used to live as two independent copies
// (controllers/mtssPilotFeedbackController.js and
// services/mtssRealtimeService.js) that could silently drift from each
// other; this is the one place both now read from.
//
// frontend/src/pages/mtss/utils/pilotFeedbackAccess.js keeps its own copy -
// it's UI-only (which section renders), the backend re-checks on every
// write regardless, so a mismatch there is a cosmetic bug, not a security
// one. Keep it in sync manually if this list ever changes.
const PILOT_FEEDBACK_ADMIN_EMAILS = new Set(['faisal@millennia21.id']);

const isPilotFeedbackAdmin = (email) =>
    PILOT_FEEDBACK_ADMIN_EMAILS.has(String(email || '').trim().toLowerCase());

module.exports = { PILOT_FEEDBACK_ADMIN_EMAILS, isPilotFeedbackAdmin };
