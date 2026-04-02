import axios from 'axios';
import { clearStoredSession, getStoredToken } from './session';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const trimLeadingSlash = (value) => String(value || '').replace(/^\/+/, '');
const hasUrlScheme = (value) => /^[a-z][a-z\d+\-.]*:\/\//i.test(String(value || ''));
const normalizeBaseUrl = (value, fallback = '') => {
    const trimmed = trimTrailingSlash(value);

    if (!trimmed) {
        return trimTrailingSlash(fallback);
    }

    if (hasUrlScheme(trimmed)) {
        return trimmed;
    }

    if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
    }

    if (trimmed.startsWith('/')) {
        return trimmed;
    }

    return `https://${trimmed}`;
};

const runtimeOrigin = typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost';

const defaultAppBaseUrl = import.meta.env.DEV
    ? 'http://localhost/vivrecares'
    : runtimeOrigin;

export const APP_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_APP_BASE_URL, defaultAppBaseUrl);
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL, `${APP_BASE_URL}/vivrecares-api`);

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

export const apiUrl = (path) => `${API_BASE_URL}/${trimLeadingSlash(path)}`;
export const assetUrl = (path) => `${APP_BASE_URL}/${trimLeadingSlash(path)}`;
export const uploadAssetUrl = (path) => `${trimTrailingSlash(API_BASE_URL.replace(/\/vivrecares-api$/i, ''))}/${trimLeadingSlash(path)}`;
const directApiRoot = trimTrailingSlash(API_BASE_URL);
const appRoot = trimTrailingSlash(APP_BASE_URL);
const canonicalApiRoot = trimTrailingSlash(
    API_BASE_URL.replace(/\/(?:app|vivrecares-api)$/i, '/vivrecares-api')
);

const uniqueUrls = (values) => Array.from(new Set(values.filter(Boolean)));

export const profilePhotoCandidates = (filename) => {
    const encoded = encodeURIComponent(filename);
    return uniqueUrls([
        `${directApiRoot}/serve_profile_photo.php?file=${encoded}`,
        `${canonicalApiRoot}/serve_profile_photo.php?file=${encoded}`,
        `${appRoot}/serve_profile_photo.php?file=${encoded}`,
        `${appRoot}/vivrecares-api/serve_profile_photo.php?file=${encoded}`,
    ]);
};

export const profilePhotoUrl = (filename) => profilePhotoCandidates(filename)[0] || '';
export const profilePhotoFallbackUrl = (filename) => profilePhotoCandidates(filename)[1] || '';

axios.interceptors.request.use((config) => {
    if (typeof config.url === 'string' && config.url.startsWith('/')) {
        config.url = apiUrl(config.url);
    }
    if (typeof config.withCredentials === 'undefined') {
        config.withCredentials = true;
    }

    const token = getStoredToken();
    if (token) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    return config;
});

let isHandlingUnauthorized = false;

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const requestUrl = String(error?.config?.url || '');
        const isAuthEndpoint = requestUrl.includes('/login.php') || requestUrl.includes('/session_status.php');

        if (status === 401 && !isAuthEndpoint && !isHandlingUnauthorized) {
            isHandlingUnauthorized = true;
            clearStoredSession();

            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                if (currentPath !== '/' && currentPath !== '/login') {
                    window.location.assign('/?session=expired');
                }
            }
        }

        return Promise.reject(error);
    }
);
