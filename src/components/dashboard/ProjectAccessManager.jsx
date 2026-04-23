import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
    createProjectPermission,
    createProjectRole,
    deleteProjectPermission,
    deleteProjectRole,
    getCurrentProjectAccess,
    listProjectPermissions,
    listProjectRoles,
    updateProjectPermission,
    updateProjectRole,
} from '@/api/organizations';
import { projectPermissionSchema, projectRoleSchema } from '@/lib/schemas';
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
    'flex h-10 w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/25';

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

    const permissionForm = useForm({
        resolver: zodResolver(projectPermissionSchema),
        defaultValues: emptyPermissionValues(),
    });

    const roleForm = useForm({
        resolver: zodResolver(projectRoleSchema),
        defaultValues: emptyRoleValues(),
    });

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
        queryFn: () => listProjectPermissions(selectedProjectId, { page_size: 100 }),
        enabled: Boolean(selectedProjectId),
    });

    const { data: rolesData, isLoading: rolesLoading } = useQuery({
        queryKey: ['projectRoles', selectedProjectId],
        queryFn: () => listProjectRoles(selectedProjectId, { page_size: 100 }),
        enabled: Boolean(selectedProjectId),
    });

    const { data: currentAccess, isLoading: accessLoading } = useQuery({
        queryKey: ['currentProjectAccess', selectedProjectId],
        queryFn: () => getCurrentProjectAccess(selectedProjectId),
        enabled: Boolean(selectedProjectId),
    });

    const permissions = normalizeCollection(permissionsData);
    const roles = normalizeCollection(rolesData);
    const selectedPermissionIds = roleForm.watch('permission_ids') || [];

    function invalidateProjectAccess() {
        queryClient.invalidateQueries({ queryKey: ['projectPermissions', selectedProjectId] });
        queryClient.invalidateQueries({ queryKey: ['projectRoles', selectedProjectId] });
        queryClient.invalidateQueries({ queryKey: ['currentProjectAccess', selectedProjectId] });
    }

    function closePermissionDialog() {
        setPermissionDialogOpen(false);
        setEditingPermission(null);
        permissionForm.reset(emptyPermissionValues());
    }

    function closeRoleDialog() {
        setRoleDialogOpen(false);
        setEditingRole(null);
        roleForm.reset(emptyRoleValues());
    }

    function openCreatePermissionDialog() {
        setEditingPermission(null);
        permissionForm.reset(emptyPermissionValues());
        setPermissionDialogOpen(true);
    }

    function openEditPermissionDialog(permission) {
        setEditingPermission(permission);
        permissionForm.reset({
            slug: permission.slug || '',
            name: permission.name || '',
            description: permission.description || '',
        });
        setPermissionDialogOpen(true);
    }

    function openCreateRoleDialog() {
        setEditingRole(null);
        roleForm.reset(emptyRoleValues());
        setRoleDialogOpen(true);
    }

    function openEditRoleDialog(role) {
        setEditingRole(role);
        roleForm.reset({
            slug: role.slug || '',
            name: role.name || '',
            description: role.description || '',
            is_default_signup: Boolean(role.is_default_signup),
            is_self_assignable: Boolean(role.is_self_assignable),
            permission_ids: (role.permissions || []).map((permission) => permission.id),
        });
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
                            onChange={(event) => setSelectedProjectId(event.target.value)}
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
                    <p className="mt-3 font-mono text-xs text-[#a78bfa]">{selectedProject.slug}</p>
                ) : null}
            </div>

            <div className="rounded-2xl border border-[#27272a] bg-[#111111] p-5">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#a78bfa]" />
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
                            <div className="mt-3 flex flex-wrap gap-2">
                                {currentAccess?.permissions?.length ? (
                                    currentAccess.permissions.map((permission) => (
                                        <Badge key={permission} variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
                                            {permission}
                                        </Badge>
                                    ))
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
                                <KeyRound className="h-5 w-5 text-[#a78bfa]" />
                                <h3 className="text-base font-semibold text-white">Project permissions</h3>
                            </div>
                            <p className="mt-1 text-sm text-[#71717a]">
                                Create fine-grained permission slugs like <span className="font-mono text-[#c4b5fd]">orders.read.own</span> or <span className="font-mono text-[#c4b5fd]">classes.grade</span>.
                            </p>
                        </div>
                        <Button onClick={openCreatePermissionDialog} className="w-full bg-[#7c3aed] text-white hover:bg-[#6d28d9] sm:w-auto">
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
                        <div className="mt-6 space-y-3">
                            {permissions.map((permission) => (
                                <div key={permission.id} className="rounded-xl border border-[#27272a] bg-[#18181b] p-4 sm:p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium text-white">{permission.name}</p>
                                                <Badge variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
                                                    {permission.slug}
                                                </Badge>
                                            </div>
                                            <p className="mt-2 text-sm text-[#a1a1aa]">
                                                {permission.description || 'No description yet.'}
                                            </p>
                                        </div>
                                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditPermissionDialog(permission)}
                                                className="w-full border-[#27272a] bg-transparent text-white hover:bg-[#111111] sm:w-auto"
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setDeletePermissionTarget(permission)}
                                                className="w-full sm:w-auto"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-[#27272a] bg-[#111111] p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[#a78bfa]" />
                                <h3 className="text-base font-semibold text-white">Project roles</h3>
                            </div>
                            <p className="mt-1 text-sm text-[#71717a]">
                                Bundle permissions into reusable roles developers can assign to buyers, sellers, teachers, students, or any other app model.
                            </p>
                        </div>
                        <Button onClick={openCreateRoleDialog} className="w-full bg-[#7c3aed] text-white hover:bg-[#6d28d9] sm:w-auto">
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
                        <div className="mt-6 space-y-3">
                            {roles.map((role) => (
                                <div key={role.id} className="rounded-xl border border-[#27272a] bg-[#18181b] p-4 sm:p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium text-white">{role.name}</p>
                                                <Badge variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
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
                                            <p className="mt-2 text-sm text-[#a1a1aa]">
                                                {role.description || 'No description yet.'}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {role.permissions?.length ? (
                                                    role.permissions.map((permission) => (
                                                        <Badge key={permission.id} variant="secondary" className="font-mono text-[11px] text-white">
                                                            {permission.slug}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-[#71717a]">No permissions attached yet.</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditRoleDialog(role)}
                                                className="w-full border-[#27272a] bg-transparent text-white hover:bg-[#111111] sm:w-auto"
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setDeleteRoleTarget(role)}
                                                className="w-full sm:w-auto"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                {...permissionForm.register('slug')}
                                placeholder="orders.read.own"
                                className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
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
                                className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
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
                                className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3 py-3 text-sm text-white outline-none transition-colors focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/25"
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
                                className="w-full bg-[#7c3aed] text-white hover:bg-[#6d28d9] sm:w-auto"
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
                                    {...roleForm.register('slug')}
                                    placeholder="seller"
                                    className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
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
                                    className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
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
                                className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3 py-3 text-sm text-white outline-none transition-colors focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/25"
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
                                className="mt-1 h-4 w-4 rounded border-[#3f3f46] bg-[#111111] text-[#7c3aed] focus:ring-[#7c3aed]/40"
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
                                className="mt-1 h-4 w-4 rounded border-[#3f3f46] bg-[#111111] text-[#7c3aed] focus:ring-[#7c3aed]/40"
                            />
                            <div>
                                <p className="text-sm font-medium text-white">Allow self-assignment at signup</p>
                                <p className="text-sm text-[#71717a]">
                                    When enabled, app users can request this role by passing its slug at registration. Only enable this for roles that are safe for any user to claim without admin approval.
                                </p>
                            </div>
                        </label>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Permissions in this role</Label>
                            {permissions.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#27272a] bg-[#18181b] p-4 text-sm text-[#71717a]">
                                    Create project permissions first, then attach them to this role.
                                </div>
                            ) : (
                                <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[#27272a] bg-[#18181b] p-3">
                                    {permissions.map((permission) => {
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
                                                    className="mt-1 h-4 w-4 rounded border-[#3f3f46] bg-[#111111] text-[#7c3aed] focus:ring-[#7c3aed]/40"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-medium text-white">{permission.name}</p>
                                                        <Badge variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
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
                                className="w-full bg-[#7c3aed] text-white hover:bg-[#6d28d9] sm:w-auto"
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
