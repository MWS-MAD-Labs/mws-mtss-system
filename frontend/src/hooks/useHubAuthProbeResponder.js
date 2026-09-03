import { useEffect } from 'react';

const REQUEST_TYPE = 'mws-hub-auth-probe';
const REPLY_TYPE = 'mws-hub-auth-probe-reply';

// Answers Hub's "are you actually logged in right now" postMessage ping
// (see mws-hub's authProbe.ts) - Hub asks this after a silent relaunch
// attempt, because a hidden iframe's own write to this origin's localStorage
// can land in browser storage that's partitioned away from this real tab
// (third-party storage partitioning), so the iframe never learns whether the
// refresh actually reached this tab. This tab always knows its own real
// state, unpartitioned, so it just answers honestly from localStorage.
export function useHubAuthProbeResponder() {
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type !== REQUEST_TYPE) return;
            const authenticated = Boolean(localStorage.getItem('auth_token'));
            event.source?.postMessage({ type: REPLY_TYPE, authenticated }, event.origin);
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);
}
