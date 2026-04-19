import { HVTClient } from '@/lib/hvt';
import { resolveApiBaseUrl } from '@/lib/apiBaseUrl';

const RUNTIME_QUERY_VALUE = '1';

function toSearchParams(value) {
    if (value instanceof URLSearchParams) {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.startsWith('?') ? value.slice(1) : value;
        return new URLSearchParams(normalized);
    }

    return new URLSearchParams();
}

export function isRuntimeAuthSearch(value) {
    const searchParams = toSearchParams(value);
    const runtimeValue = (searchParams.get('runtime') || '').trim().toLowerCase();
    return runtimeValue === RUNTIME_QUERY_VALUE || runtimeValue === 'true';
}

export function getRuntimeProjectSlug(value) {
    return (toSearchParams(value).get('project') || '').trim();
}

export function buildRuntimeAuthPath(path, value) {
    const searchParams = toSearchParams(value);
    const nextParams = new URLSearchParams();

    if (isRuntimeAuthSearch(searchParams)) {
        nextParams.set('runtime', RUNTIME_QUERY_VALUE);
    }

    const project = getRuntimeProjectSlug(searchParams);
    if (project) {
        nextParams.set('project', project);
    }

    const queryString = nextParams.toString();
    if (!queryString) {
        return path;
    }

    return `${path}?${queryString}`;
}

export function hasRuntimePublicApiKey() {
    return Boolean((import.meta.env.VITE_RUNTIME_API_KEY || '').trim());
}

function getRuntimeBaseUrl() {
    return resolveApiBaseUrl(
        import.meta.env.VITE_API_URL,
        typeof window !== 'undefined' ? window.location?.origin || '' : '',
    );
}

function createRuntimeClient() {
    return new HVTClient({
        baseUrl: getRuntimeBaseUrl(),
        apiKey: hasRuntimePublicApiKey() ? import.meta.env.VITE_RUNTIME_API_KEY : null,
        credentials: 'omit',
        fetch: (...args) => fetch(...args),
    });
}

function requireRuntimePublicApiKey() {
    if (!hasRuntimePublicApiKey()) {
        throw new Error(
            'This runtime auth flow needs VITE_RUNTIME_API_KEY configured for the frontend build.',
        );
    }
}

function resolveResetTokenPath(tokenOrKey) {
    if (typeof tokenOrKey === 'string') {
        return tokenOrKey;
    }

    const uid = tokenOrKey?.uid || tokenOrKey?.uidb64;
    const token = tokenOrKey?.token;
    return uid && token ? `${uid}/${token}` : '';
}

export function requestRuntimePasswordReset(data, options = {}) {
    requireRuntimePublicApiKey();

    return createRuntimeClient().request('/api/v1/auth/runtime/password/reset/', {
        method: 'POST',
        body: data,
        auth: 'apiKey',
        ...options,
    });
}

export function resendRuntimeVerificationEmail(data, options = {}) {
    requireRuntimePublicApiKey();

    return createRuntimeClient().request('/api/v1/auth/runtime/register/resend-email/', {
        method: 'POST',
        body: data,
        auth: 'apiKey',
        ...options,
    });
}

export function validateRuntimePasswordResetToken(data, options = {}) {
    return createRuntimeClient().request('/api/v1/auth/runtime/password/reset/validate/', {
        method: 'POST',
        body: data,
        auth: 'none',
        ...options,
    });
}

export function confirmRuntimePasswordReset(tokenOrKey, data, options = {}) {
    const path = resolveResetTokenPath(tokenOrKey);
    const uid = tokenOrKey?.uid || tokenOrKey?.uidb64;
    const token = tokenOrKey?.token;

    return createRuntimeClient().request(`/api/v1/auth/runtime/password/reset/confirm/${path}/`, {
        method: 'POST',
        body: {
            ...data,
            ...(uid && token ? { uid, token } : {}),
        },
        auth: 'none',
        ...options,
    });
}

export function verifyRuntimeEmail(key, options = {}) {
    return createRuntimeClient().request('/api/v1/auth/runtime/register/verify-email/', {
        method: 'POST',
        body: { key },
        auth: 'none',
        ...options,
    });
}
