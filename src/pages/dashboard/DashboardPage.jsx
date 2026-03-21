import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    Key,
    ScrollText,
    Activity,
    AlertTriangle,
    ArrowRight,
    ShieldAlert,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { SkeletonRow } from '@/components/SkeletonRow';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { listAuditLogs } from '@/api/auditLogs';
import { listUsers } from '@/api/users';
import { listApiKeys } from '@/api/apiKeys';
import { formatRelativeTime, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';

function formatActor(log) {
    return log.actor_email || log.actor_api_key_name || 'System';
}

export function DashboardPage() {
    const { user } = useAuth();
    const { completedCount, totalCount, isComplete } = useOnboarding(user?.organization);
    const isOwner = user?.role === 'owner';
    const canViewUsers = user?.role === 'owner' || user?.role === 'admin';
    const canViewApiKeys = user?.role === 'owner';
    const canViewAuditLogs = user?.role === 'owner' || user?.role === 'admin';

    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['users', { page: 1, page_size: 1 }],
        queryFn: () => listUsers({ page: 1, page_size: 1 }),
        enabled: canViewUsers,
    });

    const { data: keysData, isLoading: keysLoading } = useQuery({
        queryKey: ['apiKeys', { page: 1, page_size: 1 }],
        queryFn: () => listApiKeys({ page: 1, page_size: 1 }),
        enabled: canViewApiKeys,
    });

    const {
        data: auditData,
        isLoading: auditLoading,
        isError: auditError,
        error: auditQueryError,
        refetch: refetchAudit,
        isFetching: auditRefreshing,
    } = useQuery({
        queryKey: ['auditLogs', { page: 1, page_size: 5 }],
        queryFn: () => listAuditLogs({ page: 1, page_size: 5 }),
        enabled: canViewAuditLogs,
    });

    const recentEvents = auditData?.results ?? [];
    const auditErrorMessage = getErrorMessage(auditQueryError);
    const auditStatusCode = auditQueryError?.response?.status;

    return (
        <div className="space-y-8">
            <section className="rounded-xl border border-border bg-bg-secondary p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-text-secondary">Workspace overview</p>
                        <h2 className="text-2xl font-extrabold text-text-primary">{user?.full_name || user?.email || 'Dashboard'}</h2>
                        <p className="mt-1 text-sm text-text-muted">Track usage, keys, and security activity in one place.</p>
                    </div>
                    {canViewAuditLogs && (
                        <Button asChild>
                            <Link to="/dashboard/audit-logs" className="inline-flex items-center gap-2">
                                Open audit logs
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </section>
            {isOwner && !isComplete && (
                <section className="rounded-xl border border-primary/40 bg-primary/10 p-4 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-text-primary">Finish onboarding checklist</p>
                        <p className="text-xs text-text-secondary mt-1">
                            {completedCount}/{totalCount} setup steps complete.
                        </p>
                    </div>
                    <Button asChild size="sm">
                        <Link to="/dashboard/get-started">Continue setup</Link>
                    </Button>
                </section>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total Users"
                    value={!canViewUsers ? 'N/A' : usersLoading ? '…' : usersData?.count ?? '—'}
                    icon={Users}
                    description={canViewUsers ? 'registered users' : 'owner/admin only'}
                />
                <StatCard
                    title="API Keys"
                    value={!canViewApiKeys ? 'N/A' : keysLoading ? '…' : keysData?.count ?? '—'}
                    icon={Key}
                    description={canViewApiKeys ? 'active keys' : 'owner only'}
                />
                <StatCard
                    title="Recent Events"
                    value={!canViewAuditLogs ? 'N/A' : auditLoading ? '…' : auditData?.count ?? '—'}
                    icon={Activity}
                    description={canViewAuditLogs ? 'total audit events' : 'owner/admin only'}
                />
            </div>

            <section className="rounded-xl border border-border bg-bg-secondary p-4">
                <h3 className="text-sm font-semibold text-text-primary">Quick actions</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                    {canViewUsers && <Button asChild size="sm" variant="outline"><Link to="/dashboard/users">Manage users</Link></Button>}
                    {canViewApiKeys && <Button asChild size="sm" variant="outline"><Link to="/dashboard/api-keys">Create API key</Link></Button>}
                    {canViewAuditLogs && <Button asChild size="sm" variant="outline"><Link to="/dashboard/audit-logs">View audit logs</Link></Button>}
                    {!canViewUsers && !canViewApiKeys && !canViewAuditLogs && (
                        <p className="text-xs text-text-secondary">No admin actions are available for your current role.</p>
                    )}
                </div>
            </section>

            <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-text-primary">Recent Activity</h2>
                    {canViewAuditLogs && !auditError && (
                        <StatusBadge status="active" label={auditRefreshing ? 'Refreshing…' : 'Live'} />
                    )}
                </div>

                {!canViewAuditLogs ? (
                    <div className="px-6 py-10 text-center">
                        <ShieldAlert className="mx-auto h-6 w-6 text-warning" />
                        <p className="mt-2 text-sm font-medium text-text-primary">You don't have access to audit logs.</p>
                        <p className="mt-1 text-xs text-text-secondary">Ask your organisation owner/admin if you need this view.</p>
                    </div>
                ) : (
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
                                        <td colSpan={4} className="px-4 py-8">
                                            <div className="mx-auto max-w-xl rounded-lg border border-warning/40 bg-warning/5 p-4 text-center">
                                                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-warning">
                                                    <AlertTriangle className="h-4 w-4" />
                                                </div>
                                                <p className="text-sm font-semibold text-text-primary">Couldn&apos;t load recent activity</p>
                                                <p className="mt-1 text-xs text-text-secondary">
                                                    {auditStatusCode ? `HTTP ${auditStatusCode} — ` : ''}{auditErrorMessage}
                                                </p>
                                                <Button size="sm" variant="outline" className="mt-3" onClick={() => refetchAudit()}>
                                                    Retry
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!auditLoading && !auditError && recentEvents.length === 0 && (
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
                                {recentEvents.map((log) => (
                                    <tr key={log.id} className="border-b border-border hover:bg-bg-tertiary/50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-text-primary font-medium">{log.event_type}</td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">{formatActor(log)}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={log.success ? 'active' : 'failed'} label={log.success ? 'Success' : 'Failed'} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-muted">{formatRelativeTime(log.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
