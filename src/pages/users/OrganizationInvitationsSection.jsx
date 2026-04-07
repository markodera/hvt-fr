import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MailPlus, RefreshCw, ShieldPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
    createOrganizationInvitation,
    listOrganizationInvitations,
    listProjectRoles,
    listProjects,
    resendOrganizationInvitation,
    revokeOrganizationInvitation,
} from '@/api/organizations';
import { organizationInvitationCreateSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/CopyButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatDate, getErrorMessage } from '@/lib/utils';

const selectClassName =
    'flex h-10 w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/25';

function badgeVariantForStatus(status) {
    if (status === 'accepted') return 'success';
    if (status === 'revoked' || status === 'expired') return 'warning';
    return 'secondary';
}

function normalizeCollection(data) {
    return data?.results ?? data ?? [];
}

export function OrganizationInvitationsSection() {
    const queryClient = useQueryClient();
    const [revokeTarget, setRevokeTarget] = useState(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['organizationInvitations'],
        queryFn: () => listOrganizationInvitations({ page_size: 50 }),
    });

    const { data: projectsData } = useQuery({
        queryKey: ['projects', 'invite-form'],
        queryFn: () => listProjects({ page_size: 100 }),
    });

    const form = useForm({
        resolver: zodResolver(organizationInvitationCreateSchema),
        defaultValues: {
            email: '',
            role: 'member',
            project_id: null,
            app_role_ids: [],
        },
    });

    const invitations = normalizeCollection(data);
    const projects = normalizeCollection(projectsData);
    const selectedProjectId = form.watch('project_id') || null;
    const selectedAppRoleIds = form.watch('app_role_ids') || [];

    const { data: projectRolesData, isLoading: projectRolesLoading } = useQuery({
        queryKey: ['projectRoles', selectedProjectId, 'invite-form'],
        queryFn: () => listProjectRoles(selectedProjectId, { page_size: 100 }),
        enabled: Boolean(selectedProjectId),
    });

    const projectRoles = useMemo(() => normalizeCollection(projectRolesData), [projectRolesData]);

    useEffect(() => {
        if (!selectedProjectId) {
            if (selectedAppRoleIds.length) {
                form.setValue('app_role_ids', [], { shouldDirty: true, shouldValidate: true });
            }
            return;
        }

        const validRoleIds = new Set(projectRoles.map((role) => role.id));
        const filteredRoleIds = selectedAppRoleIds.filter((roleId) => validRoleIds.has(roleId));

        if (filteredRoleIds.length !== selectedAppRoleIds.length) {
            form.setValue('app_role_ids', filteredRoleIds, {
                shouldDirty: true,
                shouldValidate: true,
            });
        }
    }, [form, projectRoles, selectedAppRoleIds, selectedProjectId]);

    function invalidateInvitations() {
        queryClient.invalidateQueries({ queryKey: ['organizationInvitations'] });
    }

    function toggleAppRole(roleId) {
        const nextIds = selectedAppRoleIds.includes(roleId)
            ? selectedAppRoleIds.filter((value) => value !== roleId)
            : [...selectedAppRoleIds, roleId];

        form.setValue('app_role_ids', nextIds, {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    const createInvitationMutation = useMutation({
        mutationFn: createOrganizationInvitation,
        onSuccess: () => {
            invalidateInvitations();
            form.reset({
                email: '',
                role: 'member',
                project_id: null,
                app_role_ids: [],
            });
            toast.success('Invitation sent');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const resendInvitationMutation = useMutation({
        mutationFn: resendOrganizationInvitation,
        onSuccess: () => {
            invalidateInvitations();
            toast.success('Invitation email resent');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    const revokeInvitationMutation = useMutation({
        mutationFn: revokeOrganizationInvitation,
        onSuccess: () => {
            invalidateInvitations();
            setRevokeTarget(null);
            toast.success('Invitation revoked');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    function handleSubmit(values) {
        createInvitationMutation.mutate({
            email: values.email,
            role: values.role,
            project_id: values.project_id || undefined,
            app_role_ids: values.app_role_ids || [],
        });
    }

    return (
        <>
            <div className="space-y-6 rounded-xl border border-[#27272a] bg-[#111111] p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <ShieldPlus className="h-5 w-5 text-[#a78bfa]" />
                            <h2 className="text-lg font-bold text-white">Invitations</h2>
                        </div>
                        <p className="mt-1 text-sm text-[#a1a1aa]">
                            Invite admins or members into this organization, and optionally pre-assign project app roles for the developer or operator you are onboarding.
                        </p>
                    </div>
                    <Badge variant="secondary">{invitations.length} total</Badge>
                </div>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 rounded-xl border border-[#27272a] bg-[#111111] p-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_220px_auto]">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                Invite by email
                            </Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="teammate@example.com"
                                className="border-[#27272a] bg-[#18181b] text-white placeholder:text-[#71717a]"
                                {...form.register('email')}
                            />
                            {form.formState.errors.email ? (
                                <p className="text-xs text-danger">{form.formState.errors.email.message}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-role" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                Org role
                            </Label>
                            <select id="invite-role" className={selectClassName} {...form.register('role')}>
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                            {form.formState.errors.role ? (
                                <p className="text-xs text-danger">{form.formState.errors.role.message}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-project" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                Project
                            </Label>
                            <select
                                id="invite-project"
                                value={selectedProjectId || ''}
                                onChange={(event) =>
                                    form.setValue('project_id', event.target.value || null, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                                className={selectClassName}
                            >
                                <option value="">No project selected</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            {form.formState.errors.project_id ? (
                                <p className="text-xs text-danger">{form.formState.errors.project_id.message}</p>
                            ) : null}
                        </div>

                        <div className="flex items-end">
                            <Button
                                type="submit"
                                className="w-full bg-[#7c3aed] text-white hover:bg-[#6d28d9] md:w-auto"
                                disabled={createInvitationMutation.isPending}
                            >
                                <MailPlus className="mr-2 h-4 w-4" />
                                {createInvitationMutation.isPending ? 'Sending...' : 'Send invite'}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">Project app roles</p>
                                <p className="text-sm text-[#71717a]">
                                    These roles drive the invitee&apos;s effective app permissions. Leave this empty if you only need the control-plane org role.
                                </p>
                            </div>
                            {selectedProjectId ? (
                                <span className="font-mono text-xs text-[#a78bfa]">
                                    {projects.find((project) => project.id === selectedProjectId)?.slug || 'project'}
                                </span>
                            ) : null}
                        </div>

                        {!selectedProjectId ? (
                            <p className="mt-4 text-sm text-[#71717a]">Select a project above before choosing app roles.</p>
                        ) : projectRolesLoading ? (
                            <div className="mt-4 flex justify-center py-6">
                                <LoadingSpinner size="sm" />
                            </div>
                        ) : projectRoles.length === 0 ? (
                            <div className="mt-4 rounded-xl border border-dashed border-[#27272a] bg-[#111111] p-4 text-sm text-[#71717a]">
                                No app roles exist for this project yet. Create them from Settings before sending a scoped invite.
                            </div>
                        ) : (
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {projectRoles.map((role) => {
                                    const checked = selectedAppRoleIds.includes(role.id);
                                    return (
                                        <label
                                            key={role.id}
                                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                                                checked
                                                    ? 'border-[#7c3aed]/60 bg-[#7c3aed]/10'
                                                    : 'border-[#27272a] bg-[#111111] hover:border-[#3f3f46]'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleAppRole(role.id)}
                                                className="mt-1 h-4 w-4 rounded border-[#3f3f46] bg-[#111111] text-[#7c3aed] focus:ring-[#7c3aed]/40"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-medium text-white">{role.name}</p>
                                                    <Badge variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
                                                        {role.slug}
                                                    </Badge>
                                                </div>
                                                {role.permissions?.length ? (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {role.permissions.map((permission) => (
                                                            <Badge key={permission.id} variant="secondary" className="font-mono text-[11px] text-white">
                                                                {permission.slug}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="mt-2 text-xs text-[#71717a]">No permissions attached yet.</p>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        {form.formState.errors.app_role_ids ? (
                            <p className="mt-2 text-xs text-danger">{form.formState.errors.app_role_ids.message}</p>
                        ) : null}
                    </div>
                </form>

                {isLoading && <LoadingSpinner size="sm" />}
                {isError && (
                    <div className="rounded-xl border border-dashed border-[#27272a] bg-[#18181b] p-4 text-sm text-[#71717a]">
                        Failed to load invitations.
                    </div>
                )}
                {!isLoading && !isError && invitations.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#27272a] bg-[#18181b] p-4 text-sm text-[#71717a]">
                        No invitations yet.
                    </div>
                )}

                <div className="space-y-3">
                    {invitations.map((invitation) => {
                        const isPending = invitation.status === 'pending';
                        return (
                            <div key={invitation.id} className="space-y-3 rounded-xl border border-[#27272a] bg-[#111111] p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium text-white">{invitation.email}</p>
                                            <Badge variant={badgeVariantForStatus(invitation.status)}>{invitation.status}</Badge>
                                            <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>
                                                {invitation.role}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-[#a1a1aa]">
                                            Expires {formatDate(invitation.expires_at)}
                                        </p>
                                        <p className="break-all font-mono text-xs text-[#71717a]">{invitation.accept_url}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <CopyButton
                                            value={invitation.accept_url}
                                            className="border border-[#27272a] bg-transparent text-white hover:bg-[#18181b]"
                                        />
                                        {isPending ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => resendInvitationMutation.mutate(invitation.id)}
                                                disabled={resendInvitationMutation.isPending}
                                                className="border-[#27272a] bg-transparent text-white hover:bg-[#18181b]"
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Resend
                                            </Button>
                                        ) : null}
                                        {isPending ? (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setRevokeTarget(invitation)}
                                                disabled={revokeInvitationMutation.isPending}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Revoke
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="grid gap-3 text-xs text-[#a1a1aa] md:grid-cols-3">
                                    <p>Invited by {invitation.invited_by_email || 'Unknown'}</p>
                                    <p>Accepted by {invitation.accepted_by_email || 'Not yet accepted'}</p>
                                    <p>Created {formatDate(invitation.created_at)}</p>
                                </div>

                                {invitation.project_name ? (
                                    <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-medium text-white">{invitation.project_name}</p>
                                            {invitation.project_slug ? (
                                                <Badge variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
                                                    {invitation.project_slug}
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {invitation.app_roles?.length ? (
                                                invitation.app_roles.map((role) => (
                                                    <Badge key={role.id} variant="secondary" className="text-white">
                                                        {role.name || role.slug}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-[#71717a]">No app roles were attached to this invitation.</p>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>

            <ConfirmDialog
                open={!!revokeTarget}
                onOpenChange={() => setRevokeTarget(null)}
                title="Revoke invitation"
                description={`Revoke the invite for ${revokeTarget?.email || 'this user'}? The current token will stop working immediately.`}
                confirmLabel="Revoke invitation"
                onConfirm={() => revokeInvitationMutation.mutate(revokeTarget.id)}
                isLoading={revokeInvitationMutation.isPending}
            />
        </>
    );
}
