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

export function getProjectEmailConfig(projectId, options = {}) {
    return hvt.request(`/api/v1/organizations/current/projects/${projectId}/email-config/`, {
        method: 'GET',
        ...normalizeOptions(options),
    });
}

export function updateProjectEmailConfig(projectId, data, options = {}) {
    return hvt.request(`/api/v1/organizations/current/projects/${projectId}/email-config/`, {
        method: 'PATCH',
        body: data,
        ...normalizeOptions(options),
    });
}

export function testProjectEmailConfig(projectId, data, options = {}) {
    return hvt.request(`/api/v1/organizations/current/projects/${projectId}/email-config/test/`, {
        method: 'POST',
        body: data,
        ...normalizeOptions(options),
    });
}
