import client from './client';

export function getCurrentOrg() {
    return client.get('/organizations/current/').then((res) => res.data);
}

export function updateOrg(id, data) {
    return client.patch(`/organizations/${id}/`, data).then((res) => res.data);
}

export function getOrgMembers(params = {}) {
    return client.get('/organizations/current/members/', { params }).then((res) => res.data);
}

export function getPermissions() {
    return client.get('/organizations/current/permissions/').then((res) => res.data);
}
