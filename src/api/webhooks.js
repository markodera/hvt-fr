import { hvt } from '@/lib/hvt';

function normalizeQueryArgs(params = {}, options = {}) {
    if (
        params &&
        typeof params === 'object' &&
        ('queryKey' in params || 'pageParam' in params || 'meta' in params)
    ) {
        return [{}, params.signal ? { signal: params.signal } : {}];
    }
    return [params, options];
}

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

export async function getWebhookSummary(options = {}) {
    const requestOptions = normalizeOptions(options);
    return hvt.request('/api/v1/organizations/current/webhooks/summary/', {
        method: 'GET',
        ...requestOptions,
    });
}

export function listWebhooks(params = {}, options = {}) {
    const [query, requestOptions] = normalizeQueryArgs(params, options);
    return hvt.organizations.listWebhooks(query, requestOptions);
}

export function createWebhook(data, options = {}) {
    return hvt.organizations.createWebhook(data, options);
}

export function getWebhook(id, options = {}) {
    return hvt.organizations.getWebhook(id, options);
}

export function updateWebhook(id, data, options = {}) {
    return hvt.organizations.updateWebhook(id, data, options);
}

export function deleteWebhook(id, options = {}) {
    return hvt.organizations.deleteWebhook(id, options);
}

export function getWebhookDeliveries(id, params = {}, options = {}) {
    const [query, requestOptions] = normalizeQueryArgs(params, options);
    return hvt.organizations.listWebhookDeliveries(id, query, requestOptions);
}
