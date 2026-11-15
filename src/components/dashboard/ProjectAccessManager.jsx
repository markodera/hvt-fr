import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, KeyRound, Pencil, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
    createProjectPermission,
    createProjectRole,
    deleteProjectPermission,
    deleteProjectRole,
    getCurrentProjectAccess,
    listAllProjectPermissions,
    listAllProjectRoles,
    updateProjectPermission,
    updateProjectRole,
} from '@/api/organizations';
import { projectPermissionSchema, projectRoleSchema } from '@/lib/schemas';
import { useSlugSync } from '@/hooks/useSlugSync';
import { getErrorMessage } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const selectClassName =
    'flex h-10 w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-600';

const searchInputClassName =
    'h-9 w-full rounded-lg border border-[#27272a] bg-[#18181b] pl-9 pr-3 text-sm text-white placeholder:text-[#52525b] outline-none transition-colors focus:border-zinc-500';

const iconButtonClassName =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#27272a] text-zinc-400 transition-colors hover:bg-[#111111] hover:text-white';

const LIST_PREVIEW_COUNT = 6;
const ACCESS_PREVIEW_COUNT = 12;

function matchesQuery(query, values) {
    const q = query.trim().toLowerCase();
    if (!q) {
        return true;
    }
    return values.some((value) => (value || '').toLowerCase().includes(q));
}

function normalizeCollection(data) {
    return data?.results ?? data ?? [];
}

function emptyPermissionValues() {
    return {
        slug: '',
        name: '',
        description: '',
    };
}

function emptyRoleValues() {
    return {
        slug: '',
        name: '',
        description: '',
        is_default_signup: false,
        is_self_assignable: false,
        permission_ids: [],
    };
}

export function ProjectAccessManager({ projects = [] }) {
    const queryClient = useQueryClient();
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [editingRole, setEditingRole] = useState(null);
    const [deletePermissionTarget, setDeletePermissionTarget] = useState(null);
    const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);
    const [permissionQuery, setPermissionQuery] = useState('');
    const [roleQuery, setRoleQuery] = useState('');
    const [showAllPermissions, setShowAllPermissions] = useState(false);
    const [showAllRoles, setShowAllRoles] = useState(false);
    const [showAllAccessPermissions, setShowAllAccessPermissions] = useState(false);
    const [expandedRoleId, setExpandedRoleId] = useState(null);
    const [dialogPermissionQuery, setDialogPermissionQuery] = useState('');

    const permissionForm = useForm({
        resolver: zodResolver(projectPermissionSchema),
        defaultValues: emptyPermissionValues(),
    });

    const roleForm = useForm({
        resolver: zodResolver(projectRoleSchema),
        defaultValues: emptyRoleValues(),
    });

    const {
        userEditedSlug: permissionUserEditedSlug,
        notifySlugEdited: notifyPermissionSlugEdited,
        resetSlugSync: resetPermissionSlugSync,
    } = useSlugSync(permissionForm.control, 'name', 'slug', permissionForm.setValue);
    const {
        userEditedSlug: roleUserEditedSlug,
        notifySlugEdited: notifyRoleSlugEdited,
        resetSlugSync: resetRoleSlugSync,
    } = useSlugSync(roleForm.control, 'name', 'slug', roleForm.setValue);

    useEffect(() => {
        if (!projects.length) {
            setSelectedProjectId('');
            return;
        }

        if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    const selectedProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId) || null,
        [projects, selectedProjectId]
    );

    const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
        queryKey: ['projectPermissions', selectedProjectId],
        queryFn: (context) => listAllProjectPermissions(selectedProjectId, context),
        enabled: Boolean(selectedProjectId),
    });

    const { data: rolesData, isLoading: rolesLoading } = useQuery({
        queryKey: ['projectRoles', selectedProjectId],
        queryFn: (context) => listAllProjectRoles(selectedProjectId, context),
        enabled: Boolean(selectedProjectId),
    });

    const { data: currentAccess, isLoading: accessLoading } = useQuery({
        queryKey: ['currentProjectAccess', selectedProjectId],
        queryFn: () => getCurrentProjectAccess(selectedProjectId),
        enabled: Boolean(selectedProjectId),
    });

    const permissions = normalizeCollection(permissionsData);
    const roles = normalizeCollection(rolesData);

    const filteredPermissions = useMemo(
        () => permissions.filter((permission) => matchesQuery(permissionQuery, [permission.name, permission.slug, permission.description])),
        [permissions, permissionQuery]
    );
    const filteredRoles = useMemo(
        () =>
            roles.filter((role) =>
                matchesQuery(roleQuery, [
                    role.name,
                    role.slug,
                    role.description,
                    ...(role.permissions || []).map((permission) => permission.slug),
                ])
            ),
        [roles, roleQuery]
    );
    const visiblePermissions =
        permissionQuery.trim() || showAllPermissions ? filteredPermissions : filteredPermissions.slice(0, LIST_PREVIEW_COUNT);
    const visibleRoles = roleQuery.trim() || showAllRoles ? filteredRoles : filteredRoles.slice(0, LIST_PREVIEW_COUNT);
    const dialogPermissions = useMemo(
        () => permissions.filter((permission) => matchesQuery(dialogPermissionQuery, [permission.name, permission.slug, permission.description])),
        [permissions, dialogPermissionQuery]
    );
    const accessPermissions = currentAccess?.permissions || [];
    const visibleAccessPermissions = showAllAccessPermissions
        ? accessPermissions
        : accessPermissions.slice(0, ACCESS_PREVIEW_COUNT);

    const selectedPermissionIds = roleForm.watch('permission_ids') || [];
    const permissionSlugField = permissionForm.register('slug');
    const roleSlugField = roleForm.register('slug');

    function invalidateProjectAccess() {
        queryClient.invalidateQueries({ queryKey: ['projectPermissions', selectedProjectId] });
        queryClient.invalidateQueries({ queryKey: ['projectRoles', selectedProjectId] });
        queryClient.invalidateQueries({ queryKey: ['currentProjectAccess', selectedProjectId] });
    }

    function closePermissionDialog() {
        setPermissionDialogOpen(false);
        setEditingPermission(null);
        permissionForm.reset(emptyPermissionValues());
        resetPermissionSlugSync();
    }

    function closeRoleDialog() {
        setRoleDialogOpen(false);
        setEditingRole(null);
        setDialogPermissionQuery('');
        roleForm.reset(emptyRoleValues());
        resetRoleSlugSync();
    }

    function openCreatePermissionDialog() {
        setEditingPermission(null);
        permissionForm.reset(emptyPermissionValues());
        resetPermissionSlugSync();
        setPermissionDialogOpen(true);
    }

    function openEditPermissionDialog(permission) {
        setEditingPermission(permission);
        permissionForm.reset({
            slug: permission.slug || '',
            name: permission.name || '',
            description: permission.description || '',
        });
        resetPermissionSlugSync();
        setPermissionDialogOpen(true);
    }

    function openCreateRoleDialog() {
        setEditingRole(null);
        setDialogPermissionQuery('');
        roleForm.reset(emptyRoleValues());
        resetRoleSlugSync();
        setRoleDialogOpen(true);
    }

    function openEditRoleDialog(role) {
        setEditingRole(role);
        setDialogPermissionQuery('');
        roleForm.reset({
            slug: role.slug || '',
            name: role.name || '',
            description: role.description || '',
            is_default_signup: Boolean(role.is_default_signup),
            is_self_assignable: Boolean(role.is_self_assignable),
            permission_ids: (role.permissions || []).map((permission) => permission.id),
        });
        resetRoleSlugSync();
        setRoleDialogOpen(true);
    }

    function toggleRolePermission(permissionId) {
        const nextIds = selectedPermissionIds.includes(permissionId)
            ? selectedPermissionIds.filter((value) => value !== permissionId)
            : [...selectedPermissionIds, permissionId];

        roleForm.setValue('permission_ids', nextIds, {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    const createPermissionMutation = useMutation({
        mutationFn: (values) => createProjectPermission(selectedProjectId, values),
        onSuccess: () => {
            invalidateProjectAccess();
            toast.success('Project permission created');
            closePermissionDialog();
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const updatePermissionMutation = useMutation({
        mutationFn: ({ permissionId, values }) => updateProjectPermission(selectedProjectId, permissionId, values),
        onSuccess: () => {
            invalidateProjectAccess();
            toast.success('Project permission updated');
            closePermissionDialog();
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const deletePermissionMutation = useMutation({
        mutationFn: (permissionId) => deleteProjectPermission(selectedProjectId, permissionId),
        onSuccess: () => {
            invalidateProjectAccess();
            setDeletePermissionTarget(null);
            toast.success('Project permission deleted');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const createRoleMutation = useMutation({
        mutationFn: (values) => createProjectRole(selectedProjectId, values),
        onSuccess: () => {
            invalidateProjectAccess();
            toast.success('Project role created');
            closeRoleDialog();
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ roleId, values }) => updateProjectRole(selectedProjectId, roleId, values),
        onSuccess: () => {
            invalidateProjectAccess();
            toast.success('Project role updated');
            closeRoleDialog();
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const deleteRoleMutation = useMutation({
        mutationFn: (roleId) => deleteProjectRole(selectedProjectId, roleId),
        onSuccess: () => {
            invalidateProjectAccess();
            setDeleteRoleTarget(null);
            toast.success('Project role deleted');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    function submitPermission(values) {
        const payload = {
            ...values,
            description: values.description?.trim() || '',
        };

        if (editingPermission) {
            updatePermissionMutation.mutate({ permissionId: editingPermission.id, values: payload });
            return;
        }

        createPermissionMutation.mutate(payload);
    }

    function submitRole(values) {
        const payload = {
            ...values,
            description: values.description?.trim() || '',
            permission_ids: values.permission_ids || [],
            is_default_signup: Boolean(values.is_default_signup),
            is_self_assignable: Boolean(values.is_self_assignable),
        };

        if (editingRole) {
            updateRoleMutation.mutate({ roleId: editingRole.id, values: payload });
            return;
        }

        createRoleMutation.mutate(payload);
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-[#27272a] bg-[#111111] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-white">Project boundary</p>
                        <p className="mt-1 text-sm text-[#71717a]">
                            Choose the project whose app permissions and roles you want to manage.
                        </p>
                    </div>
                    <div className="w-full lg:w-[320px]">
                        <select
                            value={selectedProjectId}
                            onChange={(event) => {
                                setSelectedProjectId(event.target.value);
                                setPermissionQuery('');
                                setRoleQuery('');
                                setShowAllPermissions(false);
                                setShowAllRoles(false);
                                setShowAllAccessPermissions(false);
                                setExpandedRoleId(null);
                            }}
                            className={selectClassName}
                            disabled={projects.length === 0}
                        >
                            {projects.length === 0 ? <option value="">No projects available</option> : null}
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {selectedProject ? (
                    <p className="mt-3 font-mono text-xs text-zinc-300">{selectedProject.slug}</p>
                ) : null}
            </div>

            <div className="rounded-2xl border border-[#27272a] bg-[#111111] p-5">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-zinc-300" />
                    <h3 className="text-base font-semibold text-white">Your current project access</h3>
                </div>
                <p className="mt-1 text-sm text-[#71717a]">
                    This is the effective role bundle and permission set attached to your dashboard account for the selected project.
                </p>
                {accessLoading ? (
                    <div className="mt-4 flex justify-center py-6">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4 sm:p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Roles</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {currentAccess?.roles?.length ? (
                                    currentAccess.roles.map((role) => (
                                        <Badge key={role.id} variant="secondary" className="bg-[#18181b] text-white">
                                            {role.name || role.slug}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-[#71717a]">No app roles are assigned to your dashboard account in this project.</p>
                                )}
                            </div>
                        </div>
                        <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4 sm:p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Permissions</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {accessPermissions.length ? (
                                    <>
                                        {visibleAccessPermissions.map((permission) => (
                                            <Badge key={permission} variant="secondary" className="font-mono text-[11px] text-zinc-300">
                                                {permission}
                                            </Badge>
                                        ))}
                                        {accessPermissions.length > ACCESS_PREVIEW_COUNT ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowAllAccessPermissions((value) => !value)}
                                                className="rounded-full border border-[#27272a] px-2 py-0.5 text-[11px] text-[#a1a1aa] transition-colors hover:border-[#3f3f46] hover:text-white"
                                            >
                                                {showAllAccessPermissions
                                                    ? 'Show less'
                                                    : `+${accessPermissions.length - ACCESS_PREVIEW_COUNT} more`}
                                            </button>
                                        ) : null}
                                    </>
                                ) : (
                                    <p className="text-sm text-[#71717a]">No app permissions are active for your dashboard account in this project.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-[#27272a] bg-[#111111] p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-zinc-300" />
                                <h3 className="text-base font-semibold text-white">Project permissions</h3>
                            </div>
                            <p className="mt-1 text-sm text-[#71717a]">
                                Create fine-grained permission slugs like <span className="font-mono text-zinc-300">orders.read.own</span> or <span className="font-mono text-zinc-300">classes.grade</span>.
                            </p>
                        </div>
                        <Button onClick={openCreatePermissionDialog} className="w-full bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] shadow-sm shadow-[#7c3aed]/25 transition sm:w-auto">
                            Add permission
                        </Button>
                    </div>

                    {permissionsLoading ? (
                        <div className="mt-6 flex justify-center py-10">
                            <LoadingSpinner />
                        </div>
                    ) : permissions.length === 0 ? (
                        <div className="mt-6 rounded-xl border border-dashed border-[#27272a] bg-[#18181b] p-4 text-sm text-[#71717a]">
                            No dynamic app permissions have been defined for this project yet.
                        </div>
                    ) : (
                        <div className="mt-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
                                <input
                                    type="search"
                                    value={permissionQuery}
                                    onChange={(event) => setPermissionQuery(event.target.value)}
                                    placeholder={`Search ${permissions.length} permissions...`}
                                    aria-label="Search project permissions"
                                    className={searchInputClassName}
                                />
                            </div>
                            {filteredPermissions.length === 0 ? (
                                <div className="mt-3 rounded-xl border border-dashed border-[#27272a] bg-[#18181b] p-4 text-sm text-[#71717a]">
                                    No permissions match “{permissionQuery.trim()}”.
                                </div>
                            ) : (
                                <div className="mt-3 space-y-2">
                                    {visiblePermissions.map((permission) => (
                                        <div
                                            key={permission.id}
                                            className="flex items-center gap-3 rounded-xl border border-[#27272a] bg-[#18181b] px-4 py-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-medium text-white">{permission.name}</p>
                                                    <Badge variant="secondary" className="font-mono text-[11px] text-zinc-300">
                                                        {permission.slug}
                                                    </Badge>
                                                </div>
                                                {permission.description ? (
                                                    <p className="mt-0.5 truncate text-xs text-[#71717a]">{permission.description}</p>
                                                ) : null}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openEditPermissionDialog(permission)}
                                                aria-label={`Edit ${permission.name}`}
                                                className={iconButtonClassName}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletePermissionTarget(permission)}
                                                aria-label={`Delete ${permission.name}`}
                                                className={`${iconButtonClassName} hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {!permissionQuery.trim() && filteredPermissions.length > LIST_PREVIEW_COUNT ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllPermissions((value) => !value)}
                                            className="w-full rounded-xl border border-dashed border-[#27272a] px-4 py-2.5 text-xs font-medium text-[#a1a1aa] transition-colors hover:border-[#3f3f46] hover:text-white"
                                        >
                                            {showAllPermissions
                                                ? 'Show less'
                                                : `Show all ${filteredPermissions.length} permissions`}
                                        </button>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-[#27272a] bg-[#111111] p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-zinc-300" />
                                <h3 className="text-base font-semibold text-white">Project roles</h3>
                            </div>
                            <p className="mt-1 text-sm text-[#71717a]">
                                Bundle permissions into reusable roles developers can assign to buyers, sellers, teachers, students, or any other app model.
                            </p>
                        </div>
                        <Button onClick={openCreateRoleDialog} className="w-full bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] shadow-sm shadow-[#7c3aed]/25 transition sm:w-auto">
                            Add role
                        </Button>
                    </div>
                    {rolesLoading ? (
                        <div className="mt-6 flex justify-center py-10">
                            <LoadingSpinner />
                        </div>
                    ) : roles.length === 0 ? (
                        <div className="mt-6 rounded-xl border border-dashed border-[#27272a] bg-[#18181b] p-4 text-sm text-[#71717a]">
                            No app roles have been defined for this project yet.
                        </div>
                    ) : (
                        <div className="mt-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
                                <input
                                    type="search"
                                    value={roleQuery}
                                    onChange={(event) => setRoleQuery(event.target.value)}
                                    placeholder={`Search ${roles.length} roles...`}
                                    aria-label="Search project roles"
                                    className={searchInputClassName}
                                />
                            </div>
                            {filteredRoles.length === 0 ? (
                                <div className="mt-3 rounded-xl border border-dashed border-[#27272a] bg-[#18181b] p-4 text-sm text-[#71717a]">
                                    No roles match “{roleQuery.trim()}”.
                                </div>
                            ) : (
                                <div className="mt-3 space-y-2">
                                    {visibleRoles.map((role) => {
                                        const expanded = expandedRoleId === role.id;
                                        const rolePermissions = role.permissions || [];
                                        return (
                                            <div key={role.id} className="rounded-xl border border-[#27272a] bg-[#18181b] px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="truncate text-sm font-medium text-white">{role.name}</p>
                                                            <Badge variant="secondary" className="font-mono text-[11px] text-zinc-300">
                                                                {role.slug}
                                                            </Badge>
                                                            {role.is_default_signup ? (
                                                                <Badge variant="default">Default signup</Badge>
                                                            ) : null}
                                                            {role.is_self_assignable ? (
                                                                <Badge variant="secondary" className="text-white">
                                                                    Self-assignable
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        {role.description ? (
                                                            <p className="mt-0.5 truncate text-xs text-[#71717a]">{role.description}</p>
                                                        ) : null}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditRoleDialog(role)}
                                                        aria-label={`Edit ${role.name}`}
                                                        className={iconButtonClassName}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteRoleTarget(role)}
                                                        aria-label={`Delete ${role.name}`}
                                                        className={`${iconButtonClassName} hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                {rolePermissions.length ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedRoleId(expanded ? null : role.id)}
                                                            aria-expanded={expanded}
                                                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#71717a] transition-colors hover:text-white"
                                                        >
                                                            <ChevronDown
                                                                className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                                                            />
                                                            {rolePermissions.length} permission{rolePermissions.length === 1 ? '' : 's'}
                                                        </button>
                                                        {expanded ? (
                                                            <div className="mt-2 flex flex-wrap gap-2 border-t border-[#27272a] pt-2">
                                                                {rolePermissions.map((permission) => (
                                                                    <Badge
                                                                        key={permission.id}
                                                                        variant="secondary"
                                                                        className="font-mono text-[11px] text-white"
                                                                    >
                                                                        {permission.slug}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </>
                                                ) : (
                                                    <p className="mt-2 text-xs text-[#71717a]">No permissions attached yet.</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {!roleQuery.trim() && filteredRoles.length > LIST_PREVIEW_COUNT ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllRoles((value) => !value)}
                                            className="w-full rounded-xl border border-dashed border-[#27272a] px-4 py-2.5 text-xs font-medium text-[#a1a1aa] transition-colors hover:border-[#3f3f46] hover:text-white"
                                        >
                                            {showAllRoles ? 'Show less' : `Show all ${filteredRoles.length} roles`}
                                        </button>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            <Dialog open={permissionDialogOpen} onOpenChange={(open) => (!open ? closePermissionDialog() : setPermissionDialogOpen(true))}>
                <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain max-w-xl border-[#27272a] bg-[#111111] !p-4 text-white sm:w-full sm:!p-6">
                    <DialogHeader>
                        <DialogTitle>{editingPermission ? 'Edit project permission' : 'Create project permission'}</DialogTitle>
                        <DialogDescription className="text-[#71717a]">
                            Define a stable permission slug that application code can check in the app.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={permissionForm.handleSubmit(submitPermission)} className="space-y-4 pt-4 sm:pt-5">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Permission slug</Label>
                            <Input
                                {...permissionSlugField}
                                onChange={(event) => {
                                    permissionUserEditedSlug.current = true;
                                    notifyPermissionSlugEdited();
                                    permissionSlugField.onChange(event);
                                }}
                                placeholder="orders.read.own"
                                className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-zinc-500 focus:ring-zinc-500/40/25"
                            />
                            {permissionForm.formState.errors.slug ? (
                                <p className="text-xs text-danger">{permissionForm.formState.errors.slug.message}</p>
                            ) : null}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Display name</Label>
                            <Input
                                {...permissionForm.register('name')}
                                placeholder="Read own orders"
                                className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-zinc-500 focus:ring-zinc-500/40/25"
                            />
                            {permissionForm.formState.errors.name ? (
                                <p className="text-xs text-danger">{permissionForm.formState.errors.name.message}</p>
                            ) : null}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Description</Label>
                            <textarea
                                {...permissionForm.register('description')}
                                rows={4}
                                placeholder="Describe what this permission allows in the customer app."
                                className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3 py-3 text-sm text-white outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-600"
                            />
                            {permissionForm.formState.errors.description ? (
                                <p className="text-xs text-danger">{permissionForm.formState.errors.description.message}</p>
                            ) : null}
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closePermissionDialog}
                                className="w-full border-[#27272a] bg-transparent text-white hover:bg-[#18181b] sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createPermissionMutation.isPending || updatePermissionMutation.isPending}
                                className="w-full bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] shadow-sm shadow-[#7c3aed]/25 transition sm:w-auto"
                            >
                                {editingPermission
                                    ? updatePermissionMutation.isPending
                                        ? 'Saving...'
                                        : 'Save permission'
                                    : createPermissionMutation.isPending
                                        ? 'Creating...'
                                        : 'Create permission'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={roleDialogOpen} onOpenChange={(open) => (!open ? closeRoleDialog() : setRoleDialogOpen(true))}>
                <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain max-w-2xl border-[#27272a] bg-[#111111] !p-4 text-white sm:w-full sm:!p-6">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? 'Edit project role' : 'Create project role'}</DialogTitle>
                        <DialogDescription className="text-[#71717a]">
                            Roles are just permission bundles. Keep the role names customer-defined and the permission slugs stable.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={roleForm.handleSubmit(submitRole)} className="space-y-4 pt-4 sm:pt-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Role slug</Label>
                                <Input
                                    {...roleSlugField}
                                    onChange={(event) => {
                                        roleUserEditedSlug.current = true;
                                        notifyRoleSlugEdited();
                                        roleSlugField.onChange(event);
                                    }}
                                    placeholder="seller"
                                    className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-zinc-500 focus:ring-zinc-500/40/25"
                                />
                                {roleForm.formState.errors.slug ? (
                                    <p className="text-xs text-danger">{roleForm.formState.errors.slug.message}</p>
                                ) : null}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Display name</Label>
                                <Input
                                    {...roleForm.register('name')}
                                    placeholder="Seller"
                                    className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-zinc-500 focus:ring-zinc-500/40/25"
                                />
                                {roleForm.formState.errors.name ? (
                                    <p className="text-xs text-danger">{roleForm.formState.errors.name.message}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Description</Label>
                            <textarea
                                {...roleForm.register('description')}
                                rows={4}
                                placeholder="Describe who should receive this role in the customer app."
                                className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3 py-3 text-sm text-white outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-600"
                            />
                            {roleForm.formState.errors.description ? (
                                <p className="text-xs text-danger">{roleForm.formState.errors.description.message}</p>
                            ) : null}
                        </div>

                        <label className="flex items-start gap-3 rounded-xl border border-[#27272a] bg-[#18181b] px-4 py-3">
                            <input
                                type="checkbox"
                                checked={Boolean(roleForm.watch('is_default_signup'))}
                                onChange={(event) =>
                                    roleForm.setValue('is_default_signup', event.target.checked, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                                className="mt-1 h-4 w-4 rounded border-[#3f3f46] bg-[#111111] text-zinc-100 accent-zinc-200 focus:ring-zinc-400/30"
                            />
                            <div>
                                <p className="text-sm font-medium text-white">Assign on public signup</p>
                                <p className="text-sm text-[#71717a]">
                                    Enable this when app users signing up through this project should receive the role automatically.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 rounded-xl border border-[#27272a] bg-[#18181b] px-4 py-3">
                            <input
                                type="checkbox"
                                checked={Boolean(roleForm.watch('is_self_assignable'))}
                                onChange={(event) =>
                                    roleForm.setValue('is_self_assignable', event.target.checked, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                                className="mt-1 h-4 w-4 rounded border-[#3f3f46] bg-[#111111] text-zinc-100 accent-zinc-200 focus:ring-zinc-400/30"
                            />
                            <div>
                                <p className="text-sm font-medium text-white">Allow self-assignment at signup</p>
                                <p className="text-sm text-[#71717a]">
                                    When enabled, app users can request this role by passing its slug at registration. Only enable this for roles that are safe for any user to claim without admin approval.
                                </p>
                            </div>
                        </label>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                Permissions in this role ({selectedPermissionIds.length} selected)
                            </Label>
                            {permissions.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#27272a] bg-[#18181b] p-4 text-sm text-[#71717a]">
                                    Create project permissions first, then attach them to this role.
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
                                        <input
                                            type="search"
                                            value={dialogPermissionQuery}
                                            onChange={(event) => setDialogPermissionQuery(event.target.value)}
                                            placeholder="Filter permissions..."
                                            aria-label="Filter permissions in this role"
                                            className={searchInputClassName}
                                        />
                                    </div>
                                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[#27272a] bg-[#18181b] p-3">
                                        {dialogPermissions.length === 0 ? (
                                            <p className="px-3 py-2 text-sm text-[#71717a]">
                                                No permissions match “{dialogPermissionQuery.trim()}”.
                                            </p>
                                        ) : null}
                                        {dialogPermissions.map((permission) => {
                                        const checked = selectedPermissionIds.includes(permission.id);
                                        return (
                                            <label
                                                key={permission.id}
                                                className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-[#27272a] hover:bg-[#111111]"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleRolePermission(permission.id)}
                                                    className="mt-1 h-4 w-4 rounded border-[#3f3f46] bg-[#111111] text-zinc-100 accent-zinc-200 focus:ring-zinc-400/30"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-medium text-white">{permission.name}</p>
                                                        <Badge variant="secondary" className="font-mono text-[11px] text-zinc-300">
                                                            {permission.slug}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 text-xs text-[#71717a]">
                                                        {permission.description || 'No description yet.'}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                    </div>
                                </>
                            )}
                            {roleForm.formState.errors.permission_ids ? (
                                <p className="text-xs text-danger">{roleForm.formState.errors.permission_ids.message}</p>
                            ) : null}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeRoleDialog}
                                className="w-full border-[#27272a] bg-transparent text-white hover:bg-[#18181b] sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                                className="w-full bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] shadow-sm shadow-[#7c3aed]/25 transition sm:w-auto"
                            >
                                {editingRole
                                    ? updateRoleMutation.isPending
                                        ? 'Saving...'
                                        : 'Save role'
                                    : createRoleMutation.isPending
                                        ? 'Creating...'
                                        : 'Create role'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deletePermissionTarget}
                onOpenChange={() => setDeletePermissionTarget(null)}
                title="Delete project permission"
                description={`Delete ${deletePermissionTarget?.name || 'this permission'}? Remove it from roles first if the backend says it is still attached.`}
                confirmLabel="Delete permission"
                onConfirm={() => deletePermissionMutation.mutate(deletePermissionTarget.id)}
                isLoading={deletePermissionMutation.isPending}
            />

            <ConfirmDialog
                open={!!deleteRoleTarget}
                onOpenChange={() => setDeleteRoleTarget(null)}
                title="Delete project role"
                description={`Delete ${deleteRoleTarget?.name || 'this role'}? Remove it from users or pending invitations first if the backend blocks it.`}
                confirmLabel="Delete role"
                onConfirm={() => deleteRoleMutation.mutate(deleteRoleTarget.id)}
                isLoading={deleteRoleMutation.isPending}
            />
        </div>
    );
}
