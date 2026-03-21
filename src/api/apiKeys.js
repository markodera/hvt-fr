import client from './client';

const BASE = '/organizations/current/keys';

export function listApiKeys(params = {}) {
    return client.get(`${BASE}/`, { params }).then((res) => res.data);
}

export function createApiKey(data) {
    return client.post(`${BASE}/`, data).then((res) => res.data);
}

export function updateApiKey(id, data) {
    return client.patch(`${BASE}/${id}/`, data).then((res) => res.data);
}

export function revokeApiKey(id) {
    return client.post(`${BASE}/${id}/revoke/`).then((res) => res.data);
}
