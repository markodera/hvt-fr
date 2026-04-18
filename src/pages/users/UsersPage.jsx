import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Search, UserPlus, Users as UsersIcon } from 'lucide-react';

import { listUsers, updateUserRole } from '@/api/users';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { OrganizationInvitationsSection } from '@/pages/users/OrganizationInvitationsSection';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
            {Array.from({ length: 6 }).map((_, index) => (
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

function roleBadge(role) {
    if (role === 'owner') {
        return 'border border-[#7c3aed]/40 bg-[#7c3aed]/15 text-[#c4b5fd]';
    }
    if (role === 'admin') {
        return 'border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#c4b5fd]';
    }
    return 'border border-[#3f3f46] bg-[#111111] text-[#a1a1aa]';
}

function initialsForUser(user) {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    if (fullName) {
        return fullName
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('');
    }
    return (user.email || 'HV').slice(0, 2).toUpperCase();
}

function displayName(user) {
    return user.full_name?.trim() || user.email;
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
                {currentUser?.role === 'owner' && currentUser?.id !== user.id && user.role !== 'owner' ? (
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

export default function UsersPage() {
    usePageTitle('Users');
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page') || 1);
    const search = searchParams.get('search') || '';

    const { data, isLoading, isError } = useQuery({
        queryKey: ['users', { page, search }],
        queryFn: () => listUsers({ page, page_size: 10, search }),
    });

    const roleMutation = useMutation({
        mutationFn: ({ id, role }) => updateUserRole(id, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User role updated');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const users = useMemo(() => data?.results ?? [], [data]);

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
        document.getElementById('organization-invitations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return (
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
                        Invite user
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
                {!isLoading && !isError && users.length === 0 ? (
                    <EmptyState
                        message={
                            search
                                ? 'No users match this search yet.'
                                : 'No users yet. Invited teammates and runtime signups will appear here.'
                        }
                    />
                ) : null}
                {!isLoading && !isError && users.length > 0 ? (
                    <>
                        <div className="divide-y divide-[#27272a] md:hidden">
                            {users.map((user) => (
                                <div key={user.id} className="space-y-4 px-4 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#7c3aed]/40 bg-[#111111] text-xs font-semibold text-[#a78bfa]">
                                            {initialsForUser(user)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="break-words text-sm font-medium text-white">{displayName(user)}</p>
                                            <p className="break-all text-xs text-[#71717a]">{user.email}</p>
                                        </div>
                                        <UserActionsMenu user={user} currentUser={currentUser} roleMutation={roleMutation} />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleBadge(user.role)}`}>
                                            {user.role_display || user.role}
                                        </span>
                                        {user.project_slug ? (
                                            <span className="rounded-full border border-[#3f3f46] bg-[#111111] px-2 py-0.5 font-mono text-[11px] text-[#a78bfa]">
                                                {user.project_slug}
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-[#27272a] bg-[#111111] px-2 py-0.5 text-[11px] text-[#a1a1aa]">
                                                Org-wide
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 text-xs text-[#71717a] sm:grid-cols-2">
                                        <p>Status: {user.is_active ? 'Active user' : 'Inactive'}</p>
                                        <p>Joined: {formatDate(user.created_at, { hour: undefined, minute: undefined })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[880px]">
                                <thead>
                                    <tr className="border-b border-[#27272a] text-left text-[11px] uppercase tracking-[0.18em] text-[#71717a]">
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 font-medium">Role</th>
                                        <th className="px-4 py-3 font-medium">Project</th>
                                        <th className="px-4 py-3 font-medium">Joined</th>
                                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-[#27272a] last:border-b-0">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7c3aed]/40 bg-[#111111] text-xs font-semibold text-[#a78bfa]">
                                                        {initialsForUser(user)}
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
                                            <td className="px-4 py-3 text-sm text-[#a1a1aa]">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleBadge(user.role)}`}>
                                                    {user.role_display || user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.project_slug ? (
                                                    <span className="rounded-full border border-[#3f3f46] bg-[#111111] px-2 py-0.5 font-mono text-[11px] text-[#a78bfa]">
                                                        {user.project_slug}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-[#71717a]">Org-wide</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-[#71717a]">
                                                {formatDate(user.created_at, { hour: undefined, minute: undefined })}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <UserActionsMenu user={user} currentUser={currentUser} roleMutation={roleMutation} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : null}

                {data?.count ? (
                    <Pagination count={data.count} page={page} onPageChange={handlePageChange} />
                ) : null}
            </TableCard>

            {currentUser?.role === 'owner' ? (
                <div id="organization-invitations" className="scroll-mt-24">
                    <OrganizationInvitationsSection />
                </div>
            ) : null}
        </div>
    );
}
