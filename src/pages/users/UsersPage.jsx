import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Search, UserPlus, Users as UsersIcon } from 'lucide-react';

import { listUsers, updateUserRole } from '@/api/users';
import { PermissionDenied } from '@/components/PermissionDenied';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { OrganizationInvitationsSection } from '@/pages/users/OrganizationInvitationsSection';
import { ProjectUsersSection } from '@/pages/users/ProjectUsersSection';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getUserDisplayName, getUserInitials } from '@/lib/userIdentity';

const DASHBOARD_TEAM_PAGE_SIZE = 10;

function TableCard({ children }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-[#27272a] bg-[#18181b]">
            {children}
        </section>
    );
}

function SkeletonRow() {
    return (
        <tr className="border-b border-[#27272a] last:border-b-0">
            {Array.from({ length: 7 }).map((_, index) => (
                <td key={index} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-[#1c1c1f]" />
                </td>
            ))}
        </tr>
    );
}

function EmptyState({ message }) {
    return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#27272a] bg-[#111111] text-[#71717a]">
                <UsersIcon className="h-6 w-6" />
            </div>
            <p className="max-w-md text-sm leading-6 text-[#71717a]">{message}</p>
        </div>
    );
}

function accessBadgeClass(user) {
    if (user?.project) {
        return 'border border-[#0f766e]/40 bg-[#0f766e]/15 text-[#99f6e4]';
    }
    if (user?.role === 'owner') {
        return 'border border-[#7c3aed]/40 bg-[#7c3aed]/15 text-[#c4b5fd]';
    }
    if (user?.role === 'admin') {
        return 'border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#c4b5fd]';
    }
    return 'border border-[#3f3f46] bg-[#111111] text-[#a1a1aa]';
}

function getAccessLabel(user) {
    if (user?.project) {
        return 'Project user';
    }

    return user?.role_display || user?.role;
}

function displayName(user) {
    return getUserDisplayName(user);
}

function getUserAppRoles(user) {
    return Array.isArray(user?.app_roles) ? user.app_roles : [];
}

function getAppRoleLabel(user, appRole) {
    const baseLabel = appRole?.name || appRole?.slug || 'Assigned role';
    if (!appRole?.project_slug || appRole.project_slug === user?.project_slug) {
        return baseLabel;
    }
    return `${appRole.project_slug}: ${baseLabel}`;
}

function AppRolesBadges({ user, limit = 2, className = '' }) {
    const appRoles = getUserAppRoles(user);

    if (appRoles.length === 0) {
        return <span className={`text-sm text-[#71717a] ${className}`.trim()}>No app role</span>;
    }

    const visibleRoles = appRoles.slice(0, limit);
    const remainingCount = appRoles.length - visibleRoles.length;

    return (
        <div className={`flex flex-wrap gap-1.5 ${className}`.trim()}>
            {visibleRoles.map((appRole) => (
                <span
                    key={appRole.id}
                    className="inline-flex max-w-full items-center whitespace-nowrap rounded-full border border-[#3f3f46] bg-[#111111] px-2 py-0.5 text-[11px] font-medium text-[#d4d4d8]"
                    title={getAppRoleLabel(user, appRole)}
                >
                    {getAppRoleLabel(user, appRole)}
                </span>
            ))}
            {remainingCount > 0 ? (
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-[#27272a] bg-[#18181b] px-2 py-0.5 text-[11px] text-[#a1a1aa]">
                    +{remainingCount} more
                </span>
            ) : null}
        </div>
    );
}

function ProjectBadge({ projectSlug }) {
    if (!projectSlug) {
        return <span className="text-sm text-[#71717a]">Org-wide</span>;
    }

    return (
        <span
            className="inline-flex items-center whitespace-nowrap rounded-full border border-[#3f3f46] bg-[#111111] px-2 py-0.5 font-mono text-[11px] text-[#a78bfa]"
            title={projectSlug}
        >
            {projectSlug}
        </span>
    );
}

function truncateMiddle(value, start = 14, end = 12) {
    const normalized = String(value || '');
    if (normalized.length <= start + end + 3) {
        return normalized;
    }
    return `${normalized.slice(0, start)}...${normalized.slice(-end)}`;
}

function formatCompactDate(value) {
    if (!value) {
        return 'Unknown';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            day: 'numeric',
            month: 'short',
        }).format(new Date(value));
    } catch {
        return formatDate(value, { hour: undefined, minute: undefined });
    }
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

function UserActionsMenu({ user, currentUser, roleMutation }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-[#27272a] bg-[#111111] text-white hover:bg-[#18181b]"
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-[#27272a] bg-[#18181b]">
                <DropdownMenuItem asChild>
                    <Link to={`/dashboard/users/${user.id}`}>View details</Link>
                </DropdownMenuItem>
                {!user.project && currentUser?.role === 'owner' && currentUser?.id !== user.id && user.role !== 'owner' ? (
                    <>
                        {user.role !== 'admin' ? (
                            <DropdownMenuItem onClick={() => roleMutation.mutate({ id: user.id, role: 'admin' })}>
                                Make admin
                            </DropdownMenuItem>
                        ) : null}
                        {user.role !== 'member' ? (
                            <DropdownMenuItem onClick={() => roleMutation.mutate({ id: user.id, role: 'member' })}>
                                Make member
                            </DropdownMenuItem>
                        ) : null}
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

import { usePageTitle } from '@/hooks/usePageTitle';

function TabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                    ? 'border-[#7c3aed] text-white'
                    : 'border-transparent text-[#71717a] hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

export default function UsersPage() {
    usePageTitle('Users');
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const activeTab = searchParams.get('tab') || 'platform';
    const page = Number(searchParams.get('page') || 1);
    const search = searchParams.get('search') || '';

    function setTab(tab) {
        const params = new URLSearchParams(searchParams);
        params.set('tab', tab);
        params.delete('page');
        params.delete('search');
        setSearchParams(params);
    }

    const { data, isLoading, isError } = useQuery({
        queryKey: ['platformUsers', { search }],
        queryFn: () => listUsers({ page: 1, page_size: 200, search }),
    });

    const roleMutation = useMutation({
        mutationFn: ({ id, role }) => updateUserRole(id, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platformUsers'] });
            toast.success('User role updated');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    // Filter to only platform users (those without a project)
    const platformUsers = useMemo(() => {
        const results = data?.results ?? [];
        return results.filter((user) => !user.project && !user.project_id);
    }, [data]);

    const usersCount = platformUsers.length;
    const users = useMemo(() => {
        const start = (Math.max(page, 1) - 1) * DASHBOARD_TEAM_PAGE_SIZE;
        return platformUsers.slice(start, start + DASHBOARD_TEAM_PAGE_SIZE);
    }, [platformUsers, page]);

    // Check if user has permission to access users (owner or admin for platform users)
    // Project-scoped users can view their project members
    if (!currentUser || (!currentUser.is_project_scoped && !['owner', 'admin'].includes(currentUser.role))) {
        return <PermissionDenied featureName="Users" />;
    }

    function updateParams(next) {
        const params = new URLSearchParams(searchParams);
        Object.entries(next).forEach(([key, value]) => {
            if (value === '' || value === null || value === undefined) {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });
        setSearchParams(params);
    }

    function handleSearchChange(value) {
        updateParams({ search: value || null, page: 1 });
    }

    function handlePageChange(nextPage) {
        updateParams({ page: nextPage });
    }

    function scrollToInvites() {
        document.getElementById('dashboard-team-invitations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-[#27272a]">
                <div className="flex gap-2">
                    <TabButton active={activeTab === 'platform'} onClick={() => setTab('platform')}>
                        Dashboard Team
                    </TabButton>
                    <TabButton active={activeTab === 'runtime'} onClick={() => setTab('runtime')}>
                        Project Users
                    </TabButton>
                </div>
            </div>

            {/* Platform Users Tab */}
            {activeTab === 'platform' && (
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
                            <Input
                                value={search}
                                onChange={(event) => handleSearchChange(event.target.value)}
                                placeholder="Search users by name or email"
                                className="h-10 border-[#27272a] bg-[#18181b] pl-10 text-white placeholder:text-[#71717a] focus:border-[#7c3aed] focus:ring-[#7c3aed]/25"
                            />
                        </div>
                        {currentUser?.role === 'owner' ? (
                            <button
                                type="button"
                                onClick={scrollToInvites}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#7c3aed] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9] sm:w-auto"
                            >
                                <UserPlus className="h-4 w-4" />
                                Invite teammate
                            </button>
                        ) : null}
                    </div>

                    <TableCard>
                        {isLoading ? (
                            <div className="space-y-3 px-4 py-4">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="h-20 animate-pulse rounded-xl bg-[#111111]" />
                                ))}
                            </div>
                        ) : null}
                        {!isLoading && isError ? (
                            <EmptyState message="Users could not be loaded right now." />
                        ) : null}
                        {!isLoading && !isError && usersCount === 0 ? (
                            <EmptyState
                                message={
                                    search
                                        ? 'No users match this search yet.'
                                        : 'No teammates yet. Invite someone to help manage this organisation.'
                                }
                            />
                        ) : null}
                        {!isLoading && !isError && usersCount > 0 ? (
                            <>
                                <div className="divide-y divide-[#27272a] md:hidden">
                                    {users.map((user) => (
                                        <div key={user.id} className="space-y-4 px-4 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#7c3aed]/40 bg-[#111111] text-xs font-semibold text-[#a78bfa]">
                                                    {getUserInitials(user)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="break-words text-sm font-medium text-white">{displayName(user)}</p>
                                                    <p className="break-all text-xs text-[#71717a]">{user.email}</p>
                                                </div>
                                                <UserActionsMenu user={user} currentUser={currentUser} roleMutation={roleMutation} />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${accessBadgeClass(user)}`}>
                                                    {getAccessLabel(user)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 text-xs text-[#71717a] sm:grid-cols-2">
                                                <p>Status: {user.is_active ? 'Active user' : 'Inactive'}</p>
                                                <p>Joined: {formatDate(user.created_at, { hour: undefined, minute: undefined })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full min-w-[900px] table-fixed">
                                        <thead>
                                            <tr className="border-b border-[#27272a] text-left text-[11px] uppercase tracking-[0.18em] text-[#71717a]">
                                                <th className="w-[28%] px-3 py-3 font-medium">Name</th>
                                                <th className="w-[40%] px-3 py-3 font-medium">Email</th>
                                                <th className="w-[15%] px-3 py-3 font-medium whitespace-nowrap">Role</th>
                                                <th className="w-[12%] px-3 py-3 font-medium whitespace-nowrap">Joined</th>
                                                <th className="w-[5%] px-3 py-3 font-medium text-right whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id} className="border-b border-[#27272a] last:border-b-0">
                                                    <td className="px-3 py-3 align-top">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7c3aed]/40 bg-[#111111] text-xs font-semibold text-[#a78bfa]">
                                                                {getUserInitials(user)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-white">
                                                                    {displayName(user)}
                                                                </p>
                                                                <p className="truncate text-xs text-[#71717a]">
                                                                    {user.is_active ? 'Active user' : 'Inactive'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 align-top text-sm text-[#a1a1aa]" title={user.email}>
                                                        <span className="block truncate">{truncateMiddle(user.email, 16, 12)}</span>
                                                    </td>
                                                    <td className="px-3 py-3 align-top">
                                                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${accessBadgeClass(user)}`}>
                                                            {getAccessLabel(user)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 align-top font-mono text-xs text-[#71717a] whitespace-nowrap">
                                                        {formatCompactDate(user.created_at)}
                                                    </td>
                                                    <td className="px-3 py-3 align-top text-right">
                                                        <UserActionsMenu user={user} currentUser={currentUser} roleMutation={roleMutation} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : null}

                        {usersCount ? (
                            <Pagination
                                count={usersCount}
                                page={page}
                                onPageChange={handlePageChange}
                                pageSize={DASHBOARD_TEAM_PAGE_SIZE}
                            />
                        ) : null}
                    </TableCard>

                    {currentUser?.role === 'owner' ? (
                        <div id="dashboard-team-invitations" className="scroll-mt-24">
                            <OrganizationInvitationsSection />
                        </div>
                    ) : null}
                </div>
            )}

            {/* Project Users Tab */}
            {activeTab === 'runtime' && (
                <>
                    {(currentUser?.role === 'owner' || currentUser?.role === 'admin') ? <ProjectUsersSection /> : null}
                </>
            )}
        </div>
    );
}
