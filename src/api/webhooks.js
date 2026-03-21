import client from './client';

const BASE = '/organizations/current/webhooks';

export function listWebhooks(params = {}) {
    return client.get(`${BASE}/`, { params }).then((res) => res.data);
}

export function createWebhook(data) {
    return client.post(`${BASE}/`, data).then((res) => res.data);
}

export function getWebhook(id) {
    return client.get(`${BASE}/${id}/`).then((res) => res.data);
}

export function updateWebhook(id, data) {
    return client.patch(`${BASE}/${id}/`, data).then((res) => res.data);
}

export function deleteWebhook(id) {
    return client.delete(`${BASE}/${id}/`).then((res) => res.data);
}

export function getWebhookDeliveries(id, params = {}) {
    return client.get(`${BASE}/${id}/deliveries/`, { params }).then((res) => res.data);
}
