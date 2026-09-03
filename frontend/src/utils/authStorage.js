export const AUTH_TOKEN_KEY = 'mtss.auth_token';
export const AUTH_USER_KEY = 'mtss.auth_user';

export const isAuthStorageKey = (key) => key === AUTH_TOKEN_KEY || key === AUTH_USER_KEY;

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

export const setStoredAuthSession = ({ token, user }) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setStoredAuthUser(user);
};

export const clearStoredAuthSession = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
};
