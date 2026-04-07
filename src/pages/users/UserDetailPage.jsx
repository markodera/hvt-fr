import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';

import {
    getUserProjectAccess,
    listProjectRoles,
    listProjects,
    replaceUserProjectRoles,
} from '@/api/organizations';
import { getUser, updateUserRole } from '@/api/users';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RoleGate } from '@/components/RoleGate';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { ROLE_LABELS, ROLE_OPTIONS } from '@/lib/constants';

const selectClassName =
    'flex h-10 w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/25';

function normalizeCollection(data) {
    return data?.results ?? data ?? [];
}

function arraysMatch(left = [], right = []) {
    if (left.length !== right.length) {
        return false;
    }

    const leftSorted = [...left].sort();
    const rightSorted = [...right].sort();
    return leftSorted.every((value, index) => value === rightSorted[index]);
}

export function UserDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);

    const { data: user, isLoading, isError } = useQuery({
        queryKey: ['user', id],
        queryFn: () => getUser(id),
    });

    const canManageAppAccess = currentUser?.role === 'owner' || currentUser?.role === 'admin';

    const { data: projectsData } = useQuery({
        queryKey: ['projects', 'user-detail-access'],
        queryFn: () => listProjects({ page_size: 100 }),
        enabled: canManageAppAccess,
    });

    const projects = useMemo(() => normalizeCollection(projectsData), [projectsData]);

    useEffect(() => {
        if (!canManageAppAccess) {
            return;
        }

        if (user?.project) {
            setSelectedProjectId(user.project);
            return;
        }

        if (!projects.length) {
            setSelectedProjectId('');
            return;
        }

        if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
            setSelectedProjectId(projects[0].id);
        }
    }, [canManageAppAccess, projects, selectedProjectId, user?.project]);

    const { data: projectRolesData, isLoading: projectRolesLoading } = useQuery({
        queryKey: ['projectRoles', selectedProjectId, 'user-detail-access'],
        queryFn: () => listProjectRoles(selectedProjectId, { page_size: 100 }),
        enabled: canManageAppAccess && Boolean(selectedProjectId),
    });

    const { data: projectAccess, isLoading: projectAccessLoading, isError: projectAccessError } = useQuery({
        queryKey: ['userProjectAccess', id, selectedProjectId],
        queryFn: () => getUserProjectAccess(selectedProjectId, id),
        enabled: canManageAppAccess && Boolean(selectedProjectId),
    });

    const projectRoles = useMemo(() => normalizeCollection(projectRolesData), [projectRolesData]);

    useEffect(() => {
        if (!projectAccess?.roles) {
            return;
        }

        setSelectedRoleIds(projectAccess.roles.map((role) => role.id));
    }, [projectAccess]);

    const roleMutation = useMutation({
        mutationFn: (role) => updateUserRole(id, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Role updated');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const appAccessMutation = useMutation({
        mutationFn: (roleIds) => replaceUserProjectRoles(selectedProjectId, id, { role_ids: roleIds }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['userProjectAccess', id, selectedProjectId] });
            setSelectedRoleIds((data.roles || []).map((role) => role.id));
            toast.success('App roles updated');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    function toggleProjectRole(roleId) {
        setSelectedRoleIds((current) =>
            current.includes(roleId) ? current.filter((value) => value !== roleId) : [...current, roleId]
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (isError || !user) {
        return (
            <div className="text-center py-20">
                <p className="text-text-secondary">User not found.</p>
                <Button variant="outline" onClick={() => navigate('/dashboard/users')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to users
                </Button>
            </div>
        );
    }

    const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;
    const assignedRoleIds = projectAccess?.roles?.map((role) => role.id) || [];
    const hasUnsavedProjectAccess = !arraysMatch(selectedRoleIds, assignedRoleIds);

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard/users')} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>

            <div className="bg-bg-secondary border border-border rounded-xl p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                            <h2 className="break-words text-xl font-bold text-text-primary">{user.full_name}</h2>
                            <p className="break-all text-sm text-text-secondary">{user.email}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                                    {ROLE_LABELS[user.role]}
                                </Badge>
                                <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                                {user.project_slug ? (
                                    <Badge variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
                                        {user.project_slug}
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 mt-8 pt-6 border-t border-border sm:grid-cols-2 md:grid-cols-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Member since</p>
                        <p className="text-sm text-text-primary">{formatDate(user.created_at, { hour: undefined, minute: undefined })}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Role</p>
                        <p className="text-sm text-text-primary">{user.role_display || ROLE_LABELS[user.role]}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Status</p>
                        <p className="text-sm text-text-primary">{user.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Test User</p>
                        <p className="text-sm text-text-primary">{user.is_test ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            </div>

            <RoleGate allowedRoles={['owner']}>
                {user.id !== currentUser?.id ? (
                    <div className="bg-bg-secondary border border-border rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="h-5 w-5 text-primary" />
                            <h3 className="text-base font-semibold text-text-primary">Manage org role</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {ROLE_OPTIONS.filter((role) => role.value !== 'owner').map((role) => (
                                <Button
                                    key={role.value}
                                    variant={user.role === role.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => roleMutation.mutate(role.value)}
                                    disabled={roleMutation.isPending || user.role === role.value}
                                >
                                    {role.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null}
            </RoleGate>

            {canManageAppAccess ? (
                <div className="bg-bg-secondary border border-border rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold text-text-primary">Manage app access</h3>
                    </div>
                    <p className="text-sm text-text-secondary">
                        This is separate from the organization role above. Project app roles are how an owner or admin grants runtime permissions like seller, buyer, teacher, or delivery.
                    </p>

                    <div className="mt-5 space-y-4">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Project</p>
                            <select
                                value={selectedProjectId}
                                onChange={(event) => setSelectedProjectId(event.target.value)}
                                disabled={Boolean(user.project) || projects.length === 0}
                                className={selectClassName}
                            >
                                {projects.length === 0 ? <option value="">No projects available</option> : null}
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            {user.project ? (
                                <p className="text-xs text-text-secondary">
                                    This user is project-scoped, so app roles can only be managed inside {user.project_slug || 'their assigned project'}.
                                </p>
                            ) : null}
                        </div>

                        {projectRolesLoading || projectAccessLoading ? (
                            <div className="flex justify-center py-10">
                                <LoadingSpinner />
                            </div>
                        ) : projectAccessError ? (
                            <div className="rounded-xl border border-dashed border-border bg-bg-primary p-4 text-sm text-text-secondary">
                                App access could not be loaded for the selected project.
                            </div>
                        ) : (
                            <>
                                <div className="rounded-xl border border-border bg-bg-primary p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-medium text-text-primary">
                                            {selectedProject?.name || 'Selected project'}
                                        </p>
                                        {selectedProject?.slug ? (
                                            <Badge variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
                                                {selectedProject.slug}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {projectAccess?.permissions?.length ? (
                                            projectAccess.permissions.map((permission) => (
                                                <Badge key={permission} variant="secondary" className="font-mono text-[11px] text-white">
                                                    {permission}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-text-secondary">No app permissions are active for this user in the selected project.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border bg-bg-primary p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Assigned app roles</p>
                                    {projectRoles.length === 0 ? (
                                        <div className="mt-3 rounded-xl border border-dashed border-border bg-bg-secondary p-4 text-sm text-text-secondary">
                                            No project roles exist yet for this project. Create them from Settings before assigning access here.
                                        </div>
                                    ) : (
                                        <div className="mt-4 space-y-3">
                                            {projectRoles.map((role) => {
                                                const checked = selectedRoleIds.includes(role.id);
                                                return (
                                                    <label
                                                        key={role.id}
                                                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                                                            checked
                                                                ? 'border-[#7c3aed]/60 bg-[#7c3aed]/10'
                                                                : 'border-border bg-bg-secondary hover:border-border-hover'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleProjectRole(role.id)}
                                                            className="mt-1 h-4 w-4 rounded border-border bg-bg-primary text-[#7c3aed] focus:ring-[#7c3aed]/40"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-sm font-medium text-text-primary">{role.name}</p>
                                                                <Badge variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
                                                                    {role.slug}
                                                                </Badge>
                                                                {role.is_default_signup ? <Badge variant="default">Default signup</Badge> : null}
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {role.permissions?.length ? (
                                                                    role.permissions.map((permission) => (
                                                                        <Badge key={permission.id} variant="secondary" className="font-mono text-[11px] text-white">
                                                                            {permission.slug}
                                                                        </Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-xs text-text-secondary">No permissions attached yet.</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    {hasUnsavedProjectAccess ? (
                                        <p className="text-xs text-text-secondary">You have unsaved app role changes for this project.</p>
                                    ) : null}
                                    <Button
                                        onClick={() => appAccessMutation.mutate(selectedRoleIds)}
                                        disabled={!selectedProjectId || !hasUnsavedProjectAccess || appAccessMutation.isPending}
                                    >
                                        {appAccessMutation.isPending ? 'Saving...' : 'Save app access'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
