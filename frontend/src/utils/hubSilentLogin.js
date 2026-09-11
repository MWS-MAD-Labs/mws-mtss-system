const DEFAULT_TIMEOUT_MS = 5000;

// Fires a hidden iframe through Hub's launch endpoint - the same first-party
// SSO relay a real "Sign in with Hub" click-through uses, but invisibly.
//
// Resolves with one of three outcomes once the attempt has had its chance
// to land:
//   - { status: 'success' } - Hub's own session was valid and the iframe's
//     final hop (this app's own /auth/callback, same origin as the caller)
//     posted back to say so. Caller still needs to fetch the now-current
//     user (dispatch(fetchCurrentUser())) - this promise only confirms the
//     httpOnly cookie landed, not what's in it.
//   - { status: 'error', code, title, description } - Hub refused the
//     launch for a specific reason (no access, app under maintenance, etc -
//     see mws-hub's SupportHubPage.tsx LAUNCH_ERRORS) and said so directly.
//     title/description are Hub's own copy, safe to show as-is.
//   - { status: 'timeout' } - nothing came back within timeoutMs, most
//     commonly because Hub itself has no session (the iframe just sits on
//     Hub's login screen, which posts nothing) - the caller's only real
//     option here is falling through to a full, visible redirect.
export function attemptSilentHubLogin(hubBaseUrl, appId, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const hubOrigin = new URL(hubBaseUrl).origin;

    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.setAttribute('aria-hidden', 'true');

        let settled = false;
        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            window.removeEventListener('message', handleMessage);
            iframe.remove();
            resolve(result);
        };

        const handleMessage = (event) => {
            if (event.data?.type === 'MWS_HUB_SILENT_LOGIN_SUCCESS' && event.origin === window.location.origin) {
                finish({ status: 'success' });
            } else if (event.data?.type === 'MWS_HUB_LAUNCH_ERROR' && event.origin === hubOrigin) {
                finish({
                    status: 'error',
                    code: event.data.code,
                    title: event.data.title,
                    description: event.data.description,
                });
            }
        };

        const timer = setTimeout(() => finish({ status: 'timeout' }), timeoutMs);
        window.addEventListener('message', handleMessage);
        iframe.src = `${hubBaseUrl}/apps/${appId}/launch`;
        document.body.appendChild(iframe);
    });
}
