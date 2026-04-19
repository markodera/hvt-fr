const MANAGED_API_ORIGIN = 'https://api.hvts.app';
const LOCAL_API_ORIGIN = 'http://localhost:8000';
const MANAGED_SITE_HOSTS = new Set(['hvts.app', 'www.hvts.app', 'docs.hvts.app']);
const LOCAL_DEVELOPMENT_HOSTS = new Set(['localhost', '127.0.0.1']);

function parseAbsoluteUrl(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();
    if (!normalized) {
        return null;
    }

    try {
        return new URL(normalized);
    } catch {
        return null;
    }
}

export function normalizeApiBaseUrl(value) {
    const parsed = parseAbsoluteUrl(value);
    if (!parsed) {
        return '';
    }

    if (MANAGED_SITE_HOSTS.has(parsed.hostname)) {
        return MANAGED_API_ORIGIN;
    }

    return parsed.origin;
}

export function resolveApiBaseUrl(explicitValue, browserOrigin = '') {
    const normalizedExplicitValue = normalizeApiBaseUrl(explicitValue);
    if (normalizedExplicitValue) {
        return normalizedExplicitValue;
    }

    const parsedBrowserOrigin = parseAbsoluteUrl(browserOrigin);
    if (!parsedBrowserOrigin) {
        return MANAGED_API_ORIGIN;
    }

    if (LOCAL_DEVELOPMENT_HOSTS.has(parsedBrowserOrigin.hostname)) {
        return LOCAL_API_ORIGIN;
    }

    if (MANAGED_SITE_HOSTS.has(parsedBrowserOrigin.hostname)) {
        return MANAGED_API_ORIGIN;
    }

    return parsedBrowserOrigin.origin || MANAGED_API_ORIGIN;
}
