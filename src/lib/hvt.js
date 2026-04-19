import { API_KEY_CANONICAL_SCOPES, HVTApiError, HVTClient } from '@hvt/sdk';
import { resolveApiBaseUrl } from '@/lib/apiBaseUrl';

const API_BASE_URL = resolveApiBaseUrl(
    import.meta.env.VITE_API_URL,
    typeof window !== 'undefined' ? window.location.origin : '',
);
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
    '/api/v1/auth/runtime/password/reset',
];

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;

let refreshPromise = null;
let refreshTimerId = null;

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

function isAuthFailureStatus(status) {
    return status === 400 || status === 401 || status === 403;
}

function isAuthFailure(error) {
    return isAuthFailureStatus(error?.status ?? error?.response?.status ?? null);
}

function dispatchAuthLogout() {
    window.dispatchEvent(new Event('auth:logout'));
}

function clearRefreshTimer() {
    if (refreshTimerId) {
        window.clearTimeout(refreshTimerId);
        refreshTimerId = null;
    }
}

function decodeJwtPayload(accessToken) {
    if (typeof accessToken !== 'string') {
        return null;
    }

    const [, encodedPayload] = accessToken.split('.');
    if (!encodedPayload) {
        return null;
    }

    try {
        const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
        return JSON.parse(window.atob(padded));
    } catch {
        return null;
    }
}

function scheduleRefresh(accessToken) {
    clearRefreshTimer();

    const exp = Number(decodeJwtPayload(accessToken)?.exp);
    if (!Number.isFinite(exp)) {
        return;
    }

    const refreshAtMs = (exp * 1000) - Date.now() - ACCESS_TOKEN_REFRESH_BUFFER_MS;
    const delayMs = Math.max(refreshAtMs, MIN_REFRESH_DELAY_MS);

    refreshTimerId = window.setTimeout(() => {
        refreshDashboardSession().catch(() => {
            // Leave the current session state untouched on transient failures.
            // The next authenticated request will retry refresh again if needed.
        });
    }, delayMs);
}

export async function refreshDashboardSession() {
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

export { isAuthFailure };

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
    } catch (error) {
        if (isAuthFailure(error)) {
            hvt.setAccessToken(null);
            dispatchAuthLogout();
        }
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

const baseSetAccessToken = hvt.setAccessToken.bind(hvt);

hvt.setAccessToken = (accessToken) => {
    const normalizedAccessToken = accessToken || null;
    const result = baseSetAccessToken(normalizedAccessToken);

    if (normalizedAccessToken) {
        scheduleRefresh(normalizedAccessToken);
    } else {
        clearRefreshTimer();
    }

    return result;
};

export { API_KEY_CANONICAL_SCOPES, HVTApiError, HVTClient };
