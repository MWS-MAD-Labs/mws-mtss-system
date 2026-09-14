import { env } from "@/config/env";

const HUB_SUPPORT_PATH = "/support-hub";
// Shared literally with daily-checkin's own hubConfig.js and with
// QuickLogoutButton.jsx in this app - naming the target the same everywhere
// means a Hub tab any of them opens gets reused/focused by the others too,
// not just by repeated clicks from one entry point.
const HUB_SUPPORT_WINDOW_NAME = "mws-hub-support";

// Same role list RouteConfig.jsx gates /mtss/pilot-testing with - reused
// here for the "Support Hub" shortcut (RoleSelectionPage.jsx's old
// standalone button, now folded into QuickLogoutButton.jsx's menu). Students
// don't get one, they never go through Hub's app-launcher UI.
export const SUPPORT_HUB_ROLES = [
  "teacher", "se_teacher", "head_unit", "directorate", "admin", "superadmin",
];

export function hasSupportHubAccess(role) {
  return Boolean(role) && SUPPORT_HUB_ROLES.includes(role);
}

// Mirrors daily-checkin's own hubConfig.js goToHubSupport, sync here (this
// app reads hubBaseUrl straight from build-time env, not a backend call) -
// this button means "go back to Hub's app launcher", not MTSS's own
// now-vestigial /mtss/support-hub route (that just self-redirects back into
// the MTSS dashboard, see SupportModeSelectionPage.jsx's own comment on why).
export function goToHubSupport() {
  const hubBaseUrl = String(env.hubBaseUrl || "").trim().replace(/\/+$/, "");
  const url = hubBaseUrl ? `${hubBaseUrl}${HUB_SUPPORT_PATH}` : HUB_SUPPORT_PATH;

  // Opened with an empty URL first (mirrors Hub's own AppCard.tsx reuse
  // trick) so an already-open tab just gets focused instead of reloaded -
  // window.open(url, name) navigates the reused tab immediately even if
  // it's already showing that exact page, which reads as a jarring reload.
  const target = window.open("", HUB_SUPPORT_WINDOW_NAME);
  if (!target) {
    // Popup blocked despite the synchronous open - fall back rather than
    // silently doing nothing.
    window.location.assign(url);
    return;
  }

  let isFreshWindow = true;
  try {
    isFreshWindow = target.location.href === "about:blank" || target.location.href === "";
  } catch {
    // Cross-origin already (it navigated to Hub in an earlier click) -
    // not fresh, and not readable from here either way.
    isFreshWindow = false;
  }

  if (isFreshWindow) {
    target.location.href = url;
  } else {
    target.focus();
  }
}
