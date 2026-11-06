import axios from 'axios';
import { hvt, refreshDashboardSession } from '@/lib/hvt';

const API_URL = import.meta.env.VITE_API_URL;

const client = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    // Tell Axios about Django's CSRF cookie/header naming scheme
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Attach Authorization Header ──
client.interceptors.request.use((config) => {
    if (hvt.accessToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${hvt.accessToken}`;
    }
    return config;
});

// ── Refresh queue to handle concurrent 401s ──
let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve()
    );
    failedQueue = [];
}

// ── Response Interceptor (Handle 401s & Refresh via hvt SDK) ──
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh logic for auth endpoints that shouldn't trigger a refresh loop
        if (
            error.response?.status !== 401 ||
            originalRequest._retry ||
            originalRequest.url?.includes('/auth/token/refresh') ||
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/social') ||
            originalRequest.url?.includes('/auth/register')
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // Another refresh is in progress — queue this request
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => {
                if (hvt.accessToken) {
                    originalRequest.headers.Authorization = `Bearer ${hvt.accessToken}`;
                }
                return client(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            await refreshDashboardSession();
            processQueue(null);
            if (hvt.accessToken) {
                originalRequest.headers.Authorization = `Bearer ${hvt.accessToken}`;
            }
            return client(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export { client, client as apiClient };
export default client;
