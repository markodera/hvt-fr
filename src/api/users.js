import client from './client';

export function listUsers(params = {}) {
    return client.get('/users/', { params }).then((res) => res.data);
}

export function getUser(id) {
    return client.get(`/users/${id}/`).then((res) => res.data);
}

export function updateUserRole(id, data) {
    return client.patch(`/users/${id}/role/`, data).then((res) => res.data);
}
