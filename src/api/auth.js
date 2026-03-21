import client from './client';

export function login(data, config = {}) {
    return client.post('/auth/login/', data, config).then((res) => res.data);
}

export function logout() {
    return client.post('/auth/logout/').then((res) => res.data);
}

export function register(data) {
    return client.post('/auth/register/', data).then((res) => res.data);
}

export function getMe(config = {}) {
    return client.get('/auth/me/', config).then((res) => res.data);
}

export function requestPasswordReset(data) {
    return client.post('/auth/password/reset/', data).then((res) => res.data);
}

export function confirmPasswordReset(key, data) {
    // Note: ensure your backend endpoint expects the unified key in the URL.
    return client
        .post(`/auth/password/reset/confirm/${key}/`, data)
        .then((res) => res.data);
}

export function changePassword(data) {
    return client.post('/auth/password/change/', data).then((res) => res.data);
}

export function socialAuthGoogle(data) {
    return client.post('/auth/social/google/', data).then((res) => res.data);
}

export function socialAuthGithub(data) {
    return client.post('/auth/social/github/', data).then((res) => res.data);
}

export function verifyEmail(key) {
    return client.post('/auth/register/verify-email/', { key }).then((res) => res.data);
}
