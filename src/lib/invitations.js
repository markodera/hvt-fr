const PENDING_INVITATION_TOKEN_KEY = 'hvt.invitation.pending_token';
const PENDING_INVITATION_RESUME_KEY = 'hvt.invitation.resume_after_auth';

export function setPendingInvitationToken(token) {
    if (!token) return;
    sessionStorage.setItem(PENDING_INVITATION_TOKEN_KEY, token);
}

export function getPendingInvitationToken() {
    return sessionStorage.getItem(PENDING_INVITATION_TOKEN_KEY) || '';
}

export function clearPendingInvitationToken() {
    sessionStorage.removeItem(PENDING_INVITATION_TOKEN_KEY);
    sessionStorage.removeItem(PENDING_INVITATION_RESUME_KEY);
}

export function markInvitationResumeAfterAuth(token) {
    if (!token) return;
    setPendingInvitationToken(token);
    sessionStorage.setItem(PENDING_INVITATION_RESUME_KEY, '1');
}

export function consumeInvitationResumeToken() {
    const shouldResume = sessionStorage.getItem(PENDING_INVITATION_RESUME_KEY) === '1';
    sessionStorage.removeItem(PENDING_INVITATION_RESUME_KEY);
    if (!shouldResume) return '';
    return getPendingInvitationToken();
}

export function buildInvitationAcceptPath(token) {
    const params = new URLSearchParams({ token });
    return `/invite?${params.toString()}`;
}

export function buildInvitationAuthPath(basePath, token) {
    if (!token) return basePath;
    const [pathname, rawQuery = ''] = String(basePath).split('?');
    const params = new URLSearchParams(rawQuery);
    params.set('invite_token', token);
    return `${pathname}?${params.toString()}`;
}
