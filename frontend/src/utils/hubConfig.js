import api from '@/services/authService';
import { env } from '@/config/env';

// Read from the backend at runtime so a fixed environment value takes effect on restart, without a rebuild. The
// build-time value is only the fallback for local development.
let hubBaseUrlPromise = null;

export function getHubBaseUrl() {
  if (!hubBaseUrlPromise) {
    hubBaseUrlPromise = api
      .get('/config/public', { skipGlobalLoading: true })
      .then((response) => String(response?.data?.data?.hubBaseUrl || '').trim().replace(/\/+$/, ''))
      .catch(() => '')
      .then((base) => base || String(env.hubBaseUrl || '').trim().replace(/\/+$/, ''));
  }
  return hubBaseUrlPromise;
}

const HUB_SUPPORT_PATH = '/support-hub';
// Shared literally with daily-checkin's own hubConfig.js, so a Hub tab either app opens gets reused by the other.
const HUB_SUPPORT_WINDOW_NAME = 'mws-hub-support';

// Opened synchronously, still inside the click handler and before any await, or the browser blocks the popup.
// An empty URL with a name also reuses an already-open Hub tab.
export function goToHubSupport() {
  const target = window.open('', HUB_SUPPORT_WINDOW_NAME);

  let isFreshWindow = true;
  if (target) {
    try {
      isFreshWindow = target.location.href === 'about:blank' || target.location.href === '';
    } catch {
      // Cross-origin already: it navigated to the Hub in an earlier click.
      isFreshWindow = false;
    }
  }

  getHubBaseUrl().then((hubBaseUrl) => {
    const url = hubBaseUrl ? `${hubBaseUrl}${HUB_SUPPORT_PATH}` : HUB_SUPPORT_PATH;
    if (target && isFreshWindow) {
      target.location.href = url;
    } else if (target) {
      target.focus();
    } else {
      window.location.assign(url);
    }
  });
}
