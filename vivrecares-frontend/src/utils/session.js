const USER_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEY = 'auth_token';

export const getStoredUser = () => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            localStorage.removeItem(USER_STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch (error) {
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
    }
};

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const clearStoredSession = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const rememberStoredUser = (user, token) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    if (typeof token === 'string' && token.trim() !== '') {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
};

export const rememberStoredToken = (token) => {
    if (typeof token === 'string' && token.trim() !== '') {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
};
