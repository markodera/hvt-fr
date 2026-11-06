import { hvt } from '@/lib/hvt';
import {
    confirmRuntimePasswordReset,
    requestRuntimePasswordReset,
    resendRuntimeVerificationEmail,
    validateRuntimePasswordResetToken,
    verifyRuntimeEmail,
} from '@/lib/runtimeAuth';

function normalizeOptions(options = {}) {
    if (
        options &&
        typeof options === 'object' &&
        ('queryKey' in options || 'pageParam' in options || 'meta' in options)
    ) {
        return options.signal ? { signal: options.signal } : {};
    }
    return options;
}

export function login(data, options = {}) {
    return hvt.auth.login(data, options);
}

export function logout(options = {}) {
    return hvt.auth.logout(options);
}

export function register(data, options = {}) {
    return hvt.auth.register(data, options);
}

export function resendVerificationEmail(data, options = {}) {
    return hvt.request('/api/v1/auth/register/resend-email/', {
        method: 'POST',
        body: data,
        auth: 'none',
        ...options,
    });
}

export function getMe(options = {}) {
    return hvt.auth.me(options);
}

export function updateProfile(data, options = {}) {
    return hvt.auth.updateMe(data, options);
}

export function refreshAuth(data = {}, options = {}) {
    return hvt.auth.refresh(data, options);
}

export function requestPasswordReset(data, options = {}) {
    return hvt.auth.passwordReset(data, options);
}

export function requestRuntimeScopedPasswordReset(data, options = {}) {
    return requestRuntimePasswordReset(data, options);
}

function resolveResetTokenPath(tokenOrKey) {
    if (typeof tokenOrKey === 'string') {
        return tokenOrKey;
    }

    const uid = tokenOrKey?.uid || tokenOrKey?.uidb64;
    const token = tokenOrKey?.token;
    return uid && token ? `${uid}/${token}` : '';
}

export function validatePasswordResetToken(data, options = {}) {
    return hvt.request('/api/v1/auth/password/reset/validate/', {
        method: 'POST',
        body: data,
        auth: 'none',
        ...options,
    });
}

export function validateRuntimeScopedPasswordResetToken(data, options = {}) {
    return validateRuntimePasswordResetToken(data, options);
}

export function confirmPasswordReset(tokenOrKey, data, options = {}) {
    const path = resolveResetTokenPath(tokenOrKey);
    const uid = tokenOrKey?.uid || tokenOrKey?.uidb64;
    const token = tokenOrKey?.token;
    return hvt.request(`/api/v1/auth/password/reset/confirm/${path}/`, {
        method: 'POST',
        body: {
            ...data,
            ...(uid && token ? { uid, token } : {}),
        },
        auth: 'none',
        ...options,
    });
}

export function confirmRuntimeScopedPasswordReset(tokenOrKey, data, options = {}) {
    return confirmRuntimePasswordReset(tokenOrKey, data, options);
}

export function changePassword(data, options = {}) {
    return hvt.auth.passwordChange(data, options);
}

export function socialAuthGoogle(data, options = {}) {
    return hvt.auth.socialGoogle(data, options);
}

export function socialAuthGithub(data, options = {}) {
    return hvt.auth.socialGithub(data, options);
}

export function socialAuthDiscord(data, options = {}) {
    return hvt.auth.socialDiscord(data, options);
}

export function socialAuthApple(data, options = {}) {
    return hvt.auth.socialApple(data, options);
}

export function socialAuthMicrosoft(data, options = {}) {
    return hvt.auth.socialMicrosoft(data, options);
}

export function socialAuthGitlab(data, options = {}) {
    return hvt.auth.socialGitlab(data, options);
}

export function listPasskeys(options = {}) {
    return hvt.auth.listPasskeys(normalizeOptions(options));
}

export function registerPasskey(data = {}, _options = {}) {
    return hvt.auth.registerPasskey(data);
}

export function deletePasskey(id, options = {}) {
    return hvt.auth.deletePasskey(id, options);
}

export function loginWithPasskey(data = {}, _options = {}) {
    return hvt.auth.loginWithPasskey(data);
}

export function loginWithMfa(data, options = {}) {
    return hvt.request('/api/v1/auth/mfa/totp/login/', {
        method: 'POST',
        body: data,
        auth: 'none',
        ...options,
    });
}

export function getMfaStatus(options = {}) {
    return hvt.request('/api/v1/auth/mfa/totp/status/', {
        method: 'GET',
        ...normalizeOptions(options),
    });
}

export function setupMfa(options = {}) {
    return hvt.request('/api/v1/auth/mfa/totp/setup/', {
        method: 'POST',
        ...normalizeOptions(options),
    });
}

export function verifyMfa(data, options = {}) {
    return hvt.request('/api/v1/auth/mfa/totp/verify/', {
        method: 'POST',
        body: data,
        ...normalizeOptions(options),
    });
}

export function disableMfa(data, options = {}) {
    return hvt.request('/api/v1/auth/mfa/totp/disable/', {
        method: 'POST',
        body: data,
        ...normalizeOptions(options),
    });
}

export function requestMagicLink(data, options = {}) {
    return hvt.auth.requestMagicLink(data, options);
}

export function verifyMagicLink(data, options = {}) {
    return hvt.auth.verifyMagicLink(data, options);
}

export function verifyEmail(key, options = {}) {
    return hvt.request('/api/v1/auth/register/verify-email/', {
        method: 'POST',
        body: { key },
        auth: 'none',
        ...options,
    });
}

export function verifyRuntimeScopedEmail(key, options = {}) {
    return verifyRuntimeEmail(key, options);
}

export function resendRuntimeScopedVerificationEmail(data, options = {}) {
    return resendRuntimeVerificationEmail(data, options);
}

export function listSocialProviders(options = {}) {
    return hvt.auth.listSocialProviders(normalizeOptions(options));
}
