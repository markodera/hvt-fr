import { useQuery } from '@tanstack/react-query';
import { Users, Key, ScrollText, Activity } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { SkeletonRow } from '@/components/SkeletonRow';
import { EmptyState } from '@/components/EmptyState';
import { listAuditLogs } from '@/api/auditLogs';
import { listUsers } from '@/api/users';
import { listApiKeys } from '@/api/apiKeys';
import { formatRelativeTime } from '@/lib/utils';

export function DashboardPage() {
    const { data: usersData } = useQuery({
        queryKey: ['users', { page: 1, page_size: 1 }],
        queryFn: () => listUsers({ page: 1, page_size: 1 }),
    });

    const { data: keysData } = useQuery({
        queryKey: ['apiKeys', { page: 1, page_size: 1 }],
        queryFn: () => listApiKeys({ page: 1, page_size: 1 }),
    });

    const {
        data: auditData,
        isLoading: auditLoading,
        isError: auditError,
    } = useQuery({
        queryKey: ['auditLogs', { page: 1, page_size: 5 }],
        queryFn: () => listAuditLogs({ page: 1, page_size: 5 }),
    });

    return (
        <div className="space-y-8">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Total Users"
                    value={usersData?.count ?? '—'}
                    icon={Users}
                    description="registered users"
                />
                <StatCard
                    title="API Keys"
                    value={keysData?.count ?? '—'}
                    icon={Key}
                    description="active keys"
                />
                <StatCard
                    title="Recent Events"
                    value={auditData?.count ?? '—'}
                    icon={Activity}
                    description="total audit events"
                />
            </div>

            {/* Recent audit log */}
            <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Recent Activity</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary">
                            <tr>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Event</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Actor</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Status</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditLoading && Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonRow key={i} columns={4} />
                            ))}
                            {auditError && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-secondary">
                                        Failed to load recent activity.
                                    </td>
                                </tr>
                            )}
                            {auditData?.results?.length === 0 && (
                                <tr>
                                    <td colSpan={4}>
                                        <EmptyState
                                            icon={ScrollText}
                                            title="No activity yet"
                                            description="Events will appear here as users interact with the platform."
                                        />
                                    </td>
                                </tr>
                            )}
                            {auditData?.results?.map((log) => (
                                <tr key={log.id} className="border-b border-border hover:bg-bg-tertiary/50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-text-primary font-medium">{log.event_type}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{log.actor_email}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={log.success ? 'active' : 'failed'} label={log.success ? 'Success' : 'Failed'} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-muted">{formatRelativeTime(log.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
