import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { Search, Users as UsersIcon } from 'lucide-react';
import { listUsers } from '@/api/users';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/Pagination';
import { SkeletonRow } from '@/components/SkeletonRow';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { ResourcePageHeader } from '@/components/ResourcePageHeader';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';

export function UsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';

    const { data, isLoading, isError } = useQuery({
        queryKey: ['users', { page, search }],
        queryFn: () => listUsers({ page, search, page_size: 10 }),
        placeholderData: keepPreviousData,
    });

    const setPage = (newPage) => {
        setSearchParams((prev) => {
            prev.set('page', newPage);
            return prev;
        });
    };

    const setSearch = (value) => {
        setSearchParams((prev) => {
            if (value) {
                prev.set('search', value);
            } else {
                prev.delete('search');
            }
            prev.set('page', '1');
            return prev;
        });
    };

    return (
        <div className="space-y-6">
            <ResourcePageHeader
                title="Users"
                description="Manage organization members and account status."
            />

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Table */}
            <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary">
                            <tr>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">User</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Role</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Status</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonRow key={i} columns={4} />
                            ))}
                            {isError && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-secondary">
                                        Failed to load users.
                                    </td>
                                </tr>
                            )}
                            {data?.results?.length === 0 && (
                                <tr>
                                    <td colSpan={4}>
                                        <EmptyState
                                            icon={UsersIcon}
                                            title="No users found"
                                            description={search ? 'Try a different search term.' : 'Users will appear here once they register.'}
                                            actionLabel={search ? 'Clear search' : undefined}
                                            onAction={search ? () => setSearch('') : undefined}
                                        />
                                    </td>
                                </tr>
                            )}
                            {data?.results?.map((user) => (
                                <tr key={user.id} className="border-b border-border hover:bg-bg-tertiary/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link to={`/dashboard/users/${user.id}`} className="flex items-center gap-3 group">
                                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                                                    {user.full_name || user.email}
                                                </p>
                                                <p className="text-xs text-text-muted">{user.email}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                                            {ROLE_LABELS[user.role] || user.role}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-muted">
                                        {formatDate(user.created_at, { hour: undefined, minute: undefined })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data && (
                    <Pagination
                        count={data.count}
                        page={page}
                        pageSize={10}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </div>
    );
}
