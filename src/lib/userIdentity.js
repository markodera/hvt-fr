function normalizeString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

export function getUserDisplayName(user, fallback = 'HVT user') {
    const firstName = normalizeString(user?.first_name);
    const lastName = normalizeString(user?.last_name);
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    if (fullName) {
        return fullName;
    }

    const serverFullName = normalizeString(user?.full_name);
    if (serverFullName) {
        return serverFullName;
    }

    const email = normalizeString(user?.email);
    if (email) {
        return email;
    }

    return fallback;
}

export function getUserInitials(user, fallback = 'HV') {
    const firstName = normalizeString(user?.first_name);
    const lastName = normalizeString(user?.last_name);
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    if (fullName) {
        return fullName
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('');
    }

    const email = normalizeString(user?.email);
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }

    return fallback;
}
