export const getStoredUser = () => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            localStorage.removeItem('user');
            return null;
        }
        return parsed;
    } catch (error) {
        localStorage.removeItem('user');
        return null;
    }
};

export const clearStoredSession = () => {
    localStorage.removeItem('user');
};
