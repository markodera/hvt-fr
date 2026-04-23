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

function normalizeQueryArgs(params = {}, options = {}) {
    if (
        params &&
        typeof params === 'object' &&
        ('queryKey' in params || 'pageParam' in params || 'meta' in params)
    ) {
        return [{}, normalizeOptions(params)];
    }
    return [params, normalizeOptions(options)];
}

function organizationRequest(path, { method = 'GET', query, body, ...options } = {}) {
    return hvt.request(path, {
        method,
        query,
        body,
        ...normalizeOptions(options),
    });
}

export async function createOrg(data, options = {}) {
    const response = await hvt.organizations.create(data, options);

    if (response?.access) {
        hvt.setAccessToken(response.access);
    }

    return response;
}

export function getCurrentOrg(options = {}) {
    return hvt.organizations.current(normalizeOptions(options));
}

export function updateOrg(data, options = {}) {
    return hvt.organizations.updateCurrent(data, options);
}

export function listProjects(params = {}, options = {}) {
    const [query, requestOptions] = normalizeQueryArgs(params, options);
    return hvt.organizations.listProjects(query, requestOptions);
}

export function createProject(data, options = {}) {
    return hvt.organizations.createProject(data, options);
}

export function updateProject(id, data, options = {}) {
    return hvt.organizations.updateProject(id, data, options);
}

export function deleteProject(id, options = {}) {
    return hvt.organizations.deleteProject(id, options);
}

export function listProjectPermissions(projectId, params = {}, options = {}) {
    const [query, requestOptions] = normalizeQueryArgs(params, options);
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/permissions/`, {
        method: 'GET',
        query,
        ...requestOptions,
    });
}

export function createProjectPermission(projectId, data, options = {}) {
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/permissions/`, {
        method: 'POST',
        body: data,
        ...options,
    });
}

export function updateProjectPermission(projectId, permissionId, data, options = {}) {
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/permissions/${permissionId}/`, {
        method: 'PATCH',
        body: data,
        ...options,
    });
}

export function deleteProjectPermission(projectId, permissionId, options = {}) {
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/permissions/${permissionId}/`, {
        method: 'DELETE',
        ...options,
    });
}

export function listProjectRoles(projectId, params = {}, options = {}) {
    const [query, requestOptions] = normalizeQueryArgs(params, options);
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/roles/`, {
        method: 'GET',
        query,
        ...requestOptions,
    });
}

export function createProjectRole(projectId, data, options = {}) {
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/roles/`, {
        method: 'POST',
        body: data,
        ...options,
    });
}

export function updateProjectRole(projectId, roleId, data, options = {}) {
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/roles/${roleId}/`, {
        method: 'PATCH',
        body: data,
        ...options,
    });
}

export function deleteProjectRole(projectId, roleId, options = {}) {
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/roles/${roleId}/`, {
        method: 'DELETE',
        ...options,
    });
}

export function getCurrentProjectAccess(projectId, options = {}) {
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/access/`, {
        method: 'GET',
        ...options,
    });
}

export function getUserProjectAccess(projectId, userId, options = {}) {
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/users/${userId}/roles/`, {
        method: 'GET',
        ...options,
    });
}

export function replaceUserProjectRoles(projectId, userId, data, options = {}) {
    return organizationRequest(`/api/v1/organizations/current/projects/${projectId}/users/${userId}/roles/`, {
        method: 'PUT',
        body: data,
        ...options,
    });
}

export function listRuntimeInvitations(params = {}, options = {}) {
    const [query, requestOptions] = normalizeQueryArgs(params, options);
    return organizationRequest('/api/v1/runtime/invitations/', {
        method: 'GET',
        query,
        ...requestOptions,
    });
}

export function createRuntimeInvitation(data, options = {}) {
    return organizationRequest('/api/v1/runtime/invitations/', {
        method: 'POST',
        body: data,
        ...options,
    });
}

export function revokeRuntimeInvitation(invitationId, options = {}) {
    return organizationRequest(`/api/v1/runtime/invitations/${invitationId}/`, {
        method: 'DELETE',
        ...options,
    });
}

export function listProjectSocialProviders(projectId, options = {}) {
    return hvt.organizations.listProjectSocialProviders(projectId, options);
}

export function createProjectSocialProvider(projectId, data, options = {}) {
    return hvt.organizations.createProjectSocialProvider(projectId, data, options);
}

export function updateProjectSocialProvider(projectId, id, data, options = {}) {
    return hvt.organizations.updateProjectSocialProvider(projectId, id, data, options);
}

export function deleteProjectSocialProvider(projectId, id, options = {}) {
    return hvt.organizations.deleteProjectSocialProvider(projectId, id, options);
}

export function listOrganizationInvitations(params = {}, options = {}) {
    const [query, requestOptions] = normalizeQueryArgs(params, options);
    return hvt.organizations.listInvitations(query, requestOptions);
}

export function createOrganizationInvitation(data, options = {}) {
    return hvt.organizations.createInvitation(data, options);
}

export function resendOrganizationInvitation(id, options = {}) {
    return hvt.organizations.resendInvitation(id, options);
}

export function revokeOrganizationInvitation(id, options = {}) {
    return hvt.organizations.revokeInvitation(id, options);
}

export function lookupOrganizationInvitation(token, options = {}) {
    return hvt.organizations.lookupInvitation(token, options);
}

export function acceptOrganizationInvitation(token, options = {}) {
    return hvt.organizations.acceptInvitation(token, options);
}

export function getOrgMembers(params = {}, options = {}) {
    const [query, requestOptions] = normalizeQueryArgs(params, options);
    return hvt.organizations.listMembers(query, requestOptions);
}

export function getPermissions(options = {}) {
    return hvt.organizations.permissions(normalizeOptions(options));
}
