import axios from 'axios';
import { clearStoredSession } from './session';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const trimLeadingSlash = (value) => String(value || '').replace(/^\/+/, '');

const runtimeOrigin = typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost';

const defaultAppBaseUrl = import.meta.env.DEV
    ? 'http://localhost/vivrecares'
    : runtimeOrigin;

export const APP_BASE_URL = trimTrailingSlash(import.meta.env.VITE_APP_BASE_URL || defaultAppBaseUrl);
export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || `${APP_BASE_URL}/vivrecares-api`);

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

export const apiUrl = (path) => `${API_BASE_URL}/${trimLeadingSlash(path)}`;
export const assetUrl = (path) => `${APP_BASE_URL}/${trimLeadingSlash(path)}`;
export const uploadAssetUrl = (path) => `${trimTrailingSlash(API_BASE_URL.replace(/\/vivrecares-api$/i, ''))}/${trimLeadingSlash(path)}`;

axios.interceptors.request.use((config) => {
    if (typeof config.url === 'string' && config.url.startsWith('/')) {
        config.url = apiUrl(config.url);
    }
    if (typeof config.withCredentials === 'undefined') {
        config.withCredentials = true;
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
