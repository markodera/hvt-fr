import { API_KEY_CANONICAL_SCOPES, HVTApiError, HVTClient } from '@hvt/sdk';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const rawFetch = (...args) => fetch(...args);

const PUBLIC_AUTH_PATH_PREFIXES = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/social',
    '/api/v1/auth/password/reset',
    '/api/v1/auth/token/refresh',
    '/api/v1/auth/runtime/register',
    '/api/v1/auth/runtime/login',
    '/api/v1/auth/runtime/social',
];

let refreshPromise = null;

function resolveRequestUrl(input) {
    if (input instanceof Request) {
        return input.url;
    }
    return String(input || '');
}

function getPathname(input) {
    try {
        return new URL(resolveRequestUrl(input), API_BASE_URL).pathname.replace(/\/+$/, '');
    } catch {
        return '';
    }
}

function isPublicAuthPath(pathname) {
    return PUBLIC_AUTH_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function refreshDashboardSession() {
    if (!refreshPromise) {
        refreshPromise = rawFetch(new URL('/api/v1/auth/token/refresh/', API_BASE_URL), {
            method: 'POST',
            credentials: 'include',
        })
            .then(async (response) => {
                let payload;
                try {
                    payload = await response.json();
                } catch {
                    payload = null;
                }

                if (!response.ok) {
                    throw new HVTApiError(
                        payload?.detail || payload?.error || 'Session refresh failed.',
                        {
                            status: response.status,
                            code: payload?.code || `http_${response.status}`,
                            detail: payload?.detail || payload,
                            body: payload,
                        },
                    );
                }

                hvt.setAccessToken(payload?.access || null);
                return payload;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

async function authAwareFetch(input, init = {}) {
    const { __hvtRetried, ...requestInit } = init || {};
    const response = await rawFetch(input, requestInit);
    const pathname = getPathname(input);

    if (
        response.status !== 401 ||
        __hvtRetried ||
        !pathname ||
        isPublicAuthPath(pathname) ||
        pathname === '/api/v1/auth/logout'
    ) {
        return response;
    }

    try {
        await refreshDashboardSession();
    } catch {
        hvt.setAccessToken(null);
        window.dispatchEvent(new Event('auth:logout'));
        return response;
    }

    const retryHeaders = new Headers(requestInit.headers || {});
    if (hvt.accessToken) {
        retryHeaders.set('Authorization', `Bearer ${hvt.accessToken}`);
    } else {
        retryHeaders.delete('Authorization');
    }

    return rawFetch(input, {
        ...requestInit,
        headers: retryHeaders,
        __hvtRetried: true,
    });
}

export const hvt = new HVTClient({
    baseUrl: API_BASE_URL,
    fetch: authAwareFetch,
});

export { API_KEY_CANONICAL_SCOPES, HVTApiError, HVTClient };
