export const PILOT_FEEDBACK_ADMIN_EMAILS = new Set([
    "faisal@millennia21.id",
]);

export const canAccessPilotFeedbackAdmin = (user = {}) => {
    const email = String(user?.email || "").trim().toLowerCase();
    return PILOT_FEEDBACK_ADMIN_EMAILS.has(email);
};
