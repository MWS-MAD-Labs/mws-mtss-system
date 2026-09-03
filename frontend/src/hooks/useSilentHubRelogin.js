import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { env } from '@/config/env';

const ATTEMPT_TIMEOUT_MS = 5000;

// Landing here signed out doesn't necessarily mean signed out of
// everything - Hub's own session (an 8h cookie) commonly outlives this
// app's own token, or this app's token got cleared some other way that
// never touched Hub's. Before showing a "sign in" screen, silently try
// picking a fresh session up the same way Hub's own tab-relaunch does: a
// hidden iframe replaying the SSO handshake.
//
// Unlike Hub asking an already-open satellite tab to refresh (see
// mws-hub's AppCard.tsx, and the storage-partitioning issue it works
// around), this iframe's own final stop is /auth/callback on THIS app's
// own origin - the same origin as the page that opened it. That write is
// first-party as far as this iframe is concerned, so there's nothing for
// third-party storage partitioning to get in the way of. The existing
// useCrossTabAuthSync hook already listens for exactly this and picks the
// result up live, same as it does for a Hub-initiated refresh.
//
// One caveat this can't route around: Hub's session cookie is
// SameSite=Strict, so this only works where the browser considers Hub and
// this app the same site (e.g. both under one registrable domain, or both
// on localhost in dev) - Hub and this app on genuinely different domains
// would silently just not have the cookie to send, and this becomes a
// harmless no-op.
export function useSilentHubRelogin() {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const attemptedRef = useRef(false);

    useEffect(() => {
        if (isAuthenticated || attemptedRef.current) return;
        attemptedRef.current = true;

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.setAttribute('aria-hidden', 'true');
        iframe.src = `${env.hubBaseUrl.replace(/\/$/, '')}/apps/mtss/launch`;
        document.body.appendChild(iframe);

        // Deliberately no cleanup function here: React 18 StrictMode's dev-
        // only mount -> cleanup -> mount-again cycle would otherwise remove
        // this iframe (aborting its in-flight, multi-hop redirect) moments
        // after starting it - attemptedRef above is what actually stops the
        // StrictMode remount from double-attempting, not this. This is a
        // fire-and-forget background check; the component unmounting early
        // doesn't need to cancel it, so its lifetime is just the timeout.
        setTimeout(() => iframe.remove(), ATTEMPT_TIMEOUT_MS);
    }, [isAuthenticated]);
}
