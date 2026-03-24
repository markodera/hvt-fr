const PENDING_VERIFICATION_EMAIL_KEY = 'hvt.auth.pending_verification_email';

export function setPendingVerificationEmail(email) {
    const normalized = (email || '').trim();
    if (!normalized) return;
    sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, normalized);
}

export function getPendingVerificationEmail() {
    return sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) || '';
}

export function clearPendingVerificationEmail() {
    sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
}

