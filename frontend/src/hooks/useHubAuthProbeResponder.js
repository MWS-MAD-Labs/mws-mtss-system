import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const REQUEST_TYPE = 'mws-hub-auth-probe';
const REPLY_TYPE = 'mws-hub-auth-probe-reply';

// Answers Hub's "are you actually logged in right now" postMessage ping
// (see mws-hub's authProbe.ts) - Hub asks this after a silent relaunch
// attempt, because a hidden iframe's own write to this origin's localStorage
// can land in browser storage that's partitioned away from this real tab
// (third-party storage partitioning), so the iframe never learns whether the
// refresh actually reached this tab. This tab always knows its own real
// state, unpartitioned, so it just answers honestly.
//
// Answers from Redux state, not a raw localStorage.getItem('auth_token')
// check - the hidden iframe's write and Hub's postMessage probe race each
// other with no guaranteed order, so the fresh token can already be sitting
// in this tab's real (unpartitioned) storage a moment before
// useCrossTabAuthSync's own 'storage' listener has actually run and moved
// this tab off its stale/login screen. Answering "yes" on token presence
// alone used to win that race sometimes - Hub would focus this tab while it
// was still rendering the old screen, since nothing had told React yet.
// isAuthenticated only flips once useCrossTabAuthSync's handler has
// actually dispatched loginSuccess, so "yes" here means the UI has
// genuinely caught up, not just that the bytes are on disk.
export function useHubAuthProbeResponder() {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type !== REQUEST_TYPE) return;
            event.source?.postMessage({ type: REPLY_TYPE, authenticated: isAuthenticated }, event.origin);
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isAuthenticated]);
}
