// UI-only copy: this only gates which dashboard section renders. The
// backend (utils/pilotFeedbackAccess.js in this app's backend, the single
// source of truth) re-checks on every read/write regardless, so drifting
// out of sync here is a cosmetic bug, not a security one - but keep it in
// sync manually if this list ever changes, there's no shared module across
// the frontend/backend boundary for it.
export const PILOT_FEEDBACK_ADMIN_EMAILS = new Set([
    "faisal@millennia21.id",
]);

export const canAccessPilotFeedbackAdmin = (user = {}) => {
    const email = String(user?.email || "").trim().toLowerCase();
    return PILOT_FEEDBACK_ADMIN_EMAILS.has(email);
};
