import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MailPlus, Search, Trash2, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
    createRuntimeInvitation,
    listProjectRoles,
    listProjects,
    listRuntimeInvitations,
    revokeRuntimeInvitation,
} from '@/api/organizations';
import { listUsers } from '@/api/users';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { projectUserInvitationCreateSchema } from '@/lib/schemas';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { getUserDisplayName, getUserInitials } from '@/lib/userIdentity';

const selectClassName =
    'flex h-10 w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/25';

function normalizeCollection(data) {
    return data?.results ?? data ?? [];
}

function emptyInviteValues() {
    return {
        email: '',
        first_name: '',
        last_name: '',
        role_slugs: [],
    };
}

function badgeVariantForStatus(status) {
    if (status === 'accepted') return 'success';
    if (status === 'revoked') return 'danger';
    if (status === 'expired') return 'warning';
    return 'secondary';
}

function formatStatusLabel(status) {
    if (!status) {
        return 'Unknown';
    }

    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function extractFirstErrorMessage(value) {
    if (!value) {
        return '';
    }

    if (typeof value === 'string') {
        return value.trim();
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const nestedMessage = extractFirstErrorMessage(item);
            if (nestedMessage) {
                return nestedMessage;
            }
        }
        return '';
    }

    if (typeof value === 'object') {
        for (const nestedValue of Object.values(value)) {
            const nestedMessage = extractFirstErrorMessage(nestedValue);
            if (nestedMessage) {
                return nestedMessage;
            }
        }
    }

    return '';
}

function extractErrorSources(error) {
    const body = error?.body ?? error?.response?.data ?? null;

    return [error?.detail, body?.detail, body].filter(Boolean);
}

function findErrorMessage(error, fieldKeys = [], matcher = () => true) {
    const sources = extractErrorSources(error);

    for (const source of sources) {
        for (const fieldKey of fieldKeys) {
            const fieldMessage = extractFirstErrorMessage(source?.[fieldKey]);
            if (fieldMessage && matcher(fieldMessage)) {
                return fieldMessage;
            }
        }

        const generalMessage = extractFirstErrorMessage(source);
        if (generalMessage && matcher(generalMessage)) {
            return generalMessage;
        }
    }

    return '';
}

function getRateLimitMessage(error) {
    const sources = extractErrorSources(error);

    for (const source of sources) {
        const detail = source?.detail && typeof source.detail === 'object' ? source.detail : source;
        const message = typeof detail?.message === 'string' ? detail.message.trim() : '';
        const retryAfter = typeof detail?.retry_after_human === 'string' ? detail.retry_after_human.trim() : '';

        if (!message) {
            continue;
        }

        if (retryAfter) {
            return message.toLowerCase().includes(retryAfter.toLowerCase()) ? message : `${message} Try again in ${retryAfter}.`;
        }

        if (error?.status === 429 || error?.response?.status === 429 || /rate|too many/i.test(message)) {
            return message;
        }
    }

    return '';
}

function getProjectUserRoles(user, selectedProject) {
    const roles = Array.isArray(user?.app_roles) ? user.app_roles : [];
    return roles.filter((role) => !selectedProject?.slug || !role?.project_slug || role.project_slug === selectedProject.slug);
}

function getInvitationRoleLabels(invitation) {
    const roleCollections = [invitation?.roles, invitation?.assigned_roles, invitation?.app_roles];

    for (const collection of roleCollections) {
        if (Array.isArray(collection) && collection.length > 0) {
            return collection.map((role) => role?.name || role?.slug || 'Assigned role');
        }
    }

    if (Array.isArray(invitation?.role_slugs) && invitation.role_slugs.length > 0) {
        return invitation.role_slugs;
    }

    if (typeof invitation?.role_slug === 'string' && invitation.role_slug.trim()) {
        return [invitation.role_slug.trim()];
    }

    return [];
}

function isUserInSelectedProject(user, selectedProject) {
    if (!selectedProject) {
        return false;
    }

    return user?.project === selectedProject.id || (user?.project_slug && user.project_slug === selectedProject.slug);
}

function isInviteInSelectedProject(invitation, selectedProject) {
    if (!selectedProject) {
        return false;
    }

    if (invitation?.project || invitation?.project_id) {
        return (invitation.project || invitation.project_id) === selectedProject.id;
    }

    if (invitation?.project_slug) {
        return invitation.project_slug === selectedProject.slug;
    }

    return true;
}

function EmptyState({ message }) {
    return (
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#27272a] bg-[#111111] text-[#71717a]">
                <UsersIcon className="h-6 w-6" />
            </div>
            <p className="max-w-md text-sm leading-6 text-[#71717a]">{message}</p>
        </div>
    );
}

function Pagination({ count, page, onPageChange, pageSize = 10 }) {
    const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

    return (
        <div className="flex flex-col gap-3 border-t border-[#27272a] px-4 py-4 text-sm text-[#71717a] sm:flex-row sm:items-center sm:justify-between">
            <p>
                Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-[#27272a] px-3 text-white transition-colors hover:bg-[#111111] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Previous
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-[#27272a] px-3 text-white transition-colors hover:bg-[#111111] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export function ProjectUsersSection() {
    const queryClient = useQueryClient();
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [projectSearch, setProjectSearch] = useState('');
    const [projectPage, setProjectPage] = useState(1);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteSuccessEmail, setInviteSuccessEmail] = useState('');
    const [inviteSubmissionError, setInviteSubmissionError] = useState('');
    const [revokeTarget, setRevokeTarget] = useState(null);

    const form = useForm({
        resolver: zodResolver(projectUserInvitationCreateSchema),
        defaultValues: emptyInviteValues(),
    });

    const { data: projectsData, isLoading: projectsLoading, isError: projectsError } = useQuery({
        queryKey: ['projects', 'project-users'],
        queryFn: () => listProjects({ page_size: 100 }),
    });

    const projects = useMemo(() => normalizeCollection(projectsData), [projectsData]);

    useEffect(() => {
        if (!projects.length) {
            setSelectedProjectId('');
            return;
        }

        if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    useEffect(() => {
        setProjectPage(1);
    }, [projectSearch, selectedProjectId]);

    const selectedProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId) || null,
        [projects, selectedProjectId]
    );

    const { data: projectUsersData, isLoading: projectUsersLoading, isError: projectUsersError } = useQuery({
        queryKey: ['projectUsers', selectedProjectId, projectSearch, projectPage],
        queryFn: () =>
            listUsers({
                page: projectPage,
                page_size: 10,
                search: projectSearch || undefined,
                project: selectedProjectId,
            }),
        enabled: Boolean(selectedProjectId),
    });

    const projectUsers = useMemo(
        () => normalizeCollection(projectUsersData).filter((user) => isUserInSelectedProject(user, selectedProject)),
        [projectUsersData, selectedProject]
    );

    const { data: projectRolesData, isLoading: projectRolesLoading, isError: projectRolesError } = useQuery({
        queryKey: ['projectRoles', selectedProjectId, 'project-user-invite'],
        queryFn: () => listProjectRoles(selectedProjectId, { page_size: 100 }),
        enabled: inviteDialogOpen && Boolean(selectedProjectId),
    });

    const projectRoles = useMemo(() => normalizeCollection(projectRolesData), [projectRolesData]);
    const selectedRoleSlugs = form.watch('role_slugs') || [];

    const { data: invitationsData, isLoading: invitationsLoading, isError: invitationsError } = useQuery({
        queryKey: ['runtimeInvitations', selectedProjectId],
        queryFn: () => listRuntimeInvitations({ project: selectedProjectId, page_size: 50 }),
        enabled: Boolean(selectedProjectId),
    });

    const invitations = useMemo(
        () => normalizeCollection(invitationsData).filter((invitation) => isInviteInSelectedProject(invitation, selectedProject)),
        [invitationsData, selectedProject]
    );

    function resetInviteState() {
        setInviteSuccessEmail('');
        setInviteSubmissionError('');
        form.reset(emptyInviteValues());
        form.clearErrors();
    }

    function handleInviteDialogChange(open) {
        if (!open) {
            resetInviteState();
        }

        setInviteDialogOpen(open);
    }

    function toggleRole(roleSlug) {
        const nextRoleSlugs = selectedRoleSlugs.includes(roleSlug)
            ? selectedRoleSlugs.filter((value) => value !== roleSlug)
            : [...selectedRoleSlugs, roleSlug];

        form.setValue('role_slugs', nextRoleSlugs, {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    const createInvitationMutation = useMutation({
        mutationFn: createRuntimeInvitation,
        onSuccess: (_data, values) => {
            queryClient.invalidateQueries({ queryKey: ['projectUsers', selectedProjectId] });
            queryClient.invalidateQueries({ queryKey: ['runtimeInvitations', selectedProjectId] });
            setInviteSubmissionError('');
            setInviteSuccessEmail(values.email);
            toast.success('Invite email sent');
        },
        onError: (error) => {
            setInviteSubmissionError('');
            form.clearErrors();

            let handled = false;
            const duplicateEmailMessage = findErrorMessage(
                error,
                ['email'],
                (message) => message.toLowerCase().includes('already exists in this project')
            );

            if (duplicateEmailMessage) {
                form.setError('email', {
                    type: 'server',
                    message: duplicateEmailMessage,
                });
                handled = true;
            }

            const invalidRoleMessage = findErrorMessage(
                error,
                ['role_slugs', 'roles'],
                (message) => message.toLowerCase().includes('role slug')
            );

            if (invalidRoleMessage) {
                form.setError('role_slugs', {
                    type: 'server',
                    message: invalidRoleMessage,
                });
                handled = true;
            }

            const rateLimitMessage = getRateLimitMessage(error);
            if (rateLimitMessage) {
                setInviteSubmissionError(rateLimitMessage);
                handled = true;
            }

            if (!handled) {
                setInviteSubmissionError(getErrorMessage(error));
            }
        },
    });

    const revokeInvitationMutation = useMutation({
        mutationFn: revokeRuntimeInvitation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['runtimeInvitations', selectedProjectId] });
            setRevokeTarget(null);
            toast.success('Invite revoked');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    function handleSubmit(values) {
        form.clearErrors();
        setInviteSubmissionError('');

        createInvitationMutation.mutate({
            email: values.email.trim(),
            first_name: values.first_name.trim() || undefined,
            last_name: values.last_name.trim() || undefined,
            role_slugs: values.role_slugs || [],
        });
    }

    return (
        <>
            <section className="space-y-6 rounded-2xl border border-[#27272a] bg-[#18181b] p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <UsersIcon className="h-5 w-5 text-[#a78bfa]" />
                            <h2 className="text-lg font-bold text-white">Project users</h2>
                        </div>
                        <p className="max-w-3xl text-sm text-[#a1a1aa]">
                            Manage the people who belong to one project. These users are separate from dashboard teammates and only receive the project roles you assign here.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                        <div className="min-w-0 sm:min-w-[260px]">
                            <select
                                value={selectedProjectId}
                                onChange={(event) => setSelectedProjectId(event.target.value)}
                                className={selectClassName}
                                disabled={projectsLoading || projects.length === 0}
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
                </div>

                {selectedProject ? (
                    <div className="rounded-xl border border-[#27272a] bg-[#111111] px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-white">{selectedProject.name}</p>
                            <Badge variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
                                {selectedProject.slug}
                            </Badge>
                        </div>
                        <p className="mt-2 text-sm text-[#71717a]">
                            Project invites and role assignments in this section are scoped to this project only.
                        </p>
                    </div>
                ) : null}

                {projectsLoading ? (
                    <div className="flex justify-center py-10">
                        <LoadingSpinner />
                    </div>
                ) : projectsError ? (
                    <div className="rounded-xl border border-dashed border-[#27272a] bg-[#111111] p-4 text-sm text-[#71717a]">
                        Projects could not be loaded right now.
                    </div>
                ) : projects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#27272a] bg-[#111111] p-4 text-sm text-[#71717a]">
                        Create a project before inviting or managing project users.
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-white">Users in this project</h3>
                                    <p className="mt-1 text-sm text-[#71717a]">
                                        Search and review the users who already belong to {selectedProject?.name || 'this project'}.
                                    </p>
                                </div>
                                <div className="relative w-full max-w-md">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
                                    <Input
                                        value={projectSearch}
                                        onChange={(event) => setProjectSearch(event.target.value)}
                                        placeholder="Search project users by name or email"
                                        className="h-10 border-[#27272a] bg-[#111111] pl-10 text-white placeholder:text-[#71717a] focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                                    />
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-[#27272a] bg-[#111111]">
                                {projectUsersLoading ? (
                                    <div className="space-y-3 px-4 py-4">
                                        {Array.from({ length: 4 }).map((_, index) => (
                                            <div key={index} className="h-20 animate-pulse rounded-xl bg-[#18181b]" />
                                        ))}
                                    </div>
                                ) : null}
                                {!projectUsersLoading && projectUsersError ? (
                                    <EmptyState message="Project users could not be loaded right now." />
                                ) : null}
                                {!projectUsersLoading && !projectUsersError && projectUsers.length === 0 ? (
                                    <EmptyState
                                        message={
                                            projectSearch
                                                ? 'No project users match this search yet.'
                                                : 'No users belong to this project yet. Send an invite to bring someone in.'
                                        }
                                    />
                                ) : null}
                                {!projectUsersLoading && !projectUsersError && projectUsers.length > 0 ? (
                                    <>
                                        <div className="divide-y divide-[#27272a] md:hidden">
                                            {projectUsers.map((user) => {
                                                const scopedRoles = getProjectUserRoles(user, selectedProject);
                                                return (
                                                    <div key={user.id} className="space-y-4 px-4 py-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#7c3aed]/40 bg-[#111111] text-xs font-semibold text-[#a78bfa]">
                                                                {getUserInitials(user)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="break-words text-sm font-medium text-white">{getUserDisplayName(user)}</p>
                                                                <p className="break-all text-xs text-[#71717a]">{user.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] uppercase tracking-[0.18em] text-[#71717a]">Roles</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {scopedRoles.length > 0 ? (
                                                                    scopedRoles.map((role) => (
                                                                        <Badge key={role.id || role.slug} variant="secondary" className="text-white">
                                                                            {role.name || role.slug}
                                                                        </Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-sm text-[#71717a]">No roles assigned</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3 text-xs text-[#71717a] sm:grid-cols-2">
                                                            <p>Status: {user.is_active ? 'Active user' : 'Inactive'}</p>
                                                            <p>Joined: {formatDate(user.created_at, { hour: undefined, minute: undefined })}</p>
                                                        </div>
                                                        <Button asChild variant="outline" className="w-full border-[#27272a] bg-transparent text-white hover:bg-[#18181b]">
                                                            <Link to={`/dashboard/users/${user.id}`}>View details</Link>
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="hidden overflow-x-auto md:block">
                                            <table className="w-full min-w-[980px] table-fixed">
                                                <thead>
                                                    <tr className="border-b border-[#27272a] text-left text-[11px] uppercase tracking-[0.18em] text-[#71717a]">
                                                        <th className="w-[28%] px-4 py-3 font-medium">Name</th>
                                                        <th className="w-[28%] px-4 py-3 font-medium">Email</th>
                                                        <th className="w-[22%] px-4 py-3 font-medium">Roles</th>
                                                        <th className="w-[12%] px-4 py-3 font-medium whitespace-nowrap">Joined</th>
                                                        <th className="w-[10%] px-4 py-3 font-medium text-right whitespace-nowrap">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {projectUsers.map((user) => {
                                                        const scopedRoles = getProjectUserRoles(user, selectedProject);
                                                        return (
                                                            <tr key={user.id} className="border-b border-[#27272a] last:border-b-0">
                                                                <td className="px-4 py-3 align-top">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7c3aed]/40 bg-[#111111] text-xs font-semibold text-[#a78bfa]">
                                                                            {getUserInitials(user)}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-sm font-medium text-white">
                                                                                {getUserDisplayName(user)}
                                                                            </p>
                                                                            <p className="truncate text-xs text-[#71717a]">
                                                                                {user.is_active ? 'Active user' : 'Inactive'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top text-sm text-[#a1a1aa]">
                                                                    <span className="block truncate" title={user.email}>
                                                                        {user.email}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {scopedRoles.length > 0 ? (
                                                                            scopedRoles.map((role) => (
                                                                                <Badge key={role.id || role.slug} variant="secondary" className="text-white">
                                                                                    {role.name || role.slug}
                                                                                </Badge>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-sm text-[#71717a]">No roles assigned</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top font-mono text-xs text-[#71717a] whitespace-nowrap">
                                                                    {formatDate(user.created_at, { hour: undefined, minute: undefined })}
                                                                </td>
                                                                <td className="px-4 py-3 align-top text-right">
                                                                    <Button asChild variant="outline" size="sm" className="border-[#27272a] bg-transparent text-white hover:bg-[#18181b]">
                                                                        <Link to={`/dashboard/users/${user.id}`}>View details</Link>
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : null}

                                {projectUsersData?.count ? (
                                    <Pagination count={projectUsersData.count} page={projectPage} onPageChange={setProjectPage} />
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-semibold text-white">Pending invites</h3>
                                <p className="mt-1 text-sm text-[#71717a]">
                                    Review the invites sent for {selectedProject?.name || 'this project'} and revoke any that should no longer be accepted.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {invitationsLoading ? (
                                    <div className="flex justify-center rounded-xl border border-[#27272a] bg-[#111111] py-10">
                                        <LoadingSpinner />
                                    </div>
                                ) : null}
                                {!invitationsLoading && invitationsError ? (
                                    <div className="rounded-xl border border-dashed border-[#27272a] bg-[#111111] p-4 text-sm text-[#71717a]">
                                        Pending invites could not be loaded right now.
                                    </div>
                                ) : null}
                                {!invitationsLoading && !invitationsError && invitations.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-[#27272a] bg-[#111111] p-4 text-sm text-[#71717a]">
                                        No invites have been sent for this project yet.
                                    </div>
                                ) : null}
                                {!invitationsLoading && !invitationsError && invitations.length > 0
                                    ? invitations.map((invitation) => {
                                          const roleLabels = getInvitationRoleLabels(invitation);
                                          const isPending = invitation.status === 'pending';

                                          return (
                                              <div key={invitation.id} className="rounded-xl border border-[#27272a] bg-[#111111] p-4">
                                                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                      <div className="space-y-3">
                                                          <div className="flex flex-wrap items-center gap-2">
                                                              <p className="font-medium text-white">{invitation.email}</p>
                                                              <Badge variant={badgeVariantForStatus(invitation.status)}>
                                                                  {formatStatusLabel(invitation.status)}
                                                              </Badge>
                                                          </div>
                                                          <div className="flex flex-wrap gap-2">
                                                              {roleLabels.length > 0 ? (
                                                                  roleLabels.map((label, index) => (
                                                                      <Badge
                                                                          key={`${invitation.id}-${label}-${index}`}
                                                                          variant="secondary"
                                                                          className="text-white"
                                                                      >
                                                                          {label}
                                                                      </Badge>
                                                                  ))
                                                              ) : (
                                                                  <span className="text-sm text-[#71717a]">No roles pre-assigned</span>
                                                              )}
                                                          </div>
                                                      </div>

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

                                                  <div className="mt-4 grid gap-3 text-xs text-[#a1a1aa] sm:grid-cols-2 lg:grid-cols-4">
                                                      <p>Date sent: {formatDate(invitation.created_at, { hour: undefined, minute: undefined })}</p>
                                                      <p>Status: {formatStatusLabel(invitation.status)}</p>
                                                      <p>Accepted: {invitation.accepted_at ? formatDate(invitation.accepted_at) : 'Not accepted'}</p>
                                                      <p>Revoked: {invitation.revoked_at ? formatDate(invitation.revoked_at) : 'Not revoked'}</p>
                                                  </div>
                                              </div>
                                          );
                                      })
                                    : null}
                            </div>
                        </div>
                    </>
                )}
            </section>

            <Dialog open={inviteDialogOpen} onOpenChange={handleInviteDialogChange}>
                <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain max-w-2xl border-[#27272a] bg-[#111111] !p-4 text-white sm:w-full sm:!p-6">
                    <DialogHeader>
                        <DialogTitle>Invite user</DialogTitle>
                        <DialogDescription className="text-[#71717a]">
                            Send an invite for {selectedProject?.name || 'the selected project'} and pre-assign any project roles they should receive after accepting.
                        </DialogDescription>
                    </DialogHeader>

                    {inviteSuccessEmail ? (
                        <div className="space-y-5 pt-4 sm:pt-5">
                            <div className="rounded-xl border border-[#14532d] bg-[#052e16] p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#86efac]" />
                                    <div>
                                        <p className="text-sm font-semibold text-white">Invite email sent</p>
                                        <p className="mt-1 text-sm text-[#bbf7d0]">
                                            {inviteSuccessEmail} will receive an email with instructions for joining this project.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleInviteDialogChange(false)}
                                    className="w-full border-[#27272a] bg-transparent text-white hover:bg-[#18181b] sm:w-auto"
                                >
                                    Done
                                </Button>
                                <Button
                                    type="button"
                                    onClick={resetInviteState}
                                    className="w-full bg-[#7c3aed] text-white hover:bg-[#6d28d9] sm:w-auto"
                                >
                                    Invite another user
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4 sm:pt-5">
                            {inviteSubmissionError ? (
                                <div className="rounded-xl border border-[#7f1d1d] bg-[#2a0b0b] p-4 text-sm text-[#fca5a5]">
                                    {inviteSubmissionError}
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <Label htmlFor="project-user-invite-email" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                    Email
                                </Label>
                                <Input
                                    id="project-user-invite-email"
                                    type="email"
                                    placeholder="teacher@example.com"
                                    className="border-[#27272a] bg-[#18181b] text-white placeholder:text-[#71717a]"
                                    {...form.register('email')}
                                />
                                {form.formState.errors.email ? (
                                    <p className="text-xs text-danger">{form.formState.errors.email.message}</p>
                                ) : null}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="project-user-invite-first-name" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                        First name
                                    </Label>
                                    <Input
                                        id="project-user-invite-first-name"
                                        placeholder="Ada"
                                        className="border-[#27272a] bg-[#18181b] text-white placeholder:text-[#71717a]"
                                        {...form.register('first_name')}
                                    />
                                    {form.formState.errors.first_name ? (
                                        <p className="text-xs text-danger">{form.formState.errors.first_name.message}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="project-user-invite-last-name" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                        Last name
                                    </Label>
                                    <Input
                                        id="project-user-invite-last-name"
                                        placeholder="Lovelace"
                                        className="border-[#27272a] bg-[#18181b] text-white placeholder:text-[#71717a]"
                                        {...form.register('last_name')}
                                    />
                                    {form.formState.errors.last_name ? (
                                        <p className="text-xs text-danger">{form.formState.errors.last_name.message}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Roles</Label>
                                    {selectedProject?.slug ? (
                                        <span className="font-mono text-xs text-[#a78bfa]">{selectedProject.slug}</span>
                                    ) : null}
                                </div>

                                <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
                                    {projectRolesLoading ? (
                                        <div className="flex justify-center py-6">
                                            <LoadingSpinner size="sm" />
                                        </div>
                                    ) : projectRolesError ? (
                                        <div className="rounded-xl border border-dashed border-[#27272a] bg-[#111111] p-4 text-sm text-[#71717a]">
                                            Roles could not be loaded for this project. You can retry or send the invite without pre-assigning roles.
                                        </div>
                                    ) : projectRoles.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-[#27272a] bg-[#111111] p-4 text-sm text-[#71717a]">
                                            No roles exist for this project yet. You can still send the invite now and assign roles later.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {projectRoles.map((role) => {
                                                const checked = selectedRoleSlugs.includes(role.slug);

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
                                                            onChange={() => toggleRole(role.slug)}
                                                            className="mt-1 h-4 w-4 rounded border-[#3f3f46] bg-[#111111] text-[#7c3aed] focus:ring-[#7c3aed]/40"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-sm font-medium text-white">{role.name}</p>
                                                                <Badge variant="secondary" className="font-mono text-[11px] text-[#c4b5fd]">
                                                                    {role.slug}
                                                                </Badge>
                                                                {role.is_self_assignable ? (
                                                                    <Badge variant="secondary" className="text-white">
                                                                        Self-assignable
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                            {role.description ? (
                                                                <p className="mt-1 text-xs text-[#71717a]">{role.description}</p>
                                                            ) : null}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {form.formState.errors.role_slugs ? (
                                    <p className="text-xs text-danger">{form.formState.errors.role_slugs.message}</p>
                                ) : null}
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleInviteDialogChange(false)}
                                    className="w-full border-[#27272a] bg-transparent text-white hover:bg-[#18181b] sm:w-auto"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createInvitationMutation.isPending || !selectedProjectId}
                                    className="w-full bg-[#7c3aed] text-white hover:bg-[#6d28d9] sm:w-auto"
                                >
                                    <MailPlus className="mr-2 h-4 w-4" />
                                    {createInvitationMutation.isPending ? 'Sending...' : 'Send invite'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!revokeTarget}
                onOpenChange={() => setRevokeTarget(null)}
                title="Revoke invite"
                description={`Revoke the invite for ${revokeTarget?.email || 'this user'}? They will no longer be able to accept it.`}
                confirmLabel="Revoke invite"
                onConfirm={() => revokeInvitationMutation.mutate(revokeTarget.id)}
                isLoading={revokeInvitationMutation.isPending}
            />
        </>
    );
}
