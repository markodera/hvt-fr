import { getErrorMessage } from '@/lib/utils';

const SOCIAL_AUTH_SESSION_KEY = 'hvt.social_auth.pending';

export const SOCIAL_AUTH_PROVIDERS = {
    GOOGLE: 'google',
    GITHUB: 'github',
};

export const SOCIAL_AUTH_ENDPOINTS = {
    [SOCIAL_AUTH_PROVIDERS.GOOGLE]: '/api/v1/auth/social/google/',
    [SOCIAL_AUTH_PROVIDERS.GITHUB]: '/api/v1/auth/social/github/',
};

function createSocialState(provider) {
    const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : String(Date.now());
    return `${provider}:${random}`;
}

function setPendingSocialAuth(payload) {
    sessionStorage.setItem(SOCIAL_AUTH_SESSION_KEY, JSON.stringify(payload));
}

export function getPendingSocialAuth() {
    const raw = sessionStorage.getItem(SOCIAL_AUTH_SESSION_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function clearPendingSocialAuth() {
    sessionStorage.removeItem(SOCIAL_AUTH_SESSION_KEY);
}

function getProviderConfig(provider, providers) {
    if (Array.isArray(providers)) {
        return providers.find((item) => item.provider === provider) || null;
    }

    return providers?.[provider] ?? null;
}

function buildProviderAuthUrl(provider, providers) {
    const config = getProviderConfig(provider, providers);
    if (!config?.client_id || !config?.authorization_url) return null;

    const redirectUri = config.callback_url || `${window.location.origin}/auth/${provider}/callback`;
    const state = createSocialState(provider);
    setPendingSocialAuth({ provider, state, createdAt: new Date().toISOString() });

    const scope = encodeURIComponent((config.scope || []).join(' '));
    const clientId = encodeURIComponent(config.client_id);
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const encodedState = encodeURIComponent(state);

    if (provider === SOCIAL_AUTH_PROVIDERS.GOOGLE) {
        return `${config.authorization_url}?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&access_type=offline&state=${encodedState}`;
    }

    if (provider === SOCIAL_AUTH_PROVIDERS.GITHUB) {
        return `${config.authorization_url}?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=${scope}&state=${encodedState}`;
    }

    return null;
}

export function startSocialSignIn(provider, providers) {
    const url = buildProviderAuthUrl(provider, providers);
    if (!url) return false;

    logSocialAuthTelemetry({
        selectedProvider: provider,
        callbackProvider: null,
        endpointHit: null,
        httpStatus: null,
        errorDetail: null,
        stage: 'redirect_to_provider',
    });

    window.location.assign(url);
    return true;
}

export function validateSocialCallback({ expectedProvider, callbackState }) {
    const pending = getPendingSocialAuth();
    if (!pending?.provider || !pending?.state) {
        return {
            isValid: false,
            reason: 'missing_pending_provider_state',
            selectedProvider: pending?.provider ?? null,
        };
    }

    if (pending.provider !== expectedProvider) {
        return {
            isValid: false,
            reason: 'provider_mismatch',
            selectedProvider: pending.provider,
        };
    }

    if (!callbackState) {
        return {
            isValid: false,
            reason: 'missing_callback_state',
            selectedProvider: pending.provider,
        };
    }

    if (pending.state !== callbackState) {
        return {
            isValid: false,
            reason: 'callback_state_mismatch',
            selectedProvider: pending.provider,
        };
    }

    return {
        isValid: true,
        reason: null,
        selectedProvider: pending.provider,
    };
}

export function mapSocialAuthError(error) {
    const detail = getErrorMessage(error);
    const normalized = detail.toLowerCase();

    if (
        normalized.includes('is not configured') ||
        normalized.includes('configuration is ambiguous')
    ) {
        return {
            category: 'provider_unavailable',
            message: 'Provider temporarily unavailable, try the other provider or email/password',
            detail,
        };
    }

    if (
        normalized.includes('already have an account') ||
        normalized.includes('already exists') ||
        normalized.includes('already associated') ||
        normalized.includes('account already exists') ||
        normalized.includes('email already')
    ) {
        return {
            category: 'existing_account_linking',
            message: 'You already have an account with this email. Continue to link/sign in',
            detail,
        };
    }

    return {
        category: 'social_auth_failure',
        message: 'Social sign-in failed. Please retry.',
        detail,
    };
}

export function logSocialAuthTelemetry({
    selectedProvider,
    callbackProvider,
    endpointHit,
    httpStatus,
    errorDetail,
    stage,
}) {
    const payload = {
        selectedProvider,
        callbackProvider,
        endpointHit,
        httpStatus,
        errorDetail,
        stage,
        timestamp: new Date().toISOString(),
    };

    const hasError = Boolean(errorDetail) || (typeof httpStatus === 'number' && httpStatus >= 400);
    if (hasError) {
        console.warn('[social-auth]', payload);
        return;
    }

    console.info('[social-auth]', payload);
}