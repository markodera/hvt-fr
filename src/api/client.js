import axios from 'axios';

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

// ── Refresh queue to handle concurrent 401s ──

let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve()
    );
    failedQueue = [];
}

// (Removed request interceptor because auth tokens are HttpOnly and handled automatically by browser cookies)

// ── Response Interceptor (Handle 401s & Refresh) ──
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh logic for auth endpoints that shouldn't trigger a refresh loop
        if (
            error.response?.status !== 401 ||
            originalRequest._retry ||
            originalRequest.url?.includes('/auth/token/refresh/') ||
            originalRequest.url?.includes('/auth/login/') ||
            originalRequest.url?.includes('/auth/social/') ||
            originalRequest.url?.includes('/auth/register/')
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // Another refresh is in progress — queue this request
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => client(originalRequest));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            await axios.post(`${API_URL}/auth/token/refresh/`, null, {
                withCredentials: true,
            });
            processQueue(null);
            return client(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);
            
            // Only trigger a global logout if we aren't currently trying to log in/register
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.dispatchEvent(new Event('auth:logout'));
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default client;
