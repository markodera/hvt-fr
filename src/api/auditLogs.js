import client from './client';

const BASE = '/organizations/current/audit-logs';

export function listAuditLogs(params = {}) {
    return client.get(`${BASE}/`, { params }).then((res) => res.data);
}

export function getAuditLog(id) {
    return client.get(`${BASE}/${id}/`).then((res) => res.data);
}
