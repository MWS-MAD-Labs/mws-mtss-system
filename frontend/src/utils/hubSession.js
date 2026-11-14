import { getHubBaseUrl } from '@/utils/hubConfig';

// MTSS has no sign-in or sign-out of its own: the Hub's session (a cookie on the parent domain) is the
// only one. A page that finds it has no session sends the browser to the Hub, which gives the session back and
// returns here when the person still has one. `restored` in the address says that already happened, so a second
// failure goes to the Hub front page instead of looping.
export async function sendToHub() {
    const base = await getHubBaseUrl();
    if (!base) return false;
    const here = new URL(window.location.href);
    const target = here.searchParams.has('restored')
        ? `${base}/`
        : `${base}/auth/restore?return=${encodeURIComponent(here.toString())}`;
    window.location.replace(target);
    return true;
}

// Takes the person to the Hub front page, where the apps are and where signing out lives.
export async function goToHubHome() {
    const base = await getHubBaseUrl();
    if (!base) return false;
    window.location.assign(`${base}/`);
    return true;
}

// Removes the `restored` marker the Hub adds, once the session is confirmed.
export function stripRestoredMarker() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('restored')) return;
    url.searchParams.delete('restored');
    window.history.replaceState({}, document.title, url.toString());
}
