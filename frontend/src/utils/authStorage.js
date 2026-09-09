export const AUTH_TOKEN_KEY = 'mtss.auth_token';
export const AUTH_USER_KEY = 'mtss.auth_user';

export const isAuthStorageKey = (key) => key === AUTH_TOKEN_KEY || key === AUTH_USER_KEY;

// The real session lives in an httpOnly cookie the browser manages on its
// own now - nothing in this file can read or write it directly anymore
// (that's the whole point). AUTH_TOKEN_KEY instead holds a non-sensitive
// marker (a timestamp, never a credential) whose only job is to keep firing
// the same `storage` event other tabs already listen for
// (useCrossTabAuthSync) - a handful of call sites also just check this for
// truthiness ("is there a session at all"), which still works unchanged.
export const getStoredAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getStoredAuthUserRaw = () => localStorage.getItem(AUTH_USER_KEY);

export const getStoredAuthUser = () => {
    const raw = getStoredAuthUserRaw();
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const setStoredAuthUser = (user) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const setStoredAuthSession = ({ user }) => {
    localStorage.setItem(AUTH_TOKEN_KEY, String(Date.now()));
    setStoredAuthUser(user);
};

export const clearStoredAuthSession = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
};
