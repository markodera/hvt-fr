// SPDX-License-Identifier: Apache-2.0
import { hvt } from '@/lib/hvt';

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

export function listPATs(options = {}) {
    return hvt.request('/api/v1/auth/pats/', {
        method: 'GET',
        ...normalizeOptions(options),
    });
}

export function createPAT(data, options = {}) {
    return hvt.request('/api/v1/auth/pats/', {
        method: 'POST',
        body: data,
        ...normalizeOptions(options),
    });
}

export function revokePAT(patId, options = {}) {
    return hvt.request(`/api/v1/auth/pats/${patId}/`, {
        method: 'DELETE',
        ...normalizeOptions(options),
    });
}
